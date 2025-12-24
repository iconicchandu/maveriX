import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledEmail extends Document {
  userIds: mongoose.Types.ObjectId[];
  subject: string;
  html: string;
  scheduledFor?: Date; // Optional - if not set, it's an immediate send
  sent: boolean;
  sentAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledEmailSchema: Schema = new Schema(
  {
    userIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    },
    scheduledFor: {
      type: Date,
      required: false, // Optional - immediate sends don't have this
      index: true,
    },
    sent: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of unsent scheduled emails
ScheduledEmailSchema.index({ sent: 1, scheduledFor: 1 });

const ScheduledEmail: Model<IScheduledEmail> =
  mongoose.models.ScheduledEmail || mongoose.model<IScheduledEmail>('ScheduledEmail', ScheduledEmailSchema);

export default ScheduledEmail;

