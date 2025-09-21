import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { ObjectIdSchema, FileMetadataSchema } from "./types";

// Zod validation schema for File
export const FileValidationSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  s3Key: z.string().min(1),
  s3Bucket: z.string().min(1),
  s3Url: z.string().url().optional(),
  metadata: FileMetadataSchema,
  isPublic: z.boolean().default(false),
  publicShareToken: z.string().optional(),
  projectId: ObjectIdSchema,
  uploadedById: ObjectIdSchema,
});

// TypeScript interface for File document
export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Bucket: string;
  s3Url?: string;
  metadata?: any;
  isPublic: boolean;
  publicShareToken?: string;
  projectId: mongoose.Types.ObjectId;
  uploadedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for File
const FileSchema = new Schema<IFile>(
  {
    filename: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
      index: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    s3Bucket: {
      type: String,
      required: true,
      index: true,
    },
    s3Url: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicShareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    uploadedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "files",
  }
);

// Indexes for better performance
FileSchema.index({ projectId: 1, createdAt: -1 }); // Project files sorted by date
FileSchema.index({ uploadedById: 1, createdAt: -1 }); // User files sorted by date
FileSchema.index({ mimeType: 1, projectId: 1 }); // Filter by file type in project
FileSchema.index({ isPublic: 1, createdAt: -1 }); // Public files
FileSchema.index({ filename: "text", originalName: "text" }); // Text search

// Instance methods
FileSchema.methods.toJSON = function () {
  const fileObject = this.toObject();
  delete fileObject.__v;
  return fileObject;
};

FileSchema.methods.getFileType = function (): string {
  const mimeType = this.mimeType.toLowerCase();

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  )
    return "text";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return "archive";

  return "other";
};

FileSchema.methods.getFormattedSize = function (): string {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

FileSchema.methods.generatePublicShareToken = function (): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

FileSchema.methods.getPublicShareUrl = function (): string {
  if (!this.isPublic || !this.publicShareToken) {
    return "";
  }
  // Import the utility function dynamically to avoid circular imports
  const { getPublicFileUrl } = require("../utils/url");
  return getPublicFileUrl(this.publicShareToken);
};

// Static methods
FileSchema.statics.findByProject = function (
  projectId: string,
  options: any = {}
) {
  const query = this.find({ projectId });

  if (options.mimeType) {
    query.where({ mimeType: new RegExp(options.mimeType, "i") });
  }

  if (options.uploadedBy) {
    query.where({ uploadedById: options.uploadedBy });
  }

  return query
    .populate("uploadedById", "clerkId username displayName avatar")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

FileSchema.statics.findByUser = function (userId: string, options: any = {}) {
  const query = this.find({ uploadedById: userId });

  if (options.projectId) {
    query.where({ projectId: options.projectId });
  }

  return query
    .populate("projectId", "name description")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

FileSchema.statics.searchFiles = function (
  projectId: string,
  searchTerm: string
) {
  return this.find({
    projectId,
    $or: [
      { filename: { $regex: searchTerm, $options: "i" } },
      { originalName: { $regex: searchTerm, $options: "i" } },
      { mimeType: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .populate("uploadedById", "clerkId username displayName avatar")
    .sort({ createdAt: -1 });
};

FileSchema.statics.getFileStats = function (projectId?: string) {
  const matchStage = projectId
    ? { $match: { projectId: new mongoose.Types.ObjectId(projectId) } }
    : { $match: {} };

  return this.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        avgSize: { $avg: "$fileSize" },
        maxSize: { $max: "$fileSize" },
        minSize: { $min: "$fileSize" },
      },
    },
  ]);
};

FileSchema.statics.getFileTypeStats = function (projectId?: string) {
  const matchStage = projectId
    ? { $match: { projectId: new mongoose.Types.ObjectId(projectId) } }
    : { $match: {} };

  return this.aggregate([
    matchStage,
    {
      $addFields: {
        fileType: {
          $switch: {
            branches: [
              {
                case: {
                  $regexMatch: { input: "$mimeType", regex: /^image\// },
                },
                then: "image",
              },
              {
                case: {
                  $regexMatch: { input: "$mimeType", regex: /^video\// },
                },
                then: "video",
              },
              {
                case: {
                  $regexMatch: { input: "$mimeType", regex: /^audio\// },
                },
                then: "audio",
              },
              { case: { $eq: ["$mimeType", "application/pdf"] }, then: "pdf" },
              {
                case: { $regexMatch: { input: "$mimeType", regex: /^text\// } },
                then: "text",
              },
            ],
            default: "other",
          },
        },
      },
    },
    {
      $group: {
        _id: "$fileType",
        count: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

FileSchema.statics.findByPublicToken = function (token: string) {
  return this.findOne({
    publicShareToken: token,
    isPublic: true,
  }).populate("uploadedById", "username displayName");
};

// Pre-save middleware
FileSchema.pre("save", function (next) {
  // Sanitize filename
  if (this.isModified("filename")) {
    this.filename = this.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  }
  next();
});

// Post-save middleware
FileSchema.post("save", function (doc) {
  console.log(`File ${doc.filename} saved to project ${doc.projectId}`);
});

// Post-remove middleware
FileSchema.post("deleteOne", { document: true, query: false }, function (doc) {
  console.log(`File ${doc.filename} deleted from project ${doc.projectId}`);
});

// Create and export the model
export interface IFileModel extends Model<IFile> {
  findByProject(projectId: string, options?: any): Promise<IFile[]>;
  findByUser(userId: string, options?: any): Promise<IFile[]>;
  searchFiles(projectId: string, searchTerm: string): Promise<IFile[]>;
  getFileStats(projectId?: string): Promise<any[]>;
  getFileTypeStats(projectId?: string): Promise<any[]>;
  findByPublicToken(token: string): Promise<IFile | null>;
}

export const File =
  (mongoose.models.File as IFileModel) ||
  mongoose.model<IFile, IFileModel>("File", FileSchema);

// Export validation functions
export const validateFile = (data: any) => {
  return FileValidationSchema.parse(data);
};

export const validatePartialFile = (data: any) => {
  return FileValidationSchema.partial().parse(data);
};
