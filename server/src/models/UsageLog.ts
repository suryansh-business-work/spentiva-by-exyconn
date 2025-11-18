import mongoose, { Document, Schema } from 'mongoose';

// Detailed log entry for each message
interface ITrackerSnapshot {
  trackerId: string;
  trackerName: string;
  trackerType: string;
  isDeleted: boolean;
  deletedAt?: Date;
  modifiedAt?: Date;
}

export interface IUsageLog extends Document {
  userId: mongoose.Types.ObjectId;
  trackerSnapshot: ITrackerSnapshot;
  messageRole: 'user' | 'assistant';
  messageContent: string;
  tokenCount: number;
  timestamp: Date;
  createdAt: Date;
}

const TrackerSnapshotSchema = new Schema({
  trackerId: { type: String, required: true },
  trackerName: { type: String, required: true },
  trackerType: { type: String, required: true, enum: ['business', 'personal'] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  modifiedAt: { type: Date }
}, { _id: false });

const UsageLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trackerSnapshot: { type: TrackerSnapshotSchema, required: true },
  messageRole: { type: String, required: true, enum: ['user', 'assistant'] },
  messageContent: { type: String, required: true },
  tokenCount: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true }
}, {
  timestamps: true
});

// Compound index for efficient queries
UsageLogSchema.index({ userId: 1, timestamp: -1 });
UsageLogSchema.index({ userId: 1, 'trackerSnapshot.trackerId': 1, timestamp: -1 });

export default mongoose.model<IUsageLog>('UsageLog', UsageLogSchema);
