import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPenalty extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // Date when penalty was applied
  lateArrivalDate: Date; // The specific date when user was late
  clockInTime: string; // Actual clock-in time (HH:mm)
  timeLimit: string; // Time limit that was exceeded (HH:mm)
  maxLateDays: number; // Max late days allowed
  lateArrivalCount: number; // Total late arrivals in the month when penalty was applied
  penaltyAmount: number; // Penalty amount (e.g., 0.5 for casual leave deduction)
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const PenaltySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    lateArrivalDate: {
      type: Date,
      required: true,
    },
    clockInTime: {
      type: String,
      required: true,
    },
    timeLimit: {
      type: String,
      required: true,
    },
    maxLateDays: {
      type: Number,
      required: true,
      default: 0,
    },
    lateArrivalCount: {
      type: Number,
      required: true,
    },
    penaltyAmount: {
      type: Number,
      required: true,
      default: 0.5,
    },
    reason: {
      type: String,
      default: 'Late clock-in exceeded max late days limit',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PenaltySchema.index({ userId: 1, date: 1 });
PenaltySchema.index({ userId: 1, lateArrivalDate: 1 });

const Penalty: Model<IPenalty> = mongoose.models.Penalty || mongoose.model<IPenalty>('Penalty', PenaltySchema);

export default Penalty;

