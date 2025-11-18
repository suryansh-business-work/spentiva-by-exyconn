/**
 * Migration Script: Old Message Schema to New Usage/UsageLog Schema
 * 
 * This script migrates data from the old Message model to the new Usage and UsageLog models.
 * It preserves all historical data and creates proper tracker snapshots.
 * 
 * Run this script once after deploying the new schema.
 */

import mongoose from 'mongoose';
import MessageModel from '../models/Message';
import TrackerModel from '../models/Tracker';
import Usage from '../models/Usage';
import UsageLog from '../models/UsageLog';
import { createTrackerSnapshot } from '../utils/usageLogger';

interface OldMessage {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  trackerId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
  timestamp: Date;
}

export async function migrateOldMessagesToNewSchema() {
  try {
    console.log('🚀 Starting migration from Message to Usage/UsageLog...');

    // Get all old messages
    const oldMessages = await MessageModel.find({}).sort({ timestamp: 1 }).lean();
    
    if (oldMessages.length === 0) {
      console.log('✅ No messages to migrate');
      return;
    }

    console.log(`📊 Found ${oldMessages.length} messages to migrate`);

    // Get all trackers to create snapshots
    const trackers = await TrackerModel.find({}).lean();
    const trackerMap = new Map();
    
    for (const tracker of trackers) {
      trackerMap.set(tracker._id.toString(), createTrackerSnapshot(tracker));
    }

    console.log(`📦 Created snapshots for ${trackerMap.size} trackers`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Process messages in batches
    const batchSize = 100;
    for (let i = 0; i < oldMessages.length; i += batchSize) {
      const batch = oldMessages.slice(i, i + batchSize);
      
      const usageLogPromises = [];
      const usageUpdateMap = new Map();

      for (const message of batch) {
        // Skip if tracker doesn't exist (might have been deleted)
        let trackerSnapshot = trackerMap.get(message.trackerId);
        
        if (!trackerSnapshot) {
          // Create a snapshot for deleted tracker
          trackerSnapshot = {
            trackerId: message.trackerId,
            trackerName: 'Deleted Tracker',
            trackerType: 'personal',
            isDeleted: true,
            deletedAt: new Date()
          };
        }

        // 1. Create UsageLog entry
        usageLogPromises.push(
          UsageLog.create({
            userId: message.userId,
            trackerSnapshot,
            messageRole: message.role,
            messageContent: message.content,
            tokenCount: message.tokenCount,
            timestamp: message.timestamp
          })
        );

        // 2. Prepare Usage update
        const messageDate = new Date(message.timestamp);
        messageDate.setHours(0, 0, 0, 0);
        const dateKey = messageDate.toISOString();
        const usageKey = `${message.userId.toString()}_${message.trackerId}_${dateKey}`;

        if (!usageUpdateMap.has(usageKey)) {
          usageUpdateMap.set(usageKey, {
            userId: message.userId,
            trackerId: message.trackerId,
            date: messageDate,
            trackerSnapshot,
            totalMessages: 0,
            userMessages: 0,
            aiMessages: 0,
            totalTokens: 0
          });
        }

        const usage = usageUpdateMap.get(usageKey);
        usage.totalMessages++;
        usage.totalTokens += message.tokenCount;
        if (message.role === 'user') {
          usage.userMessages++;
        } else {
          usage.aiMessages++;
        }
      }

      // Execute UsageLog inserts
      await Promise.all(usageLogPromises);

      // Execute Usage updates
      const usagePromises = [];
      for (const usage of usageUpdateMap.values()) {
        usagePromises.push(
          Usage.findOneAndUpdate(
            {
              userId: usage.userId,
              date: usage.date,
              'trackerSnapshot.trackerId': usage.trackerId
            },
            {
              $inc: {
                totalMessages: usage.totalMessages,
                userMessages: usage.userMessages,
                aiMessages: usage.aiMessages,
                totalTokens: usage.totalTokens
              },
              $setOnInsert: {
                userId: usage.userId,
                date: usage.date,
                trackerSnapshot: usage.trackerSnapshot
              }
            },
            { upsert: true, new: true }
          )
        );
      }

      await Promise.all(usagePromises);

      migratedCount += batch.length;
      console.log(`✅ Migrated ${migratedCount}/${oldMessages.length} messages`);
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`   ✓ Migrated: ${migratedCount} messages`);
    console.log(`   ✗ Skipped: ${skippedCount} messages`);
    console.log(`\n⚠️  NOTE: Old Message collection is still intact.`);
    console.log(`   You can safely delete it after verifying the migration.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connected to MongoDB');
      await migrateOldMessagesToNewSchema();
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Connection error:', error);
      process.exit(1);
    });
}
