import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  Users,
  FolderOpen,
  Upload,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import { ProjectService, UserService } from "@/lib/database";
import { LoadingButton } from "@/components/loading-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileUploadUploadThing } from "@/components/file-upload-uploadthing";
import { ProjectInviteDialog } from "@/components/project-invite-dialog";
import { ProjectChat } from "@/components/project-chat";
import Link from "next/link";

// Interface for project detail props
interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get the user from database to get their internal ID
  const user = await UserService.getUserByClerkId(userId);
  if (!user) {
    redirect("/sign-in");
  }

  let project;
  try {
    // Get project details with access control
    project = await ProjectService.getProject(id, user.id);
  } catch (error) {
    console.error("Error fetching project:", error);
    redirect("/dashboard");
  }

  if (!project) {
    redirect("/dashboard");
  }

  // Get user's role in this project
  const userMembership = project.members.find(
    (member) => member.userId === user.id
  );
  const userRole = userMembership?.role || "MEMBER";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:py-0 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <LoadingButton
                href="/dashboard"
                variant="ghost"
                size="sm"
                loadingText="Loading..."
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </LoadingButton>
              <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {project.name}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <ThemeToggle />
              {(userRole === "OWNER" || userRole === "ADMIN") && (
                <LoadingButton
                  href={`/dashboard/projects/${id}/settings`}
                  variant="outline"
                  size="sm"
                  className="hover:bg-accent hover:text-accent-foreground"
                  loadingText="Loading..."
                >
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </LoadingButton>
              )}
              <ProjectInviteDialog
                projectId={id}
                userRole={userRole}
                size="sm"
                variant="outline"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Project Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {project.name}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {project.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {project.owner.displayName || project.owner.username}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-4 lg:space-y-0">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-center lg:justify-between text-center lg:text-left">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Members
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">
                        {project._count.members}
                      </p>
                    </div>
                    <Users className="w-6 h-6 lg:w-8 lg:h-8 text-primary mt-2 lg:mt-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-center lg:justify-between text-center lg:text-left">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Files
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">
                        {project._count.files}
                      </p>
                    </div>
                    <FolderOpen className="w-6 h-6 lg:w-8 lg:h-8 text-primary mt-2 lg:mt-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-center lg:justify-between text-center lg:text-left">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Messages
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">
                        {project._count.messages}
                      </p>
                    </div>
                    <MessageSquare className="w-6 h-6 lg:w-8 lg:h-8 text-primary mt-2 lg:mt-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Members
                  </div>
                  <ProjectInviteDialog
                    projectId={id}
                    userRole={userRole}
                    size="sm"
                    variant="outline"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={
                              member.user.displayName ||
                              member.user.username ||
                              "User"
                            }
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {member.user.displayName || member.user.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Recent Files
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.files.length > 0 ? (
                  <div className="space-y-3">
                    {project.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {file.originalName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(file.createdAt).toLocaleDateString()} •{" "}
                              {file.uploadedBy.displayName ||
                                file.uploadedBy.username}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Files Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start by uploading your first file to this project
                    </p>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* File Upload Section */}
          {(userRole === "OWNER" ||
            userRole === "ADMIN" ||
            userRole === "MEMBER") && (
            <div>
              <FileUploadUploadThing projectId={id} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ProjectChat projectId={id} userRole={userRole} />

            <ProjectInviteDialog
              projectId={id}
              userRole={userRole}
              trigger={
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium text-foreground">
                      Invite Members
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add team members
                    </p>
                  </CardContent>
                </Card>
              }
            />

            {userRole === "OWNER" || userRole === "ADMIN" ? (
              <Link href={`/dashboard/projects/${id}/settings`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Settings className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium text-foreground">
                      Project Settings
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configure project
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="opacity-50 cursor-not-allowed">
                <CardContent className="p-6 text-center">
                  <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-muted-foreground">
                    Project Settings
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Admin access required
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
