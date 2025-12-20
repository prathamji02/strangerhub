import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Waiting pools
let chatPool = [];
let videoPool = [];
let bothPool = [];

const activeRooms = new Map();
const onlineUsers = new Map();

export const setupSocketHandlers = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                next();
            } catch (error) {
                next(new Error("Authentication error"));
            }
        } else {
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        onlineUsers.set(userId, socket.id);
        io.emit('update_online_count', onlineUsers.size);
        console.log(`User ${userId} connected. Online: ${onlineUsers.size}`);

        // Log activity
        prisma.activityLog.create({
            data: {
                userId: userId,
                action: 'CONNECT'
            }
        }).catch(err => console.error("Failed to log activity:", err));

        socket.on('find_match', async ({ mode }) => {
            // mode: 'chat', 'video', 'both'
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return;

            // Remove from all pools first to avoid duplicates
            removeFromPools(userId);

            const blockedUserRecords = await prisma.block.findMany({
                where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
            });
            const blockedUserIds = new Set(blockedUserRecords.flatMap(b => [b.blockerId, b.blockedId]));

            let potentialPartner = null;
            let partnerPool = null;

            // Helper to find partner in a pool
            const find = (pool, requireCollege = false) => {
                return pool.find(p => {
                    const isBlocked = blockedUserIds.has(p.id);
                    if (isBlocked) return false;
                    if (requireCollege) return p.college === user.college;
                    return true;
                });
            };

            // Matching Logic with College Priority
            // 1. Try finding a partner with SAME COLLEGE
            if (user.college) {
                if (mode === 'chat') {
                    potentialPartner = find(chatPool, true) || find(bothPool, true);
                    if (potentialPartner && chatPool.includes(potentialPartner)) partnerPool = chatPool;
                    else if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                } else if (mode === 'video') {
                    potentialPartner = find(videoPool, true) || find(bothPool, true);
                    if (potentialPartner && videoPool.includes(potentialPartner)) partnerPool = videoPool;
                    else if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                } else if (mode === 'both') {
                    potentialPartner = find(bothPool, true) || find(videoPool, true) || find(chatPool, true);
                    if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                    else if (potentialPartner && videoPool.includes(potentialPartner)) partnerPool = videoPool;
                    else if (potentialPartner && chatPool.includes(potentialPartner)) partnerPool = chatPool;
                }
            }

            // 2. Fallback to ANY COLLEGE if no same-college match found
            if (!potentialPartner) {
                if (mode === 'chat') {
                    potentialPartner = find(chatPool) || find(bothPool);
                    if (potentialPartner && chatPool.includes(potentialPartner)) partnerPool = chatPool;
                    else if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                } else if (mode === 'video') {
                    potentialPartner = find(videoPool) || find(bothPool);
                    if (potentialPartner && videoPool.includes(potentialPartner)) partnerPool = videoPool;
                    else if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                } else if (mode === 'both') {
                    potentialPartner = find(bothPool) || find(videoPool) || find(chatPool);
                    if (potentialPartner && bothPool.includes(potentialPartner)) partnerPool = bothPool;
                    else if (potentialPartner && videoPool.includes(potentialPartner)) partnerPool = videoPool;
                    else if (potentialPartner && chatPool.includes(potentialPartner)) partnerPool = chatPool;
                }
            }

            if (potentialPartner) {
                // Remove partner from their pool
                if (partnerPool === chatPool) chatPool = chatPool.filter(p => p.id !== potentialPartner.id);
                if (partnerPool === videoPool) videoPool = videoPool.filter(p => p.id !== potentialPartner.id);
                if (partnerPool === bothPool) bothPool = bothPool.filter(p => p.id !== potentialPartner.id);

                const user1 = { socketId: socket.id, ...user, mode };
                const user2 = potentialPartner; // potentialPartner already has mode info if we stored it? 
                // We should store mode in the pool user object to know what kind of match it is?
                // Actually, if we matched, we know the common mode.
                // If I am Chat and match Both -> Mode is Chat.
                // If I am Video and match Both -> Mode is Video.
                // If I am Both and match Chat -> Mode is Chat.
                // If I am Both and match Video -> Mode is Video.
                // If I am Both and match Both -> Mode is Both (Video+Chat).

                let matchMode = 'chat';
                if (mode === 'video' || user2.mode === 'video') matchMode = 'video';
                if (mode === 'both' && user2.mode === 'both') matchMode = 'both';
                if ((mode === 'video' && user2.mode === 'both') || (mode === 'both' && user2.mode === 'video')) matchMode = 'video';
                // Wait, if I am Chat and partner is Both, we can only Chat.
                // If I am Video and partner is Both, we can only Video (assuming Both supports video).
                // If I am Both and partner is Chat, we can only Chat.

                // Refined Logic:
                // Common capabilities:
                // Chat: Text
                // Video: Video+Text (usually) or just Video? Assuming Video+Text.
                // Both: Video+Text.

                // If (Chat + Both) -> Chat (Text only)
                // If (Video + Both) -> Video
                // If (Both + Both) -> Video (Full capabilities)

                if (mode === 'chat' || user2.mode === 'chat') matchMode = 'chat';
                else matchMode = 'video'; // If neither is chat-only, then both support video.

                const roomId = `${user1.socketId}-${user2.socketId}`;
                activeRooms.set(roomId, { user1, user2, matchMode, chatHistory: [] });

                const socket1 = io.sockets.sockets.get(user1.socketId);
                const socket2 = io.sockets.sockets.get(user2.socketId);

                if (socket1 && socket2) {
                    socket1.join(roomId);
                    socket2.join(roomId);

                    // Send match details including the mode
                    io.to(user1.socketId).emit('chat_started', {
                        roomId,
                        matchMode,
                        shouldInitiate: true,
                        partner: { id: user2.id, fake_name: user2.fake_name, gender: user2.gender, averageRating: user2.averageRating, ratingCount: user2.ratingCount }
                    });
                    io.to(user2.socketId).emit('chat_started', {
                        roomId,
                        matchMode,
                        shouldInitiate: false,
                        partner: { id: user1.id, fake_name: user1.fake_name, gender: user1.gender, averageRating: user1.averageRating, ratingCount: user1.ratingCount }
                    });
                }
            } else {
                // Add to pool
                const poolUser = { socketId: socket.id, ...user, mode };
                if (mode === 'chat') chatPool.push(poolUser);
                else if (mode === 'video') videoPool.push(poolUser);
                else if (mode === 'both') bothPool.push(poolUser);
            }
        });

        socket.on('cancel_find_match', () => {
            removeFromPools(userId);
        });

        socket.on('join_chat', ({ roomId }) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room ${roomId}`);
        });

        socket.on('send_message', async ({ roomId, message, persistent }) => {
            const room = activeRooms.get(roomId);
            if (room && !persistent) {
                const sender = room.user1.socketId === socket.id ? room.user1 : room.user2;
                room.chatHistory.push({ sender: sender, text: message });
            }

            if (persistent) {
                try {
                    await prisma.message.create({
                        data: { content: message, chatroom_id: roomId, sender_id: userId }
                    });
                } catch (e) { console.error("Failed to save persistent message.", e) }
            }
            socket.to(roomId).emit('new_message', { text: message, roomId, senderId: userId });
        });

        socket.on('join_all_chats', async () => {
            try {
                const chats = await prisma.chatroom.findMany({
                    where: { participants: { some: { id: userId } } },
                    select: { id: true }
                });
                chats.forEach(chat => socket.join(chat.id));
                console.log(`User ${userId} joined ${chats.length} saved chats.`);
            } catch (e) {
                console.error("Failed to join saved chats", e);
            }
        });

        // Mutual Save Chat Logic
        socket.on('request_save_chat', ({ roomId }) => {
            const room = activeRooms.get(roomId);
            if (room) {
                socket.to(roomId).emit('save_chat_request', { requesterId: userId });
            }
        });

        socket.on('respond_save_chat', async ({ roomId, accept }) => {
            const room = activeRooms.get(roomId);
            if (!room) return;

            if (!accept) {
                socket.to(roomId).emit('save_chat_declined');
                return;
            }

            // Save to DB
            try {
                // Check if already saved? Maybe not needed, duplicates allowed or check unique participants?
                // For now, allow multiple saved chats (history snapshots).

                const chatroom = await prisma.chatroom.create({
                    data: {
                        is_private: true,
                        participants: {
                            connect: [
                                { id: room.user1.id },
                                { id: room.user2.id }
                            ]
                        }
                    }
                });

                const messageData = room.chatHistory.map(msg => ({
                    content: msg.text,
                    chatroom_id: chatroom.id,
                    sender_id: msg.sender.id,
                    created_at: new Date()
                }));

                if (messageData.length > 0) {
                    await prisma.message.createMany({ data: messageData });
                }

                // Notify both users
                io.to(roomId).emit('chat_saved', { chatroomId: chatroom.id });

            } catch (error) {
                console.error("Error saving mutual chat:", error);
                io.to(roomId).emit('error', 'Failed to save chat.');
            }
        });

        // WebRTC Signaling Events
        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', { offer, roomId });
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', { answer, roomId });
        });

        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice-candidate', { candidate, roomId });
        });

        socket.on('leave_chat', (roomId) => {
            endChatAndLog(roomId, io);
        });

        socket.on('delete_chat', async ({ chatId }) => {
            try {
                // Verify user is a participant
                const chatroom = await prisma.chatroom.findFirst({
                    where: {
                        id: chatId,
                        participants: { some: { id: socket.userId } }
                    }
                });

                if (!chatroom) return;

                // Hard delete the chatroom (and messages via cascade if configured, otherwise delete messages first)
                await prisma.message.deleteMany({ where: { chatroom_id: chatId } });
                await prisma.chatroom.delete({ where: { id: chatId } });

                // Notify all participants
                io.to(chatId).emit('chat_deleted', { chatId });
            } catch (error) {
                console.error('Error deleting chat:', error);
            }
        });

        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            io.emit('update_online_count', onlineUsers.size);
            console.log(`User ${userId} disconnected. Online: ${onlineUsers.size}`);

            removeFromPools(userId);

            let roomIdToEnd;
            for (const [roomId, room] of activeRooms.entries()) {
                if (room.user1.socketId === socket.id || room.user2.socketId === socket.id) {
                    roomIdToEnd = roomId;
                    break;
                }
            }
            if (roomIdToEnd) {
                endChatAndLog(roomIdToEnd, io);
            }
        });
    });
};

const removeFromPools = (userId) => {
    chatPool = chatPool.filter(u => u.id !== userId);
    videoPool = videoPool.filter(u => u.id !== userId);
    bothPool = bothPool.filter(u => u.id !== userId);
};

const findPartner = (pool, blockedUserIds) => {
    return pool.find(partner => !blockedUserIds.has(partner.id));
};

const endChatAndLog = async (roomId, io) => {
    const room = activeRooms.get(roomId);
    if (room) {
        if (room.chatHistory.length > 0) {
            await prisma.report.create({
                data: {
                    reporterId: room.user1.id,
                    reportedId: room.user2.id,
                    logType: 'CHAT_LOG',
                    chatHistory: room.chatHistory.map(msg => ({ sender: msg.sender.fake_name, text: msg.text })),
                    reason: `Chat log between ${room.user1.fake_name || room.user1.name} and ${room.user2.fake_name || room.user2.name}`
                }
            }).catch(console.error);
        }

        io.to(room.user1.socketId).emit('chat_ended', { partnerId: room.user2.id });
        io.to(room.user2.socketId).emit('chat_ended', { partnerId: room.user1.id });
        activeRooms.delete(roomId);
    }
};
