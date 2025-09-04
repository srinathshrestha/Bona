import connectMongoDB from "@/lib/mongodb";
import { FeedbackModel, IFeedback } from "@/lib/models/feedback.model";

export class FeedbackService {
  static async submit(content: string, author?: string, email?: string) {
    await connectMongoDB();
    const doc = new FeedbackModel({ content, author, email });
    await doc.save();
    return doc;
  }

  static async listAll(limit = 100) {
    await connectMongoDB();
    return FeedbackModel.find({}).sort({ submittedAt: -1 }).limit(limit).lean();
  }

  static async remove(id: string) {
    await connectMongoDB();
    return FeedbackModel.findByIdAndDelete(id).lean();
  }
}
