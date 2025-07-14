import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderOpen, Upload, Settings, User } from "lucide-react";
import { UserService, ProjectService } from "@/lib/database";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  // Sync user data with database
  let user;
  try {
    user = await UserService.syncUserFromClerk(clerkUser);
  } catch (error) {
    console.error("Error syncing user:", error);
    // If sync fails, try to get existing user
    user = await UserService.getUserByClerkId(userId);
  }

  // If user still doesn't exist or hasn't completed onboarding, redirect
  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isOnboarded) {
    redirect("/onboarding");
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
                Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.displayName || user.username || "User"}
                </p>
                {user.username && (
                  <p className="text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                )}
              </div>
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt="Profile"
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user.displayName || user.username}!
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {user.bio ||
                "Ready to collaborate with your team? Create a project or join an existing one to get started."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <CreateProjectCard />
            <JoinProjectCard />
            <UploadFilesCard />
            <ManageProfileCard />
          </div>

          {/* Projects Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <RecentProjectsCard userId={userId} />

            {/* Activity Feed */}
            <ActivityFeedCard />
          </div>

          {/* Stats Cards */}
          <StatsCardsSection userId={userId} />
        </div>
      </div>
    </div>
  );
}

// Component: Create Project Card
function CreateProjectCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Create Project</CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          Start a new collaborative project
        </p>
        <Link href="/dashboard/projects/new">
          <Button className="w-full">Create Project</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Component: Join Project Card
function JoinProjectCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
          <Users className="w-6 h-6 text-secondary" />
        </div>
        <CardTitle className="text-lg">Join Project</CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          Join with invitation link
        </p>
        <Button variant="outline" className="w-full">
          Join Project
        </Button>
      </CardContent>
    </Card>
  );
}

// Component: Upload Files Card
function UploadFilesCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
          <Upload className="w-6 h-6 text-accent" />
        </div>
        <CardTitle className="text-lg">Upload Files</CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <p className="text-sm text-muted-foreground mb-4">Share media files</p>
        <Button variant="outline" className="w-full">
          Upload Files
        </Button>
      </CardContent>
    </Card>
  );
}

// Component: Manage Profile Card
function ManageProfileCard() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-muted/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-muted/20 transition-colors">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          Update your profile
        </p>
        <Link href="/dashboard/profile">
          <Button variant="outline" className="w-full">
            Manage Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Component: Recent Projects Card
async function RecentProjectsCard({ userId }: { userId: string }) {
  // Get user's projects
  const user = await UserService.getUserByClerkId(userId);
  const userProjects = user
    ? await ProjectService.getUserProjects(user.id)
    : null;

  // Get recent projects (both owned and member)
  const recentProjects = [];
  if (userProjects) {
    // Add owned projects
    recentProjects.push(
      ...userProjects.ownedProjects.map((project) => ({
        ...project,
        role: "OWNER" as const,
        owner: user,
      }))
    );

    // Add member projects
    recentProjects.push(
      ...userProjects.projectMembers.map((membership) => ({
        ...membership.project,
        role: membership.role,
        owner: membership.project.owner,
      }))
    );
  }

  // Sort by most recent activity
  recentProjects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FolderOpen className="w-5 h-5 mr-2" />
            Recent Projects
          </div>
          <div className="flex space-x-2">
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
            <Link href="/dashboard/projects/new">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.slice(0, 5).map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {project.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Projects Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start collaborating
            </p>
            <Link href="/dashboard/projects/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component: Activity Feed Card
function ActivityFeedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Activity Yet
          </h3>
          <p className="text-muted-foreground">
            Start collaborating to see activity here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Component: Stats Cards Section
async function StatsCardsSection({ userId }: { userId: string }) {
  // Get user's projects to calculate stats
  const user = await UserService.getUserByClerkId(userId);
  const userProjects = user
    ? await ProjectService.getUserProjects(user.id)
    : null;

  const ownedCount = userProjects?.ownedProjects.length || 0;
  const memberCount = userProjects?.projectMembers.length || 0;
  const totalCount = ownedCount + memberCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title="Projects Created"
        value={ownedCount}
        icon={<FolderOpen className="w-5 h-5" />}
      />
      <StatsCard
        title="Projects Joined"
        value={memberCount}
        icon={<Users className="w-5 h-5" />}
      />
      <StatsCard
        title="Total Projects"
        value={totalCount}
        icon={<Plus className="w-5 h-5" />}
      />
    </div>
  );
}

// Component: Stats Card
function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
