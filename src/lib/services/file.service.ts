import connectMongoDB from "../mongodb";
import { File, validateFile, IFile } from "../models/file.model";
import { ProjectMember } from "../models/projectMember.model";
import { deleteFile as deleteS3File } from "../s3";
import mongoose from "mongoose";
import crypto from "crypto";
import { getPublicFileUrl } from "../utils/url";

interface CreateFileInput {
  originalName: string;
  fileSize: number;
  mimeType: string;
  projectId: string;
  s3Key: string;
  uploadedById: string;
}

export class FileService {
  private static async init() {
    await connectMongoDB();
  }

  static async createFile(data: CreateFileInput): Promise<IFile> {
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
    options: Record<string, unknown> = {}
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

    if (!member || member.role !== "OWNER") {
      throw new Error("Insufficient permissions");
    }

    // Delete from S3
    await deleteS3File(file.s3Key);

    // Delete from database
    await File.findByIdAndDelete(fileId);
  }

  static async togglePublicSharing(
    fileId: string,
    userId: string,
    isPublic: boolean
  ): Promise<{ shareUrl: string }> {
    await this.init();
    const file = await File.findById(fileId);
    if (!file) throw new Error("File not found");

    // Check permissions - only OWNER and MEMBER can make files public
    const member = await ProjectMember.findOne({
      projectId: file.projectId,
      userId,
    });

    if (!member || !["OWNER", "MEMBER"].includes(member.role)) {
      throw new Error("Insufficient permissions");
    }

    if (isPublic) {
      // Generate public share token if not exists
      if (!file.publicShareToken) {
        file.publicShareToken = crypto.randomBytes(32).toString("hex");
      }
      file.isPublic = true;
    } else {
      file.isPublic = false;
      file.publicShareToken = undefined;
    }

    await file.save();

    const shareUrl =
      file.isPublic && file.publicShareToken
        ? getPublicFileUrl(file.publicShareToken)
        : "";

    return {
      shareUrl,
    };
  }

  static async getFileByPublicToken(token: string): Promise<IFile | null> {
    await this.init();
    return await File.findByPublicToken(token);
  }

  static async getFileById(fileId: string): Promise<IFile | null> {
    await this.init();
    try {
      return await File.findById(fileId);
    } catch (error) {
      console.error("Error getting file by ID:", error);
      return null;
    }
  }

  static async updateFile(
    fileId: string,
    updateData: { originalName?: string }
  ): Promise<IFile | null> {
    await this.init();
    try {
      const updatedFile = await File.findByIdAndUpdate(
        fileId,
        { originalName: updateData.originalName },
        { new: true }
      );
      return updatedFile;
    } catch (error) {
      console.error("Error updating file:", error);
      throw error;
    }
  }
}
