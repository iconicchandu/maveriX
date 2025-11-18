import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeed extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  reactions: mongoose.Types.ObjectId[];
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    reactions: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      default: [],
    },
    mentions: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FeedSchema.index({ createdAt: -1 });
FeedSchema.index({ userId: 1 });

const Feed: Model<IFeed> =
  mongoose.models.Feed || mongoose.model<IFeed>('Feed', FeedSchema);

export default Feed;

