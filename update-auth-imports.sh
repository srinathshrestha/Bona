#!/bin/bash

# Script to update all API routes from Clerk to NextAuth
# This will replace Clerk imports and auth calls with NextAuth equivalents

echo "Updating API routes from Clerk to NextAuth..."

# List of files to update
files=(
  "src/app/api/projects/[id]/invite-stats/route.ts"
  "src/app/api/projects/[id]/audit/route.ts"
  "src/app/api/projects/[id]/members/route.ts"
  "src/app/api/projects/[id]/messages/route.ts"
  "src/app/api/invitations/[token]/route.ts"
  "src/app/api/files/view/route.ts"
  "src/app/api/projects/[id]/messages/sse/route.ts"
  "src/app/api/files/upload-url/route.ts"
  "src/app/api/files/route.ts"
  "src/app/api/files/download/route.ts"
  "src/app/api/projects/[id]/admission-control/route.ts"
  "src/app/api/projects/[id]/invite-link/route.ts"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Replace Clerk imports with NextAuth imports
  sed -i '' 's/import { auth } from "@clerk\/nextjs\/server";/import { getCurrentUserId } from "@\/lib\/auth";/g' "$file"
  sed -i '' 's/import { auth, currentUser } from "@clerk\/nextjs\/server";/import { getCurrentUserId, getCurrentUser } from "@\/lib\/auth";/g' "$file"
  
  # Replace auth() calls with getCurrentUserId()
  sed -i '' 's/const { userId } = await auth();/const userId = await getCurrentUserId();/g' "$file"
  sed -i '' 's/const { userId: clerkUserId } = await auth();/const userId = await getCurrentUserId();/g' "$file"
  
  # Replace getUserByClerkId with getUserById
  sed -i '' 's/getUserByClerkId(userId)/getUserById(userId)/g' "$file"
  sed -i '' 's/getUserByClerkId(clerkUserId)/getUserById(userId)/g' "$file"
  
  # Replace currentUser() calls
  sed -i '' 's/const clerkUser = await currentUser();/const currentUser = await getCurrentUser();/g' "$file"
  
  # Update syncUserFromClerk references
  sed -i '' 's/syncUserFromClerk(clerkUser)/getUserById(currentUser.id)/g' "$file"
  sed -i '' 's/syncUserFromClerk(currentUser)/getUserById(currentUser.id)/g' "$file"
  
done

echo "✅ All files updated successfully!"
echo "Please review the changes and test the authentication flow."
