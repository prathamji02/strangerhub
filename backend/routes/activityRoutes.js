import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/activity/stats
// Returns activity counts for the last 7 days
router.get('/stats', async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch logs from the last 7 days
        const logs = await prisma.activityLog.findMany({
            where: {
                timestamp: {
                    gte: sevenDaysAgo
                },
                action: 'CONNECT' // We are interested in connections (traffic)
            },
            orderBy: {
                timestamp: 'asc'
            }
        });

        // Toggle aggregation: By Hour (for today?) or By Day (for week?)
        // Let's do a simple aggregation: Count per Day for the last 7 days
        // And maybe Count per Hour for the last 24 hours?
        // For the graph "past one week", daily counts are good.
        // User asked for "timewise" - maybe hourly is better if they want granularity?
        // Let's return raw-ish data or aggregated by hour for the whole week? 
        // 7 days * 24 hours = 168 points. That's renderable.

        // Let's aggregate by Hour
        const activityMap = new Map();

        logs.forEach(log => {
            // Round down to nearest hour
            const date = new Date(log.timestamp);
            date.setMinutes(0, 0, 0);
            const key = date.toISOString(); // Use ISO string as key

            activityMap.set(key, (activityMap.get(key) || 0) + 1);
        });

        // Transform map to array
        const data = Array.from(activityMap.entries()).map(([time, count]) => ({
            time,
            count
        })).sort((a, b) => new Date(a.time) - new Date(b.time));

        res.json(data);

    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ error: 'Failed to fetch activity stats' });
    }
});

// Cleanup Task: Delete logs older than 7 days
// Run every 24 hours (86400000 ms) or 1 hour (3600000 ms)
const CLEANUP_INTERVAL = 3600000; // 1 Hour

const cleanupOldLogs = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deleted = await prisma.activityLog.deleteMany({
            where: {
                timestamp: {
                    lt: sevenDaysAgo
                }
            }
        });

        if (deleted.count > 0) {
            console.log(`[ActivityLog] Cleaned up ${deleted.count} old records.`);
        }
    } catch (error) {
        console.error('Error cleaning up activity logs:', error);
    }
};

// Initial cleanup on server start
cleanupOldLogs();

// Schedule periodic cleanup
setInterval(cleanupOldLogs, CLEANUP_INTERVAL);

export default router;
