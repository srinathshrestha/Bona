"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import {
  FolderOpen,
  Plus,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectsResponse["projects"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card
      key={project.id}
      className="hover:shadow-lg transition-shadow duration-200"
    >
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
          <Link href={`/dashboard/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              Open Project
            </Button>
          </Link>
          {(project.role === "OWNER" || project.role === "ADMIN") && (
            <Link href={`/dashboard/projects/${project.id}/settings`}>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">Projects</h1>
            </div>
            <Link href="/dashboard/projects/new">
              <LoadingButton>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </LoadingButton>
            </Link>
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
                  {projects.owned.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
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
                  {projects.member.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
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
