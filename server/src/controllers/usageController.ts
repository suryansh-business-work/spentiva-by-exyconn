import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Usage from '../models/Usage';
import UsageLog from '../models/UsageLog';

/**
 * Get overall usage statistics for a user
 */
export const getOverallUsage = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log('[Overall Usage] Fetching for user:', userId);

    // Get overall statistics
    const overallStats = await Usage.aggregate([
      {
        $match: { userId: userObjectId }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$totalMessages' },
          totalTokens: { $sum: '$totalTokens' },
          userMessages: { $sum: '$userMessages' },
          aiMessages: { $sum: '$aiMessages' }
        }
      }
    ]);

    // Get statistics grouped by tracker (including deleted ones)
    const byTracker = await Usage.aggregate([
      {
        $match: { userId: userObjectId }
      },
      {
        $group: {
          _id: '$trackerSnapshot.trackerId',
          trackerName: { $first: '$trackerSnapshot.trackerName' },
          trackerType: { $first: '$trackerSnapshot.trackerType' },
          isDeleted: { $first: '$trackerSnapshot.isDeleted' },
          deletedAt: { $first: '$trackerSnapshot.deletedAt' },
          messageCount: { $sum: '$totalMessages' },
          tokenCount: { $sum: '$totalTokens' }
        }
      },
      {
        $sort: { messageCount: -1 }
      }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Usage.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$date',
          messageCount: { $sum: '$totalMessages' },
          tokenCount: { $sum: '$totalTokens' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          messageCount: 1,
          tokenCount: 1
        }
      }
    ]);

    const overall = overallStats.length > 0 
      ? overallStats[0] 
      : { totalMessages: 0, totalTokens: 0, userMessages: 0, aiMessages: 0 };

    const response = {
      overall: {
        totalMessages: overall.totalMessages || 0,
        totalTokens: overall.totalTokens || 0,
        userMessages: overall.userMessages || 0,
        aiMessages: overall.aiMessages || 0
      },
      byTracker: byTracker.map(tracker => ({
        trackerId: tracker._id,
        trackerName: tracker.trackerName,
        trackerType: tracker.trackerType,
        isDeleted: tracker.isDeleted || false,
        deletedAt: tracker.deletedAt,
        messageCount: tracker.messageCount,
        tokenCount: tracker.tokenCount
      })),
      recentActivity
    };

    console.log('[Overall Usage] Response:', {
      totalMessages: response.overall.totalMessages,
      trackersCount: response.byTracker.length,
      deletedTrackers: response.byTracker.filter(t => t.isDeleted).length
    });

    res.json(response);
  } catch (error) {
    console.error('[Overall Usage] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get usage statistics for a specific tracker
 */
export const getTrackerUsage = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { trackerId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log('[Tracker Usage] Fetching for:', { userId, trackerId });

    // Get tracker statistics
    const trackerStats = await Usage.aggregate([
      {
        $match: {
          userId: userObjectId,
          'trackerSnapshot.trackerId': trackerId
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$totalMessages' },
          totalTokens: { $sum: '$totalTokens' },
          userMessages: { $sum: '$userMessages' },
          aiMessages: { $sum: '$aiMessages' },
          trackerName: { $first: '$trackerSnapshot.trackerName' },
          trackerType: { $first: '$trackerSnapshot.trackerType' },
          isDeleted: { $first: '$trackerSnapshot.isDeleted' },
          deletedAt: { $first: '$trackerSnapshot.deletedAt' }
        }
      }
    ]);

    if (trackerStats.length === 0) {
      // No usage data yet, but tracker exists - return empty structure
      // Try to get tracker info from TrackerModel
      const TrackerModel = (await import('../models/Tracker')).default;
      const tracker = await TrackerModel.findOne({ _id: trackerId, userId: userObjectId });
      
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
      }

      return res.json({
        tracker: {
          trackerId,
          trackerName: tracker.name,
          trackerType: tracker.type,
          isDeleted: false,
          deletedAt: null
        },
        usage: {
          totalMessages: 0,
          totalTokens: 0,
          userMessages: 0,
          aiMessages: 0
        },
        dailyUsage: [],
        messages: []
      });
    }

    // Get daily usage
    const dailyUsage = await Usage.aggregate([
      {
        $match: {
          userId: userObjectId,
          'trackerSnapshot.trackerId': trackerId
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $limit: 30
      },
      {
        $project: {
          _id: 0,
          date: 1,
          messageCount: '$totalMessages',
          tokenCount: '$totalTokens'
        }
      }
    ]);

    // Get recent messages (from UsageLog)
    const messages = await UsageLog.find({
      userId: userObjectId,
      'trackerSnapshot.trackerId': trackerId
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .select('messageRole messageContent tokenCount timestamp')
      .lean();

    const stats = trackerStats[0];
    const response = {
      tracker: {
        trackerId,
        trackerName: stats.trackerName,
        trackerType: stats.trackerType,
        isDeleted: stats.isDeleted || false,
        deletedAt: stats.deletedAt
      },
      usage: {
        totalMessages: stats.totalMessages,
        totalTokens: stats.totalTokens,
        userMessages: stats.userMessages,
        aiMessages: stats.aiMessages
      },
      dailyUsage,
      messages: messages.map(msg => ({
        _id: msg._id,
        role: msg.messageRole,
        content: msg.messageContent,
        tokenCount: msg.tokenCount,
        timestamp: msg.timestamp
      }))
    };

    console.log('[Tracker Usage] Response:', {
      trackerId,
      totalMessages: response.usage.totalMessages,
      isDeleted: response.tracker.isDeleted,
      messagesCount: response.messages.length
    });

    res.json(response);
  } catch (error) {
    console.error('[Tracker Usage] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get logs for a specific tracker
 */
export const getTrackerLogs = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { trackerId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log('[Tracker Logs] Fetching for:', { 
      userId, 
      trackerId, 
      limit: Number(limit), 
      offset: Number(offset) 
    });

    // Get total count
    const totalCount = await UsageLog.countDocuments({
      userId: userObjectId,
      'trackerSnapshot.trackerId': trackerId
    });

    // Get paginated logs
    const logs = await UsageLog.find({
      userId: userObjectId,
      'trackerSnapshot.trackerId': trackerId
    })
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .select('messageRole messageContent tokenCount timestamp trackerSnapshot')
      .lean();

    const response = {
      totalCount,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: totalCount > Number(offset) + Number(limit),
      logs: logs.map(log => ({
        _id: log._id,
        role: log.messageRole,
        content: log.messageContent,
        tokenCount: log.tokenCount,
        timestamp: log.timestamp,
        tracker: {
          trackerId: log.trackerSnapshot.trackerId,
          trackerName: log.trackerSnapshot.trackerName,
          trackerType: log.trackerSnapshot.trackerType,
          isDeleted: log.trackerSnapshot.isDeleted || false
        }
      }))
    };

    console.log('[Tracker Logs] Response:', {
      trackerId,
      totalCount,
      returnedCount: logs.length,
      hasMore: response.hasMore
    });

    res.json(response);
  } catch (error) {
    console.error('[Tracker Logs] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
