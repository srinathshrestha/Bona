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
    console.log("💾 [FILE-SERVICE] Starting file creation:", {
      originalName: data.originalName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      projectId: data.projectId,
      s3Key: data.s3Key,
      uploadedById: data.uploadedById,
    });

    await this.init();

    console.log("🔍 [FILE-SERVICE] Looking up user by ID:", data.uploadedById);
    // Convert uploadedById from NextAuth user ID to MongoDB ObjectId
    const user = await mongoose.model("User").findById(data.uploadedById);
      
    console.log("👤 [FILE-SERVICE] User lookup result:", {
      found: !!user,
      userId: user?._id?.toString(),
      inputUserId: data.uploadedById,
    });

    if (!user) {
      console.error(
        "❌ [FILE-SERVICE] User not found for ID:",
        data.uploadedById
      );
      throw new Error("User not found");
    }

    const fileData = {
      ...data,
      uploadedById: user._id.toString(),
    };

    console.log("📋 [FILE-SERVICE] Validating file data...");
    const validatedData = validateFile(fileData);
    console.log("✅ [FILE-SERVICE] File data validated successfully");

    console.log("💾 [FILE-SERVICE] Creating file document...");
    const file = new File(validatedData);
    const savedFile = await file.save();

    console.log("✅ [FILE-SERVICE] File saved to database:", {
      fileId: savedFile._id,
      originalName: savedFile.originalName,
      s3Key: savedFile.s3Key,
    });

    return savedFile;
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
