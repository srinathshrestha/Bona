import { PrismaClient } from "@prisma/client";

// Global variable to store the Prisma client instance
// This prevents creating multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized settings for Neon
const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// In development, store the client in a global variable
// to prevent creating new instances on hot reload
if (process.env.NODE_ENV === "development") {
  globalThis.prisma = prisma;
}

export { prisma };
