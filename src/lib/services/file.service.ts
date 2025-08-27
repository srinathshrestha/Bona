import connectMongoDB from "../mongodb";
import {
  File,
  validateFile,
  validatePartialFile,
  IFile,
} from "../models/file.model";
import { ProjectMember } from "../models/projectMember.model";
import { deleteFile as deleteS3File } from "../s3";
import mongoose from "mongoose";

export class FileService {
  private static async init() {
    await connectMongoDB();
  }

  static async createFile(data: any): Promise<IFile> {
    await this.init();

    // Convert uploadedById from Clerk ID to MongoDB ObjectId
    const user = await mongoose
      .model("User")
      .findOne({ clerkId: data.uploadedById });
    if (!user) throw new Error("User not found");

    const fileData = {
      ...data,
      uploadedById: user._id,
    };

    const validatedData = validateFile(fileData);
    const file = new File(validatedData);
    return await file.save();
  }

  static async getFilesByProject(
    projectId: string,
    options: any = {}
  ): Promise<IFile[]> {
    await this.init();
    return await File.findByProject(projectId, options);
  }

  static async deleteFile(fileId: string, userId: string): Promise<void> {
    await this.init();
    const file = await File.findById(fileId);
    if (!file) throw new Error("File not found");

    // Check permissions
    const member = await ProjectMember.findOne({
      projectId: file.projectId,
      userId,
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      throw new Error("Insufficient permissions");
    }

    // Delete from S3
    await deleteS3File(file.s3Key);

    // Delete from database
    await File.findByIdAndDelete(fileId);
  }
}
