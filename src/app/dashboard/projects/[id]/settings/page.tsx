import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Settings,
  AlertTriangle,
  FolderOpen,
  Shield,
} from "lucide-react";
import { ProjectService, UserService } from "@/lib/database";
import { LoadingButton } from "@/components/loading-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MemberManagement } from "@/components/member-management";
import { DeleteProjectButton } from "@/components/delete-project-button";

// Interface for project settings props
interface ProjectSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the user from database to get their internal ID
  const user = await UserService.getUserById(userId);
  if (!user) {
    redirect("/sign-in");
  }

  let project;
  try {
    // Get project details with access control
    project = await ProjectService.getProject(id, user._id.toString());
  } catch (error) {
    console.error("Error fetching project:", error);
    redirect("/dashboard");
  }

  if (!project) {
    redirect("/dashboard");
  }

  // Get user's role in this project
  const userMembership = (project as any).members?.find((member: any) => {
    // Handle both populated and non-populated userId
    const memberUserId =
      typeof member.userId === "string"
        ? member.userId
        : member.userId._id.toString();
    return memberUserId === user._id.toString();
  });
  const userRole = userMembership?.role || "MEMBER";

  // Only owners and admins can access settings
  if (userRole !== "OWNER" && userRole !== "ADMIN") {
    redirect(`/dashboard/projects/${id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <LoadingButton
                href={`/dashboard/projects/${id}`}
                variant="ghost"
                size="sm"
                loadingText="Loading..."
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Project</span>
                <span className="sm:hidden">Back</span>
              </LoadingButton>
              <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                <Settings className="w-5 h-5 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {project.name} Settings
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="w-5 h-5 mr-2" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Project Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue={project.name}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="owner"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Owner
                    </label>
                    <input
                      type="text"
                      id="owner"
                      name="owner"
                      value={
                        (project.ownerId as any)?.displayName ||
                        (project.ownerId as any)?.username ||
                        ""
                      }
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={project.description || ""}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Describe your project (optional)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    defaultChecked={project.isPrivate}
                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                  />
                  <label
                    htmlFor="isPrivate"
                    className="text-sm text-foreground"
                  >
                    Private project (only invited members can access)
                  </label>
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    type="submit"
                    className="hover:bg-primary/90"
                    loadingText="Saving..."
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Member Management */}
          <MemberManagement
            projectId={id}
            initialMembers={
              (project as any).members?.map((member: any) => ({
                id: member._id.toString(), // Convert member ObjectId to string
                role: member.role,
                joinedAt: member.joinedAt.toISOString(),
                user: {
                  id: member.userId._id.toString(),
                  displayName: member.userId.displayName || "",
                  username: member.userId.username || "",
                  email: member.userId.email,
                  avatar: member.userId.avatar || undefined,
                },
              })) || []
            }
            initialPermissions={{
              role: userRole,
              permissions: {
                canInvite: userRole === "OWNER",
                canManageMembers: userRole === "OWNER" || userRole === "ADMIN",
                canManageProject: userRole === "OWNER" || userRole === "ADMIN",
              },
            }}
          />

          {/* Project Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Project Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(project as any)._count?.members || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(project as any)._count?.files || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Files Uploaded
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(project as any)._count?.messages || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Messages Sent</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(project.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone - Only for owners */}
          {userRole === "OWNER" && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      Delete Project
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Once you delete a project, there is no going back. Please
                      be certain. This action will permanently delete the
                      project, all files, messages, and remove all team members.
                    </p>
                    <DeleteProjectButton
                      projectId={id}
                      projectName={project.name}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
