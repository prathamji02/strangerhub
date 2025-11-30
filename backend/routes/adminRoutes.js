import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Middleware to protect routes and check for admin status
const adminProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

            if (user && user.isAdmin) {
                req.user = user;
                next();
            } else {
                res.status(403).json({ error: 'Not authorized as an admin.' });
            }
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

// GET /api/admin/check
router.get('/check', adminProtect, (req, res) => {
    res.status(200).json({ message: 'Admin access verified.' });
});

// GET /api/admin/reports
router.get('/reports', adminProtect, async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { fake_name: true } },
                reported: { select: { fake_name: true } },
            },
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports.' });
    }
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', adminProtect, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.report.delete({
            where: { id },
        });
        res.status(200).json({ message: 'Log deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete log.' });
    }
});

// GET /api/admin/users
router.get('/users', adminProtect, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, name: true, fake_name: true, enrollment_no: true,
                status: true, averageRating: true, ratingCount: true,email: true,phone_no: true, gender: true 
            },
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// POST /api/admin/ban - Toggles a user's status between BANNED and ACTIVE
router.post('/ban', adminProtect, async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Determine the new status
        const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
        
        await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
        });

        res.status(200).json({ message: `User has been ${newStatus.toLowerCase()}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user status.' });
    }
});

// POST /api/admin/freeze
router.post('/freeze', adminProtect, async (req, res) => {
    const { userId, durationInDays } = req.body;
    if (!userId || !durationInDays) {
        return res.status(400).json({ error: 'User ID and duration are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // If user is already frozen, unfreeze them. Otherwise, freeze them.
        if (user.status === 'FROZEN') {
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'ACTIVE', unfreezeAt: null },
            });
            return res.status(200).json({ message: 'User has been unfrozen.' });
        } else {
            const unfreezeDate = new Date();
            unfreezeDate.setDate(unfreezeDate.getDate() + parseInt(durationInDays, 10));

            await prisma.user.update({
                where: { id: userId },
                data: {
                    status: 'FROZEN',
                    unfreezeAt: unfreezeDate,
                },
            });
            return res.status(200).json({ message: `User frozen for ${durationInDays} days.` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user status.' });
    }
});

// GET /api/admin/chats/:userId
router.get('/chats/:userId', adminProtect, async (req, res) => {
    const { userId } = req.params;
    try {
        const userChats = await prisma.chatroom.findMany({
            where: {
                is_private: true,
                participants: { some: { id: userId } },
            },
            include: {
                participants: {
                    where: { id: { not: userId } },
                    select: { fake_name: true },
                },
            },
        });
        res.status(200).json(userChats);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user's chats." });
    }
});


// --- NEW ADMIN DIRECT MESSAGE ROUTE ---
// POST /api/admin/message - Sends a message from an admin to a user
router.post('/message', adminProtect, async (req, res) => {
    const { targetUserId, content } = req.body;
    const adminId = req.user.id;

    if (!targetUserId || !content) {
        return res.status(400).json({ error: 'Target user ID and message content are required.' });
    }

    try {
        // Find if a chat between the admin and user already exists
        let chatroom = await prisma.chatroom.findFirst({
            where: {
                is_private: true,
                participants: {
                    every: { id: { in: [adminId, targetUserId] } },
                },
            },
        });

        // If no chatroom exists, create one
        if (!chatroom) {
            chatroom = await prisma.chatroom.create({
                data: {
                    is_private: true,
                    participants: {
                        connect: [{ id: adminId }, { id: targetUserId }],
                    },
                },
            });
        }

        // Create the message in the chatroom
        await prisma.message.create({
            data: {
                content,
                sender_id: adminId,
                chatroom_id: chatroom.id,
            },
        });

        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});


// POST /api/admin/register
router.post('/register', adminProtect, async (req, res) => {
    const { enrollment_no, name, email, phone_no, gender } = req.body;
    if (!enrollment_no || !name || !email || !phone_no || !gender) {
        return res.status(400).json({ error: "All fields are required." });
    }
    try {
        const newUser = await prisma.user.create({
            data: { enrollment_no, name, email, phone_no, gender }
        });

         await sendWelcomeEmail(newUser.name, newUser.email, newUser.enrollment_no);

        res.status(201).json({ message: `User ${newUser.name} created successfully.` });
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta.target[0];
            return res.status(400).json({ error: `A user with this ${field.replace('_', ' ')} already exists.` });
        }
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

// POST /api/admin/users/upload
router.post('/users/upload', adminProtect, upload.single('userFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const users = xlsx.utils.sheet_to_json(sheet);
        let count = 0;
        for (const user of users) {
            try {
                await prisma.user.upsert({
                    where: { enrollment_no: String(user.enrollment_no) },
                    update: { name: user.name, email: user.mail_id, phone_no: String(user.phone_no), gender: user.gender },
                    create: { enrollment_no: String(user.enrollment_no), name: user.name, email: user.mail_id, phone_no: String(user.phone_no), gender: user.gender },
                });

                await sendWelcomeEmail(upsertedUser.name, upsertedUser.email, upsertedUser.enrollment_no);
                count++;
            } catch (e) {
                console.error(`Failed to process user: ${user.name}`, e);
            }
        }
        res.status(200).json({ message: `Upload complete. Processed ${count} users.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process file.' });
    }
});

export default router;

