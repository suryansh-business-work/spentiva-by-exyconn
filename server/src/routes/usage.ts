import express from 'express';
import { getOverallUsage, getTrackerUsage, getTrackerLogs } from '../controllers/usageController';
import { authenticate } from '../middleware/auth';
import MessageModel from '../models/Message';

const router = express.Router();

// Get overall usage statistics
router.get('/overall', authenticate, getOverallUsage);

// Get usage for a specific tracker
router.get('/tracker/:trackerId', authenticate, getTrackerUsage);

// Get logs for a specific tracker
router.get('/tracker/:trackerId/logs', authenticate, getTrackerLogs);

// Debug endpoint to check messages in database
router.get('/debug/messages', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    const messages = await MessageModel.find({ userId }).limit(10).sort({ timestamp: -1 });
    const count = await MessageModel.countDocuments({ userId });
    res.json({
      count,
      messages: messages.map(m => ({
        id: m._id,
        trackerId: m.trackerId,
        role: m.role,
        tokenCount: m.tokenCount,
        timestamp: m.timestamp,
        content: m.content.substring(0, 50)
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
