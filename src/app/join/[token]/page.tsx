import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FolderOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
  User,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

import { InvitationService } from "@/lib/database";
import { JoinActions } from "./join-actions";

// Project interface for the join page
interface ProjectPreviewData {
  id: string;
  name: string;
  description?: string | null;
  owner: {
    displayName?: string | null;
    username: string | null;
    avatar?: string | null;
  };
  stats: {
    members: number;
    files: number;
    messages: number;
  };
  token: string;
}

// Interface for the page props
interface JoinPageProps {
  params: Promise<{
    token: string;
  }>;
}

// Component to display invitation error states
function InvitationError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-800 dark:text-red-200">
            Invalid Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display project information
function ProjectPreview({ project }: { project: ProjectPreviewData }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderOpen className="w-5 h-5 mr-2 text-primary" />
          {project.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>
                by {project.owner.displayName || project.owner.username}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{project.stats.members}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{project.stats.files}</p>
              <p className="text-xs text-muted-foreground">Files</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{project.stats.messages}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for authenticated users
function AuthenticatedJoinFlow({
  token,
  project,
}: {
  token: string;
  project: ProjectPreviewData;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Join Project
          </h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to collaborate on this project
          </p>
        </div>

        <ProjectPreview project={project} />

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Your role will be:
                </span>
                <Badge variant="secondary">Member</Badge>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Member Permissions
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <li>• View and download all project files</li>
                      <li>• Upload new files and media</li>
                      <li>• Participate in team chat</li>
                      <li>• Collaborate with other members</li>
                    </ul>
                  </div>
                </div>
              </div>

              <JoinActions token={token} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for unauthenticated users
function UnauthenticatedJoinFlow({ project }: { project: ProjectPreviewData }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Join Bona</h1>
          <p className="text-muted-foreground">
            Sign up to join this collaborative project
          </p>
        </div>

        <ProjectPreview project={project} />

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Create your account to join this project as a Member
                </p>
              </div>

              <div className="space-y-3">
                <Link href={`/sign-up?redirect=/join/${project.token}`}>
                  <Button className="w-full" size="lg">
                    <User className="w-4 h-4 mr-2" />
                    Create Account & Join
                  </Button>
                </Link>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Link href={`/sign-in?redirect=/join/${project.token}`}>
                  <Button variant="outline" className="w-full" size="lg">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Sign In to Join
                  </Button>
                </Link>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      What happens after you sign up?
                    </p>
                    <ul className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                      <li>• You&apos;ll automatically join this project</li>
                      <li>• Get Member access to all project features</li>
                      <li>• Start collaborating immediately</li>
                      <li>• Access project files and team chat</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component
export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const userId = await getCurrentUserId();

  try {
    // Validate the invitation token
    const inviteLink = await InvitationService.validateInvitationToken(token);

    if (!inviteLink.projectId) {
      throw new Error("Project not found");
    }

    const projectData = inviteLink.projectId as any; // Type assertion since it's populated

    const project = {
      id: projectData._id?.toString() || projectData.id,
      name: projectData.name || "Unknown Project",
      description: projectData.description || null,
      owner: {
        displayName: projectData.ownerId?.displayName || null,
        username: projectData.ownerId?.username || "Unknown",
        avatar: projectData.ownerId?.avatar || null,
      },
      stats: {
        members: 0, // We'll need to get this separately if needed
        files: 0,
        messages: 0,
      },
      token, // Pass token for redirect purposes
    };

    // Check if user is authenticated
    if (userId) {
      // Show join flow for authenticated users
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <AuthenticatedJoinFlow token={token} project={project} />
        </Suspense>
      );
    } else {
      // Show signup flow for unauthenticated users
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <UnauthenticatedJoinFlow project={project} />
        </Suspense>
      );
    }
  } catch (error) {
    console.error("Error validating invitation:", error);

    // Show error state
    const errorMessage =
      error instanceof Error ? error.message : "Invalid invitation link";
    return <InvitationError error={errorMessage} />;
  }
}
