import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { ObjectIdSchema } from "./types";

// Zod validation schema for Message
export const MessageValidationSchema = z.object({
  content: z.string().min(1).max(2000),
  projectId: ObjectIdSchema,
  userId: ObjectIdSchema,
  replyToId: ObjectIdSchema.optional(),
  attachments: z
    .array(
      z.object({
        fileId: ObjectIdSchema,
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number().positive(),
      })
    )
    .optional(),
  mentions: z
    .array(
      z.object({
        userId: ObjectIdSchema,
        username: z.string(),
        displayName: z.string().optional(),
      })
    )
    .optional(),
});

// TypeScript interface for Message document
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  replyToId?: mongoose.Types.ObjectId;
  attachments?: Array<{
    fileId: mongoose.Types.ObjectId;
    filename: string;
    mimeType: string;
    fileSize: number;
  }>;
  mentions?: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    displayName?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Attachment sub-schema
const AttachmentSchema = new Schema(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
); // Don't create _id for sub-documents

// Mention sub-schema
const MentionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: false,
    },
  },
  { _id: false }
); // Don't create _id for sub-documents

// Mongoose schema for Message
const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyToId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
      validate: {
        validator: function (attachments: any[]) {
          return attachments.length <= 10; // Max 10 attachments per message
        },
        message: "A message can have at most 10 attachments",
      },
    },
    mentions: {
      type: [MentionSchema],
      default: [],
      validate: {
        validator: function (mentions: any[]) {
          return mentions.length <= 20; // Max 20 mentions per message
        },
        message: "A message can have at most 20 mentions",
      },
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

// Indexes for better performance
MessageSchema.index({ projectId: 1, createdAt: -1 }); // Project messages sorted by date
MessageSchema.index({ userId: 1, createdAt: -1 }); // User messages sorted by date
MessageSchema.index({ replyToId: 1 }); // Thread replies
MessageSchema.index({ projectId: 1, replyToId: 1 }); // Project threads
MessageSchema.index({ content: "text" }); // Text search

// Instance methods
MessageSchema.methods.toJSON = function () {
  const messageObject = this.toObject();
  delete messageObject.__v;
  return messageObject;
};

MessageSchema.methods.isReply = function (): boolean {
  return !!this.replyToId;
};

MessageSchema.methods.hasAttachments = function (): boolean {
  return this.attachments && this.attachments.length > 0;
};

MessageSchema.methods.getAttachmentCount = function (): number {
  return this.attachments ? this.attachments.length : 0;
};

// Static methods
MessageSchema.statics.findByProject = function (
  projectId: string,
  options: any = {}
) {
  const query = this.find({ projectId });

  // Filter out replies if requested (show only top-level messages)
  if (options.topLevelOnly) {
    query.where({ replyToId: { $exists: false } });
  }

  // Filter by specific thread
  if (options.threadId) {
    query.where({
      $or: [{ _id: options.threadId }, { replyToId: options.threadId }],
    });
  }

  return query
    .populate("userId", "clerkId username displayName avatar")
    .populate({
      path: "replyToId",
      select: "content userId createdAt",
      populate: {
        path: "userId",
        select: "clerkId username displayName avatar"
      }
    })
    .populate("replyCount")
    .populate(
      "attachments.fileId",
      "filename originalName mimeType fileSize s3Url"
    )
    .sort({ createdAt: options.reverse ? 1 : -1 })
    .limit(options.limit || 50);
};

MessageSchema.statics.findByUser = function (
  userId: string,
  options: any = {}
) {
  const query = this.find({ userId });

  if (options.projectId) {
    query.where({ projectId: options.projectId });
  }

  return query
    .populate("projectId", "name description")
    .populate("replyToId", "content userId createdAt")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

MessageSchema.statics.findThread = function (messageId: string) {
  return this.find({
    $or: [{ _id: messageId }, { replyToId: messageId }],
  })
    .populate("userId", "clerkId username displayName avatar")
    .populate({
      path: "replyToId",
      select: "content userId createdAt",
      populate: {
        path: "userId",
        select: "clerkId username displayName avatar"
      }
    })
    .populate(
      "attachments.fileId",
      "filename originalName mimeType fileSize s3Url"
    )
    .sort({ createdAt: 1 }); // Chronological order for threads
};

MessageSchema.statics.searchMessages = function (
  projectId: string,
  searchTerm: string
) {
  return this.find({
    projectId,
    content: { $regex: searchTerm, $options: "i" },
  })
    .populate("userId", "clerkId username displayName avatar")
    .populate({
      path: "replyToId",
      select: "content userId createdAt",
      populate: {
        path: "userId",
        select: "clerkId username displayName avatar"
      }
    })
    .sort({ createdAt: -1 });
};

MessageSchema.statics.getMessageStats = function (projectId?: string) {
  const matchStage = projectId
    ? { $match: { projectId: new mongoose.Types.ObjectId(projectId) } }
    : { $match: {} };

  return this.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        messagesWithAttachments: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$attachments", []] } }, 0] },
              1,
              0,
            ],
          },
        },
        totalAttachments: {
          $sum: { $size: { $ifNull: ["$attachments", []] } },
        },
        avgContentLength: { $avg: { $strLenCP: "$content" } },
      },
    },
  ]);
};

MessageSchema.statics.getActivityByDay = function (
  projectId: string,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        messageCount: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
    {
      $project: {
        uniqueUsers: 0,
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Pre-save middleware
MessageSchema.pre("save", function (next) {
  // Trim content
  if (this.isModified("content")) {
    this.content = this.content.trim();
  }

  // Validate attachments
  if (this.attachments && this.attachments.length > 0) {
    // Remove any duplicate file attachments
    const uniqueFileIds = new Set();
    this.attachments = this.attachments.filter((attachment) => {
      const fileIdStr = attachment.fileId.toString();
      if (uniqueFileIds.has(fileIdStr)) {
        return false;
      }
      uniqueFileIds.add(fileIdStr);
      return true;
    });
  }

  next();
});

// Post-save middleware
MessageSchema.post("save", function (doc) {
  console.log(
    `Message saved in project ${doc.projectId} by user ${doc.userId}`
  );
});

// Virtual for reply count
MessageSchema.virtual("replyCount", {
  ref: "Message",
  localField: "_id",
  foreignField: "replyToId",
  count: true,
});

// Ensure virtual fields are included in JSON output
MessageSchema.set("toJSON", { virtuals: true });
MessageSchema.set("toObject", { virtuals: true });

// Create and export the model
export interface IMessageModel extends Model<IMessage> {
  findByProject(projectId: string, options?: any): Promise<IMessage[]>;
  findByUser(userId: string, options?: any): Promise<IMessage[]>;
  findThread(messageId: string): Promise<IMessage[]>;
  searchMessages(projectId: string, searchTerm: string): Promise<IMessage[]>;
  getMessageStats(projectId?: string): Promise<any[]>;
  getActivityByDay(projectId: string, days?: number): Promise<any[]>;
}

export const Message =
  (mongoose.models.Message as IMessageModel) ||
  mongoose.model<IMessage, IMessageModel>("Message", MessageSchema);

// Export validation functions
export const validateMessage = (data: any) => {
  return MessageValidationSchema.parse(data);
};

export const validatePartialMessage = (data: any) => {
  return MessageValidationSchema.partial().parse(data);
};
