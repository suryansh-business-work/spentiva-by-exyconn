import mongoose from 'mongoose';
import Usage from '../models/Usage';
import UsageLog from '../models/UsageLog';

interface TrackerSnapshot {
  trackerId: string;
  trackerName: string;
  trackerType: string;
  isDeleted: boolean;
  deletedAt?: Date;
  modifiedAt?: Date;
}

/**
 * Create tracker snapshot from tracker data
 */
export function createTrackerSnapshot(tracker: any): TrackerSnapshot {
  return {
    trackerId: tracker._id.toString(),
    trackerName: tracker.name,
    trackerType: tracker.type,
    isDeleted: false,
    modifiedAt: new Date()
  };
}

/**
 * Log a message to both Usage (daily summary) and UsageLog (detailed log)
 */
export async function logUsage(
  userId: string | mongoose.Types.ObjectId,
  trackerSnapshot: TrackerSnapshot,
  messageRole: 'user' | 'assistant',
  messageContent: string,
  tokenCount: number
): Promise<void> {
  try {
    console.log('📝 [logUsage] Starting...', {
      userId: userId.toString(),
      trackerId: trackerSnapshot.trackerId,
      trackerName: trackerSnapshot.trackerName,
      messageRole,
      tokenCount,
      contentLength: messageContent.length
    });

    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    // 1. Create detailed log entry
    console.log('📝 [logUsage] Creating UsageLog entry...');
    const logEntry = await UsageLog.create({
      userId: userObjectId,
      trackerSnapshot,
      messageRole,
      messageContent,
      tokenCount,
      timestamp: new Date()
    });
    console.log('✅ [logUsage] UsageLog entry created:', logEntry._id);

    // 2. Update or create daily usage summary
    console.log('📝 [logUsage] Updating Usage summary...');
    const updateFields = {
      $inc: {
        totalMessages: 1,
        totalTokens: tokenCount,
        ...(messageRole === 'user' ? { userMessages: 1 } : { aiMessages: 1 })
      },
      $setOnInsert: {
        userId: userObjectId,
        date: today,
        trackerSnapshot
      }
    };

    const usageDoc = await Usage.findOneAndUpdate(
      {
        userId: userObjectId,
        date: today,
        'trackerSnapshot.trackerId': trackerSnapshot.trackerId
      },
      updateFields,
      { upsert: true, new: true }
    );
    console.log('✅ [logUsage] Usage summary updated:', usageDoc._id);

    console.log(`✅ Logged usage for tracker: ${trackerSnapshot.trackerName}`);
  } catch (error) {
    console.error('❌ Error logging usage:', error);
    throw error;
  }
}

/**
 * Mark tracker as deleted in all usage records
 * This should be called when a tracker is deleted
 */
export async function markTrackerAsDeleted(trackerId: string): Promise<void> {
  try {
    const deletedAt = new Date();

    // Update Usage records
    await Usage.updateMany(
      { 'trackerSnapshot.trackerId': trackerId },
      {
        $set: {
          'trackerSnapshot.isDeleted': true,
          'trackerSnapshot.deletedAt': deletedAt
        }
      }
    );

    // Update UsageLog records
    await UsageLog.updateMany(
      { 'trackerSnapshot.trackerId': trackerId },
      {
        $set: {
          'trackerSnapshot.isDeleted': true,
          'trackerSnapshot.deletedAt': deletedAt
        }
      }
    );

    console.log(`✅ Marked tracker ${trackerId} as deleted in usage records`);
  } catch (error) {
    console.error('❌ Error marking tracker as deleted:', error);
    throw error;
  }
}

/**
 * Update tracker information in all usage records
 * This should be called when a tracker is renamed or modified
 */
export async function updateTrackerInUsage(
  trackerId: string,
  newName: string,
  newType: string
): Promise<void> {
  try {
    const modifiedAt = new Date();

    // Update Usage records
    await Usage.updateMany(
      { 'trackerSnapshot.trackerId': trackerId },
      {
        $set: {
          'trackerSnapshot.trackerName': newName,
          'trackerSnapshot.trackerType': newType,
          'trackerSnapshot.modifiedAt': modifiedAt
        }
      }
    );

    // Update UsageLog records
    await UsageLog.updateMany(
      { 'trackerSnapshot.trackerId': trackerId },
      {
        $set: {
          'trackerSnapshot.trackerName': newName,
          'trackerSnapshot.trackerType': newType,
          'trackerSnapshot.modifiedAt': modifiedAt
        }
      }
    );

    console.log(`✅ Updated tracker ${trackerId} information in usage records`);
  } catch (error) {
    console.error('❌ Error updating tracker in usage:', error);
    throw error;
  }
}
