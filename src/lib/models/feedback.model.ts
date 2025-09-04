import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  content: string;
  author?: string;
  email?: string;
  submittedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  content: { type: String, required: true, trim: true },
  author: { type: String, required: false, trim: true },
  email: { type: String, required: false, trim: true },
  submittedAt: { type: Date, default: () => new Date() },
});

export const FeedbackModel: Model<IFeedback> =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>("Feedback", FeedbackSchema);
