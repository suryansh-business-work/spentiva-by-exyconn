import mongoose, { Document, Schema } from 'mongoose';

// Store tracker information snapshot at the time of usage
interface ITrackerSnapshot {
  trackerId: string;
  trackerName: string;
  trackerType: string; // 'business' or 'personal'
  isDeleted: boolean;
  deletedAt?: Date;
  modifiedAt?: Date;
}

// Daily usage summary per tracker
export interface IUsage extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // Date only (no time)
  trackerSnapshot: ITrackerSnapshot;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrackerSnapshotSchema = new Schema({
  trackerId: { type: String, required: true },
  trackerName: { type: String, required: true },
  trackerType: { type: String, required: true, enum: ['business', 'personal'] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  modifiedAt: { type: Date }
}, { _id: false });

const UsageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  trackerSnapshot: { type: TrackerSnapshotSchema, required: true },
  totalMessages: { type: Number, default: 0 },
  userMessages: { type: Number, default: 0 },
  aiMessages: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound index for efficient queries
UsageSchema.index({ userId: 1, date: 1, 'trackerSnapshot.trackerId': 1 }, { unique: true });

export default mongoose.model<IUsage>('Usage', UsageSchema);
