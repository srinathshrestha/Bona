"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingButton } from "@/components/loading-button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FolderOpen,
  Plus,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

// Interface for project data
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  memberCount: number;
  fileCount: number;
  messageCount: number;
  owner?: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
  };
}

// Interface for API response
interface ProjectsResponse {
  projects: {
    owned: Project[];
    member: Project[];
    total: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const clerkUser = session?.user;
  const isLoaded = status !== "loading";
  const [dbUser, setDbUser] = useState<{
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    isOnboarded: boolean;
    settings?: Record<string, unknown>;
    createdAt: string;
  } | null>(null);
  const [projects, setProjects] = useState<ProjectsResponse["projects"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const fetchUserAndProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user from database
      const userResponse = await fetch("/api/users/profile");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setDbUser(userData.user);
      }

      // Fetch projects
      await fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user from database and projects on component mount
  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchUserAndProjects();
    }
  }, [isLoaded, clerkUser, fetchUserAndProjects]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "MEMBER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "VIEWER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Project card component
  const ProjectCard = ({ project }: { project: Project }) => {
    // Debug logging to see what's in the project object
    console.log("ProjectCard render:", {
      projectId: project.id,
      projectName: project.name,
      project: project,
    });

    // Fallback to _id if id is not available
    const projectId = project.id || (project as any)._id;

    if (!projectId) {
      console.error("Project missing ID:", project);
      return null;
    }

    return (
      <Link href={`/dashboard/projects/${projectId}`}>
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                        project.role
                      )}`}
                    >
                      {project.role}
                    </span>
                    {project.owner && (
                      <span className="text-sm text-muted-foreground">
                        by {project.owner.displayName || project.owner.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {project.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Project stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{project.memberCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{project.fileCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{project.messageCount}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.updatedAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/dashboard/projects/${project.id}`;
                }}
              >
                Open Project
              </Button>
              {(project.role === "OWNER" || project.role === "ADMIN") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/dashboard/projects/${project.id}/settings`;
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  // Skeleton card component for loading state
  const ProjectCardSkeleton = () => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <Skeleton className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />

        {/* Project stats skeleton */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="w-8 h-8" />
        </div>
      </CardContent>
    </Card>
  );

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">
                  Bona
                </h1>
                <span className="hidden sm:inline text-muted-foreground">
                  Projects
                </span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Projects grid with skeletons */}
          <div className="space-y-8">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(2)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProjects} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                Bona
              </h1>
              <span className="hidden sm:inline text-muted-foreground">
                Projects
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {dbUser?.displayName?.split(" ")[0] ||
                    clerkUser?.name?.split(" ")[0] ||
                    clerkUser?.username ||
                    "User"}
                </p>
                {clerkUser?.username && (
                  <p className="text-xs text-muted-foreground">
                    @{clerkUser.username}
                  </p>
                )}
              </div>
              {clerkUser?.image && (
                <Image
                  src={clerkUser.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full ring-2 ring-border"
                />
              )}
              <ThemeToggle />
              <Link href="/dashboard/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:ml-2 sm:inline">Settings</span>
                </Button>
              </Link>
              <Link href="/dashboard/projects/new">
                <LoadingButton>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </LoadingButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects && projects.total === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No projects yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first project to start collaborating with your team
            </p>
            <Link href="/dashboard/projects/new">
              <LoadingButton>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </LoadingButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Projects owned by user */}
            {projects?.owned && projects.owned.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Your Projects ({projects.owned.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.owned.map((project) => {
                    console.log("Rendering owned project:", project);
                    return (
                      <ProjectCard
                        key={`owned-${project.id}`}
                        project={project}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Projects where user is a member */}
            {projects?.member && projects.member.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Shared with You ({projects.member.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.member.map((project) => {
                    console.log("Rendering member project:", project);
                    return (
                      <ProjectCard
                        key={`member-${project.id}`}
                        project={project}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary stats */}
            {projects && projects.total > 0 && (
              <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Project Summary
                    </h3>
                    <p className="text-muted-foreground">
                      You have access to {projects.total} project
                      {projects.total !== 1 ? "s" : ""} total
                    </p>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {projects.owned.length}
                      </div>
                      <div>Owned</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {projects.member.length}
                      </div>
                      <div>Member</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
