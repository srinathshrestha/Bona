import {
  TestimonialModel,
  TestimonialSchema,
} from "../models/testimonial.model";
import connectMongoDB from "../mongodb";
import { z } from "zod";

export class TestimonialService {
  /**
   * Submit a new testimonial (pending approval)
   */
  static async submitTestimonial(data: z.infer<typeof TestimonialSchema>) {
    await connectMongoDB();

    // Validate the data
    const validatedData = TestimonialSchema.parse({
      ...data,
      isApproved: false, // All new testimonials need approval
      submittedAt: new Date(),
    });

    const testimonial = new TestimonialModel(validatedData);
    await testimonial.save();

    return testimonial;
  }

  /**
   * Get approved testimonials for public display
   */
  static async getApprovedTestimonials(limit = 10) {
    await connectMongoDB();

    return await TestimonialModel.find({
      isApproved: true,
      isPublic: true,
    })
      .sort({ rating: -1, approvedAt: -1, submittedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get all testimonials for admin review
   */
  static async getAllTestimonials(page = 1, limit = 20) {
    await connectMongoDB();

    const skip = (page - 1) * limit;

    const [testimonials, total] = await Promise.all([
      TestimonialModel.find({})
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TestimonialModel.countDocuments({}),
    ]);

    return {
      testimonials,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get pending testimonials for admin approval
   */
  static async getPendingTestimonials() {
    await connectMongoDB();

    return await TestimonialModel.find({ isApproved: false })
      .sort({ submittedAt: -1 })
      .lean();
  }

  /**
   * Approve a testimonial
   */
  static async approveTestimonial(testimonialId: string, approvedBy: string) {
    await connectMongoDB();

    return await TestimonialModel.findByIdAndUpdate(
      testimonialId,
      {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      },
      { new: true }
    );
  }

  /**
   * Reject/delete a testimonial
   */
  static async rejectTestimonial(testimonialId: string) {
    await connectMongoDB();

    return await TestimonialModel.findByIdAndDelete(testimonialId);
  }

  /**
   * Update testimonial visibility
   */
  static async updateVisibility(testimonialId: string, isPublic: boolean) {
    await connectMongoDB();

    return await TestimonialModel.findByIdAndUpdate(
      testimonialId,
      { isPublic },
      { new: true }
    );
  }
}
