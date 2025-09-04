import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
import { FileUploadS3 } from "@/components/file-upload-s3";
import { ProjectInviteDialog } from "@/components/project-invite-dialog";
import { ProjectChat } from "@/components/project-chat";
import { ProjectFileManager } from "@/components/project-file-manager";
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
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Debug logging
  console.log("ProjectDetailPage params:", {
    id,
    resolvedParams,
    idType: typeof id,
    idValue: id,
  });

  // Validate project ID
  if (!id || id === "undefined" || id === "null") {
    console.error("Invalid project ID:", id);
    redirect("/dashboard");
  }

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
    // Debug logging
    console.log("About to call ProjectService.getProject with:", {
      projectId: id,
      userId: user._id.toString(),
      idType: typeof id,
      userIdType: typeof user._id.toString(),
    });

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
  const userMembership = (
    project as unknown as {
      members?: Array<{ userId: string | { _id: string }; role: string }>;
    }
  ).members?.find((member) => {
    // Handle both populated and non-populated userId
    const memberUserId =
      typeof member.userId === "string"
        ? member.userId
        : member.userId._id.toString();
    return memberUserId === user._id.toString();
  });
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
                <span className="hidden sm:inline">Back to Projects</span>
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
                      {project.ownerId?.username || "Unknown Owner"}
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
                      key={member._id?.toString() || member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {member.userId?.avatar ? (
                          <Image
                            src={member.userId.avatar}
                            alt={member.userId.username || "User"}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {member.userId?.username || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.userId?.email || "No email"}
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

            {/* File Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Project Files
                  </div>
                  <ProjectFileManager
                    projectId={id}
                    userRole={userRole}
                    trigger={
                      <Button variant="outline" size="sm">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Manage Files
                      </Button>
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(project as unknown as { files?: Array<unknown> }).files
                  ?.length > 0 ? (
                  <div className="space-y-3">
                    {(
                      project as unknown as {
                        files: Array<{
                          _id?: string;
                          id?: string;
                          originalName: string;
                          createdAt: string;
                          fileSize: number;
                          uploadedById?: { username?: string };
                        }>;
                      }
                    ).files
                      .slice(0, 3)
                      .map((file) => (
                        <div
                          key={file._id?.toString() || file.id}
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
                                {new Date(file.createdAt).toLocaleDateString()}{" "}
                                •{" "}
                                {file.uploadedById?.username || "Unknown User"}
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
                    {(project as unknown as { files: unknown[] }).files.length >
                      3 && (
                      <div className="text-center pt-2">
                        <ProjectFileManager
                          projectId={id}
                          userRole={userRole}
                          trigger={
                            <Button variant="ghost" size="sm">
                              View all{" "}
                              {
                                (project as unknown as { files: unknown[] })
                                  .files.length
                              }{" "}
                              files
                            </Button>
                          }
                        />
                      </div>
                    )}
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
                    <ProjectFileManager
                      projectId={id}
                      userRole={userRole}
                      trigger={
                        <Button>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                      }
                    />
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
              <FileUploadS3 projectId={id} userRole={userRole} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div key="chat">
              <ProjectChat projectId={id} userRole={userRole} />
            </div>

            <div key="file-manager">
              <ProjectFileManager
                projectId={id}
                userRole={userRole}
                trigger={
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <FolderOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="font-medium text-foreground">
                        File Manager
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Manage project files
                      </p>
                    </CardContent>
                  </Card>
                }
              />
            </div>

            <div key="invite-dialog">
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
            </div>

            {userRole === "OWNER" || userRole === "ADMIN" ? (
              <div key="settings-link">
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
              </div>
            ) : (
              <div key="settings-disabled">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
