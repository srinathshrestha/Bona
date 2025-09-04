import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { EmailSchema, UserSettingsSchema } from "./types";

// Zod validation schema for User
export const UserValidationSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6).optional(), // For credential-based auth
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),
  // displayName removed
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  settings: UserSettingsSchema,
  isOnboarded: z.boolean().default(false),
  provider: z.string().optional(), // OAuth provider (google, github, etc.)
  providerId: z.string().optional(), // Provider account ID
  emailVerified: z.date().optional(), // Email verification timestamp
});

// TypeScript interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string; // Hashed password for credential-based auth
  username?: string;
  // displayName removed
  bio?: string;
  avatar?: string;
  settings?: any;
  isOnboarded: boolean;
  provider?: string; // OAuth provider
  providerId?: string; // Provider account ID
  emailVerified?: Date; // Email verification timestamp
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for User
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Optional for OAuth users
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when not null
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    // displayName removed
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
    provider: {
      type: String,
      required: false, // OAuth provider name
    },
    providerId: {
      type: String,
      required: false, // OAuth provider account ID
    },
    emailVerified: {
      type: Date,
      required: false,
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
