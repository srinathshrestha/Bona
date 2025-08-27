import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { ObjectIdSchema, ProjectSettingsSchema } from "./types";

// Zod validation schema for Project
export const ProjectValidationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  isPrivate: z.boolean().default(true),
  settings: ProjectSettingsSchema,
  ownerId: ObjectIdSchema,
});

// TypeScript interface for Project document
export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isPrivate: boolean;
  settings?: any;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for Project
const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  }
);

// Indexes for better performance
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ updatedAt: -1 });
ProjectSchema.index({ ownerId: 1, name: 1 }); // Compound index for owner's projects

// Instance methods
ProjectSchema.methods.toJSON = function () {
  const projectObject = this.toObject();
  delete projectObject.__v;
  return projectObject;
};

// Static methods
ProjectSchema.statics.findByOwner = function (ownerId: string) {
  return this.find({ ownerId }).sort({ updatedAt: -1 });
};

ProjectSchema.statics.findPublicProjects = function (limit = 20) {
  return this.find({ isPrivate: false })
    .populate("ownerId", "displayName username avatar")
    .sort({ createdAt: -1 })
    .limit(limit);
};

ProjectSchema.statics.searchProjects = function (
  searchTerm: string,
  isPublic = false
) {
  const query: any = {
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ],
  };

  if (isPublic) {
    query.isPrivate = false;
  }

  return this.find(query)
    .populate("ownerId", "displayName username avatar")
    .sort({ updatedAt: -1 });
};

// Pre-save middleware
ProjectSchema.pre("save", function (next) {
  // Trim name and description
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  if (this.isModified("description") && this.description) {
    this.description = this.description.trim();
  }
  next();
});

// Post-save middleware
ProjectSchema.post("save", function (doc) {
  console.log(`Project ${doc.name} saved successfully`);
});

// Virtual fields
ProjectSchema.virtual("memberCount", {
  ref: "ProjectMember",
  localField: "_id",
  foreignField: "projectId",
  count: true,
});

ProjectSchema.virtual("fileCount", {
  ref: "File",
  localField: "_id",
  foreignField: "projectId",
  count: true,
});

ProjectSchema.virtual("messageCount", {
  ref: "Message",
  localField: "_id",
  foreignField: "projectId",
  count: true,
});

// Ensure virtual fields are included in JSON output
ProjectSchema.set("toJSON", { virtuals: true });
ProjectSchema.set("toObject", { virtuals: true });

// Create and export the model
export interface IProjectModel extends Model<IProject> {
  findByOwner(ownerId: string): Promise<IProject[]>;
  findPublicProjects(limit?: number): Promise<IProject[]>;
  searchProjects(searchTerm: string, isPublic?: boolean): Promise<IProject[]>;
}

export const Project =
  (mongoose.models.Project as IProjectModel) ||
  mongoose.model<IProject, IProjectModel>("Project", ProjectSchema);

// Export validation functions
export const validateProject = (data: any) => {
  return ProjectValidationSchema.parse(data);
};

export const validatePartialProject = (data: any) => {
  return ProjectValidationSchema.partial().parse(data);
};
