import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export async function GET() {
  console.log("🧪 [AWS-TEST] Testing AWS S3 access...");

  try {
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_UPLOAD_BUCKET || "get-cert";

    console.log("🔧 [AWS-TEST] S3 client configuration:", {
      region: process.env.AWS_REGION,
      bucket: bucketName,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyFirst4: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4),
    });

    // Test 1: Check bucket access
    console.log("🏗️ [AWS-TEST] Testing bucket access...");
    const headBucketCommand = new HeadBucketCommand({
      Bucket: bucketName,
    });

    await s3Client.send(headBucketCommand);
    console.log("✅ [AWS-TEST] Bucket access successful");

    // Test 2: List objects in bucket (limited)
    console.log("📂 [AWS-TEST] Testing list objects...");
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    });

    const listResult = await s3Client.send(listCommand);
    console.log("✅ [AWS-TEST] List objects successful:", {
      objectCount: listResult.Contents?.length || 0,
      isTruncated: listResult.IsTruncated,
    });

    return NextResponse.json({
      success: true,
      message: "AWS S3 access test successful",
      details: {
        region: process.env.AWS_REGION,
        bucket: bucketName,
        objectCount: listResult.Contents?.length || 0,
        canAccessBucket: true,
        canListObjects: true,
      },
    });
  } catch (error) {
    console.error("❌ [AWS-TEST] AWS S3 test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          region: process.env.AWS_REGION,
          bucket: process.env.S3_UPLOAD_BUCKET,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
      { status: 500 }
    );
  }
}
