import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { UserService, ProjectService } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  projectFileUploader: f({
    image: { maxFileSize: "32MB", maxFileCount: 10 },
    video: { maxFileSize: "512MB", maxFileCount: 5 },
    audio: { maxFileSize: "64MB", maxFileCount: 10 },
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
    text: { maxFileSize: "4MB", maxFileCount: 20 },
    "application/zip": { maxFileSize: "128MB", maxFileCount: 5 },
    "application/x-rar-compressed": { maxFileSize: "128MB", maxFileCount: 5 },
    "application/x-7z-compressed": { maxFileSize: "128MB", maxFileCount: 5 },
  })
    .input(z.object({ projectId: z.string() }))
    // Set permissions and file types on the FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const { userId } = await auth();

      // If you throw, the user will not be able to upload
      if (!userId) throw new Error("Unauthorized");

      // Get projectId from the input
      const { projectId } = input;

      if (!projectId) throw new Error("Project ID is required");

      // Verify user has access to this project
      const user = await UserService.getUserByClerkId(userId);
      if (!user) throw new Error("User not found");

      try {
        const project = await ProjectService.getProject(projectId, user.id);

        if (!project) {
          throw new Error("Project not found");
        }

        // Get user's role in this project
        const userMembership = project.members.find(
          (member) => member.userId === user.id
        );
        const userRole = userMembership?.role || "MEMBER";

        // Check if user can upload files (VIEWER role cannot upload)
        if (userRole === "VIEWER") {
          throw new Error("Insufficient permissions to upload files");
        }

        // Whatever is returned here is accessible in onUploadComplete as `metadata`
        return {
          userId: user.id,
          projectId,
          userRole,
          project: {
            id: project.id,
            name: project.name,
          },
        };
      } catch (error) {
        console.error("Error verifying project access:", error);
        throw new Error("Project not found or access denied");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File name:", file.name);
      console.log("File size:", file.size);
      console.log("File type:", file.type);

      try {
        // Save file metadata to database
        const savedFile = await prisma.file.create({
          data: {
            filename: file.name.replace(/[^a-zA-Z0-9.-]/g, "_"), // Sanitize filename
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            s3Key: file.key, // UploadThing provides a unique key
            s3Bucket: "uploadthing", // UploadThing manages the storage
            s3Url: file.url,
            metadata: {
              uploadedVia: "uploadthing",
              fileKey: file.key,
            },
            isPublic: false, // Default to private
            projectId: metadata.projectId,
            uploadedById: metadata.userId,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatar: true,
              },
            },
          },
        });

        console.log("File saved to database:", savedFile.id);

        // Return any data you want to the client
        return {
          fileId: savedFile.id,
          fileName: savedFile.originalName,
          fileUrl: file.url,
          projectId: metadata.projectId,
          uploadedBy: savedFile.uploadedBy,
        };
      } catch (error) {
        console.error("Error saving file to database:", error);
        throw new Error("Failed to save file metadata");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
