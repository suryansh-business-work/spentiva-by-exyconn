import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  amount: number;
  category: string;
  subcategory: string;
  categoryId: string;
  paymentMethod: string;
  description?: string;
  timestamp: Date;
  userId?: string;
  trackerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subcategory: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: String,
      required: true,
      trim: true
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    trackerId: {
      type: String,
      trim: true,
      default: 'default'
    },
    userId: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ExpenseSchema.index({ timestamp: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ categoryId: 1 });
ExpenseSchema.index({ trackerId: 1 });
ExpenseSchema.index({ userId: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
