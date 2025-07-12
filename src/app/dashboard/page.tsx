import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderOpen, Upload, Settings, User } from "lucide-react";
import { UserService } from "@/lib/database";
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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Bona</h1>
              <span className="text-muted-foreground">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.displayName ||
                    user.firstName ||
                    user.username ||
                    "User"}
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
                  className="w-8 h-8 rounded-full"
                />
              )}
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
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
              Welcome back,{" "}
              {user.displayName || user.firstName || user.username}!
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {user.bio ||
                "Ready to collaborate with your team? Create a project or join an existing one to get started."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CreateProjectCard />
            <JoinProjectCard />
            <UploadFilesCard />
            <ManageProfileCard />
          </div>

          {/* Projects Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <RecentProjectsCard />

            {/* Activity Feed */}
            <ActivityFeedCard />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Projects Created"
              value={0}
              icon={<FolderOpen className="w-5 h-5" />}
            />
            <StatsCard
              title="Projects Joined"
              value={0}
              icon={<Users className="w-5 h-5" />}
            />
            <StatsCard
              title="Total Projects"
              value={0}
              icon={<Plus className="w-5 h-5" />}
            />
          </div>
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
async function RecentProjectsCard() {
  // For now, show empty state. We'll implement project fetching later
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderOpen className="w-5 h-5 mr-2" />
          Recent Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
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
