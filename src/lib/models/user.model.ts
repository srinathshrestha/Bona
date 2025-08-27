import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { ClerkIdSchema, EmailSchema, UserSettingsSchema } from "./types";

// Zod validation schema for User
export const UserValidationSchema = z.object({
  clerkId: ClerkIdSchema,
  email: EmailSchema,
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  settings: UserSettingsSchema,
  isOnboarded: z.boolean().default(false),
});

// TypeScript interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  clerkId: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  settings?: any;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for User
const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when not null
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    displayName: {
      type: String,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "users",
  }
);

// Additional indexes for better performance (not covered by unique fields)
UserSchema.index({ createdAt: -1 });

// Instance methods
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.__v;
  return userObject;
};

// Static methods
UserSchema.statics.findByClerkId = function (clerkId: string) {
  return this.findOne({ clerkId });
};

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username });
};

UserSchema.statics.isUsernameAvailable = async function (
  username: string,
  excludeUserId?: string
) {
  const query: any = { username };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const user = await this.findOne(query);
  return !user;
};

// Pre-save middleware
UserSchema.pre("save", function (next) {
  // Ensure email is lowercase
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Post-save middleware
UserSchema.post("save", function (doc) {
  console.log(`User ${doc.email} saved successfully`);
});

// Create and export the model
export interface IUserModel extends Model<IUser> {
  findByClerkId(clerkId: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  isUsernameAvailable(
    username: string,
    excludeUserId?: string
  ): Promise<boolean>;
}

export const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>("User", UserSchema);

// Export validation functions
export const validateUser = (data: any) => {
  return UserValidationSchema.parse(data);
};

export const validatePartialUser = (data: any) => {
  return UserValidationSchema.partial().parse(data);
};
