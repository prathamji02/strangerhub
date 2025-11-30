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

router.post('/', protect, async (req, res) => {
  const { score, rateeId, review } = req.body;
  const raterId = req.user.id;

  if (!rateeId) {
    return res.status(400).json({ error: 'rateeId is required.' });
  }

  // A submission is only valid if it has a score OR a non-empty review.
  if (!score && (!review || review.trim() === '')) {
    return res.status(400).json({ error: 'A score or a review is required to submit.' });
  }

  try {
    await prisma.rating.create({
      data: {
        score: score || 0, // Store 0 if no score, but review is present
        review: review || '',
        raterId,
        rateeId,
      },
    });

    // Only recalculate average if a score was actually given
    if (score) {
        const aggregate = await prisma.rating.aggregate({
          _avg: { score: true },
          _count: { score: true },
          where: { 
            rateeId,
            score: { gt: 0 } // Only count actual ratings, not 0s
          },
        });

        await prisma.user.update({
          where: { id: rateeId },
          data: {
            averageRating: aggregate._avg.score || 0,
            ratingCount: aggregate._count.score || 0,
          },
        });
    }

    res.status(201).json({ message: 'Rating submitted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

export default router;

