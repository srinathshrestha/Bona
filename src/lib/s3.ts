import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Configuration
const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET || "get-cert";
const DEFAULT_EXPIRY = 3600; // 1 hour in seconds
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Generate a unique S3 key for file uploads
 * Format: projects/{projectId}/{timestamp}-{randomId}-{filename}
 */
export function generateS3Key(projectId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString("hex");
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  return `projects/${projectId}/${timestamp}-${randomId}-${sanitizedFilename}`;
}

/**
 * Generate a unique S3 key for thumbnails
 * Format: projects/{projectId}/thumbnails/{fileId}-thumb.jpg
 */
export function generateThumbnailS3Key(
  projectId: string,
  fileId: string
): string {
  return `projects/${projectId}/thumbnails/${fileId}-thumb.jpg`;
}

/**
 * Generate presigned URL for file upload
 * This allows clients to upload files directly to S3
 */
export async function getUploadPresignedUrl(
  projectId: string,
  filename: string,
  contentType: string,
  fileSize: number
): Promise<{
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}> {
  console.log("🔧 [S3-SERVICE] Starting presigned URL generation:", {
    projectId,
    filename,
    contentType,
    fileSize,
    bucket: BUCKET_NAME,
    region: process.env.AWS_REGION,
  });

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    console.error("❌ [S3-SERVICE] File size too large:", {
      fileSize,
      maxSize: MAX_FILE_SIZE,
      maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    });
    throw new Error(
      `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    );
  }

  // Generate unique S3 key
  const s3Key = generateS3Key(projectId, filename);
  console.log("🔑 [S3-SERVICE] Generated S3 key:", s3Key);

  // Create the command for uploading
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    ContentLength: fileSize,
    // Add metadata
    Metadata: {
      projectId,
      originalFilename: filename,
      uploadedAt: new Date().toISOString(),
    },
    // Security headers
    ServerSideEncryption: "AES256",
  });

  console.log("📝 [S3-SERVICE] PutObjectCommand created:", {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  try {
    // Generate presigned URL
    console.log("🔗 [S3-SERVICE] Generating presigned URL...");
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: DEFAULT_EXPIRY,
    });

    console.log("✅ [S3-SERVICE] Presigned URL generated successfully:", {
      s3Key,
      expiresIn: DEFAULT_EXPIRY,
      urlLength: uploadUrl.length,
      urlHost: new URL(uploadUrl).hostname,
    });

    return {
      uploadUrl,
      s3Key,
      expiresIn: DEFAULT_EXPIRY,
    };
  } catch (error) {
    console.error("💥 [S3-SERVICE] Error generating presigned URL:", error);
    console.error("💥 [S3-SERVICE] S3 client config:", {
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      bucket: BUCKET_NAME,
    });
    throw error;
  }
}

/**
 * Generate presigned URL for file download
 * This provides secure, temporary access to private files
 */
export async function getDownloadPresignedUrl(
  s3Key: string,
  filename?: string,
  expiresIn: number = DEFAULT_EXPIRY
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    // Set content disposition to suggest filename for download
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename}"`
      : undefined,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate presigned URL for file viewing
 * This provides secure, temporary access for inline viewing
 */
export async function getViewPresignedUrl(
  s3Key: string,
  mimeType?: string,
  expiresIn: number = DEFAULT_EXPIRY
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    // Set content disposition for inline viewing
    ResponseContentDisposition: "inline",
    // Set content type if provided (important for PDFs)
    ...(mimeType && { ResponseContentType: mimeType }),
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 * Used when files are deleted from the application
 */
export async function deleteFile(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  try {
    await s3Client.send(command);
    console.log(`Successfully deleted file: ${s3Key}`);
  } catch (error) {
    console.error(`Error deleting file ${s3Key}:`, error);
    throw error;
  }
}

/**
 * Get file metadata from S3
 * Returns file information without downloading the content
 */
export async function getFileMetadata(s3Key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  metadata: Record<string, string>;
}> {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  try {
    const response = await s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || "application/octet-stream",
      metadata: response.Metadata || {},
    };
  } catch (error) {
    console.error(`Error getting file metadata for ${s3Key}:`, error);
    throw error;
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(s3Key: string): Promise<boolean> {
  try {
    await getFileMetadata(s3Key);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Copy a file within S3
 * Useful for creating backups or moving files between folders
 */
export async function copyFile(
  sourceS3Key: string,
  destinationS3Key: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: destinationS3Key,
    CopySource: `${BUCKET_NAME}/${sourceS3Key}`,
  });

  try {
    await s3Client.send(command);
    console.log(
      `Successfully copied file from ${sourceS3Key} to ${destinationS3Key}`
    );
  } catch (error) {
    console.error(
      `Error copying file from ${sourceS3Key} to ${destinationS3Key}:`,
      error
    );
    throw error;
  }
}

/**
 * Get public URL for a file (if bucket allows public access)
 * Note: This assumes the bucket is configured for public read access
 */
export function getPublicUrl(s3Key: string): string {
  return `https://${BUCKET_NAME}.s3.${
    process.env.AWS_REGION || "ap-south-1"
  }.amazonaws.com/${s3Key}`;
}

/**
 * Validate file type and size
 */
export function validateFile(
  filename: string,
  contentType: string,
  fileSize: number,
  allowedTypes?: string[]
): { isValid: boolean; error?: string } {
  console.log("🔍 [S3-VALIDATION] Validating file:", {
    filename,
    contentType,
    fileSize,
    fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
    maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    allowedTypes,
  });

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    const error = `File size (${(fileSize / 1024 / 1024).toFixed(
      2
    )}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    console.log("❌ [S3-VALIDATION] File too large:", error);
    return {
      isValid: false,
      error,
    };
  }

  // Check file type if allowedTypes is specified
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.includes("*")) {
        // Wildcard matching (e.g., "image/*")
        const pattern = type.replace("*", ".*");
        return new RegExp(pattern).test(contentType);
      }
      return contentType === type;
    });

    if (!isAllowed) {
      const error = `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(
        ", "
      )}`;
      console.log("❌ [S3-VALIDATION] File type not allowed:", error);
      return {
        isValid: false,
        error,
      };
    }
  }

  // Check for potentially dangerous file types
  const dangerousTypes = [
    "application/x-executable",
    "application/x-msdownload",
    "application/x-dosexec",
    "application/x-winexe",
  ];

  if (dangerousTypes.includes(contentType)) {
    const error = "Executable files are not allowed for security reasons";
    console.log("❌ [S3-VALIDATION] Dangerous file type:", {
      contentType,
      error,
    });
    return {
      isValid: false,
      error,
    };
  }

  console.log("✅ [S3-VALIDATION] File validation passed");
  return { isValid: true };
}

/**
 * S3 service configuration and health check
 */
export async function checkS3Connection(): Promise<{
  status: string;
  bucket: string;
  region: string;
}> {
  try {
    // Try to get bucket metadata
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "health-check", // This key doesn't need to exist
    });

    await s3Client.send(command).catch(() => {
      // We expect this to fail if the key doesn't exist, but it confirms bucket access
    });

    return {
      status: "connected",
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION || "ap-south-1",
    };
  } catch (error: any) {
    if (error.name === "NotFound") {
      // Bucket exists but key doesn't - this is actually good
      return {
        status: "connected",
        bucket: BUCKET_NAME,
        region: process.env.AWS_REGION || "ap-south-1",
      };
    }

    console.error("S3 connection error:", error);
    throw new Error(`S3 connection failed: ${error.message}`);
  }
}

// Export S3 client for advanced usage
export { s3Client };

// Export constants
export const S3_CONFIG = {
  BUCKET_NAME,
  MAX_FILE_SIZE,
  DEFAULT_EXPIRY,
  REGION: process.env.AWS_REGION || "ap-south-1",
};
