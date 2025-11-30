// backend/server.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// Configure CORS to specifically allow your Vercel frontend
const corsOptions = {
    origin: '*', // Allow all for testing
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

let waitingPool = [];
const activeRooms = new Map();
const onlineUsers = new Map();

io.use((socket, next) => {
    // ... (this logic is unchanged)
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

// Socket logic moved to socketHandlers.js
import { setupSocketHandlers } from './socketHandlers.js';
setupSocketHandlers(io);



// --- NEW: AUTOMATED TASK FOR UNFREEZING ---
const checkAndUnfreezeUsers = async () => {
    try {
        const now = new Date();
        const usersToUnfreeze = await prisma.user.findMany({
            where: {
                status: 'FROZEN',
                unfreezeAt: {
                    lte: now,
                },
            },
        });

        if (usersToUnfreeze.length > 0) {
            const userIds = usersToUnfreeze.map(user => user.id);
            await prisma.user.updateMany({
                where: {
                    id: { in: userIds },
                },
                data: {
                    status: 'ACTIVE',
                    unfreezeAt: null,
                },
            });
            console.log(`Auto-unfroze ${usersToUnfreeze.length} user(s).`);
        }
    } catch (error) {
        console.error('Error in unfreeze job:', error);
    }
};

// Run the unfreeze check every hour
setInterval(checkAndUnfreezeUsers, 3600 * 1000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
});