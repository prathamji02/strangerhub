import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// POST /api/reports - Submit a new report
router.post('/', protect, async (req, res) => {
  const { reportedId, chatHistory, reason } = req.body;
  const reporterId = req.user.id;

  if (!reportedId || !chatHistory) {
    return res.status(400).json({ error: 'reportedId and chatHistory are required.' });
  }

  try {
    await prisma.report.create({
      data: {
        reporterId,
        reportedId,
        chatHistory,
        reason: reason || 'No reason provided.',
        logType: 'USER_REPORT',
      },
    });
    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (error) {
    console.error('Failed to submit report:', error);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

export default router;

