import mongoose from "mongoose";
import { z } from "zod";

// Zod validation schema
export const TestimonialSchema = z.object({
  content: z.string().min(10).max(500),
  author: z.string().min(2).max(100),
  role: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  company: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  rating: z.number().min(1).max(5),
  isApproved: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  website: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  avatar: z.string().url().optional(),
  submittedAt: z.date().default(() => new Date()),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(), // User ID who approved
});

export type Testimonial = z.infer<typeof TestimonialSchema>;

// Mongoose schema
const testimonialSchema = new mongoose.Schema<Testimonial>(
  {
    content: { type: String, required: true, maxlength: 500 },
    author: { type: String, required: true, maxlength: 100 },
    role: { type: String, maxlength: 100 },
    company: { type: String, maxlength: 100 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    isApproved: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    email: { type: String },
    website: { type: String },
    avatar: { type: String },
    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: String }, // Reference to User
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
testimonialSchema.index({ isApproved: 1, isPublic: 1, submittedAt: -1 });
testimonialSchema.index({ author: 1 });

export const TestimonialModel =
  mongoose.models.Testimonial ||
  mongoose.model<Testimonial>("Testimonial", testimonialSchema);
