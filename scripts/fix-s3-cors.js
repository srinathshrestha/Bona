#!/usr/bin/env node

/**
 * Quick S3 CORS Fix Script
 * 
 * This script sets up permissive CORS settings for S3 uploads from any origin.
 * Run this if users are experiencing upload failures from different devices/browsers.
 * 
 * Usage:
 *   S3_UPLOAD_BUCKET=your-bucket-name AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy node fix-s3-cors.js
 */

const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

// Configuration from environment variables
const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET;
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

if (!BUCKET_NAME) {
    console.error("❌ Missing S3_UPLOAD_BUCKET environment variable");
    process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Missing AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
    process.exit(1);
}

// Initialize S3 client
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Permissive CORS configuration that allows uploads from anywhere
const permissiveCorsRules = [
    {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["ETag", "x-amz-version-id", "x-amz-request-id"],
        MaxAgeSeconds: 86400, // 24 hours
    },
];

async function applyPermissiveCors() {
    try {
        console.log(`🚀 Applying permissive CORS settings to bucket: ${BUCKET_NAME}`);
        console.log("⚠️  This allows uploads from ANY origin - only use for development/testing!");

        const command = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: permissiveCorsRules,
            },
        });

        await s3Client.send(command);

        console.log("✅ CORS configuration updated successfully!");
        console.log("📝 Applied rules:");
        console.log(JSON.stringify(permissiveCorsRules, null, 2));
        console.log("");
        console.log("🔧 What this enables:");
        console.log("  • File uploads from any website/origin");
        console.log("  • Support for all HTTP methods");
        console.log("  • No CORS-related upload failures");
        console.log("");
        console.log("⚠️  Security note:");
        console.log("  • This is very permissive - consider restricting origins in production");
        console.log("  • Your S3 bucket can now receive uploads from any website");

    } catch (error) {
        console.error("❌ Failed to update CORS configuration:", error.message);
        
        if (error.name === "NoSuchBucket") {
            console.error("💡 The specified bucket does not exist. Please check the bucket name.");
        } else if (error.name === "AccessDenied") {
            console.error("💡 Access denied. Please check your AWS credentials and permissions.");
        } else {
            console.error("💡 Full error:", error);
        }
        
        process.exit(1);
    }
}

// Run the CORS update
applyPermissiveCors();
