#!/usr/bin/env node

/**
 * S3 CORS Configuration Script
 * 
 * This script helps configure CORS settings for your S3 bucket to enable
 * direct browser uploads via presigned URLs.
 * 
 * Usage:
 *   node scripts/setup-s3-cors.js
 * 
 * Prerequisites:
 *   - AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *   - S3 bucket name set in S3_UPLOAD_BUCKET environment variable
 */

const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

// Configuration from environment variables
const BUCKET_NAME = process.env.S3_UPLOAD_BUCKET || "get-cert";
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize S3 client
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Recommended CORS configuration for file uploads
const corsRules = [
    {
        AllowedHeaders: [
            "*",
            "Authorization",
            "Content-Type",
            "Content-Length",
            "Content-MD5",
            "x-amz-content-sha256",
            "x-amz-date",
            "x-amz-security-token",
        ],
        AllowedMethods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "HEAD"
        ],
        AllowedOrigins: [
            "http://localhost:3000",
            "https://localhost:3000",
            "http://127.0.0.1:3000",
            "https://127.0.0.1:3000",
            ...(APP_URL ? [APP_URL] : []),
        ],
        ExposeHeaders: [
            "ETag",
            "x-amz-version-id"
        ],
        MaxAgeSeconds: 3000,
    },
];

async function getCurrentCorsConfig() {
    try {
        console.log(`🔍 Checking current CORS configuration for bucket: ${BUCKET_NAME}`);

        const command = new GetBucketCorsCommand({
            Bucket: BUCKET_NAME,
        });

        const response = await s3Client.send(command);

        console.log("✅ Current CORS rules:");
        console.log(JSON.stringify(response.CORSRules, null, 2));

        return response.CORSRules || [];
    } catch (error) {
        if (error.name === "NoSuchCORSConfiguration") {
            console.log("⚠️  No CORS configuration found for bucket");
            return [];
        }

        console.error("❌ Error getting CORS configuration:", error.message);
        throw error;
    }
}

async function setCorsConfig() {
    try {
        console.log(`🔧 Setting CORS configuration for bucket: ${BUCKET_NAME}`);

        const command = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: corsRules,
            },
        });

        await s3Client.send(command);

        console.log("✅ CORS configuration updated successfully!");
        console.log("📋 Applied CORS rules:");
        console.log(JSON.stringify(corsRules, null, 2));

    } catch (error) {
        console.error("❌ Error setting CORS configuration:", error.message);
        throw error;
    }
}

async function validateConfiguration() {
    console.log("🧪 Validating S3 configuration...");

    const requiredEnvVars = [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "S3_UPLOAD_BUCKET",
        "AWS_REGION"
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
        console.error("❌ Missing required environment variables:");
        missing.forEach(envVar => console.error(`   - ${envVar}`));
        process.exit(1);
    }

    console.log("✅ Environment variables configured:");
    console.log(`   - Bucket: ${BUCKET_NAME}`);
    console.log(`   - Region: ${AWS_REGION}`);
    console.log(`   - App URL: ${APP_URL}`);
    console.log(`   - Has AWS Credentials: ${!!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)}`);
}

async function main() {
    try {
        console.log("🚀 S3 CORS Configuration Script");
        console.log("================================");

        await validateConfiguration();

        console.log("\n📋 Step 1: Check current CORS configuration");
        await getCurrentCorsConfig();

        console.log("\n🔧 Step 2: Apply recommended CORS configuration");
        await setCorsConfig();

        console.log("\n✅ Step 3: Verify new configuration");
        await getCurrentCorsConfig();

        console.log("\n🎉 CORS configuration completed successfully!");
        console.log("\n📝 Next Steps:");
        console.log("   1. Test file upload in your application");
        console.log("   2. Check browser console for any CORS errors");
        console.log("   3. If issues persist, verify your AWS credentials and bucket permissions");

    } catch (error) {
        console.error("\n💥 Script failed:", error.message);
        console.error("\n🔧 Troubleshooting:");
        console.error("   1. Verify AWS credentials are correct");
        console.error("   2. Ensure the bucket exists and you have permissions");
        console.error("   3. Check your AWS region setting");
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    getCurrentCorsConfig,
    setCorsConfig,
    corsRules
};
