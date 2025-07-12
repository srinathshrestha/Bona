import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Upload, FolderOpen } from "lucide-react";
import { UserService } from "@/lib/database";
import Link from "next/link";
import OnboardingActions from "./onboarding-actions";

export default async function OnboardingPage() {
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

  // If user still doesn't exist, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // If user is already onboarded, redirect to dashboard
  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Bona</h1>
              <span className="text-muted-foreground">Welcome</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome to Bona,{" "}
              {user.displayName || user.firstName || user.username || "there"}!
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Let&apos;s get you set up with everything you need to start
              collaborating with your creative team.
            </p>
          </div>

          {/* Getting Started Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>1. Create Your First Project</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Projects help you organize your media files and collaborate
                  with your team
                </p>
                <Link href="/dashboard">
                  <Button className="w-full">Create Project</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>2. Invite Your Team</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Collaborate with your team members by inviting them to your
                  projects
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Invite Team
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>3. Upload Your Files</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Share your media files securely with your team members
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Upload Files
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>What you can do with Bona</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Secure File Sharing
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Share large media files with role-based access control
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Real-time Collaboration
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Chat with your team and share files in real-time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Project Organization
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Keep your creative assets organized by projects
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Version Control
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Track changes and maintain file history
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Media Previews
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Preview videos, images, and audio files instantly
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Mobile Access
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Access your projects from anywhere, on any device
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Ready to start collaborating?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <OnboardingActions />
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Skip for Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
