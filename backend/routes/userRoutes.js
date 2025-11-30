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

// POST /api/users/block
router.post('/block', protect, async (req, res) => {
  const { blockedId } = req.body;
  const blockerId = req.user.id;

  if (!blockedId) {
    return res.status(400).json({ error: 'blockedId is required.' });
  }
  if (blockerId === blockedId) {
    return res.status(400).json({ error: 'You cannot block yourself.' });
  }

  try {
    await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
    res.status(201).json({ message: 'User blocked successfully.' });
  } catch (error) {
    // P2002 is the Prisma code for a unique constraint violation (already blocked)
    if (error.code === 'P2002') {
      return res.status(200).json({ message: 'User was already blocked.' });
    }
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

export default router;