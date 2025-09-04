import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Upload, FolderOpen } from "lucide-react";
import { UserService } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import OnboardingActions from "./onboarding-actions";

export default async function OnboardingPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  // Get user from database
  const user = await UserService.getUserById(currentUser.id);

  // If user doesn't exist, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is already onboarded
  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  // Prepare user data for client component
  const userData = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName || currentUser.name,
    avatar: user.avatar || currentUser.image,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Welcome to Bona! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Let's get you set up in just a few steps
          </p>
        </div>

        {/* Onboarding Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingActions initialUser={userData} />
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <FolderOpen className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Create Projects</h3>
              </div>
              <p className="text-muted-foreground">
                Organize your work into projects for better collaboration and
                file management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Invite Team Members</h3>
              </div>
              <p className="text-muted-foreground">
                Collaborate with your team by inviting them to your projects
                with specific roles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-3">
                <Upload className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Share Files</h3>
              </div>
              <p className="text-muted-foreground">
                Upload and share files securely with your team members in
                project spaces.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Getting Started Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Step 1: Complete your profile</p>
                  <p className="text-sm text-muted-foreground">
                    Add a username and display name to personalize your account
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Step 2: Create your first project
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Projects help you organize files and collaborate with your
                    team
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Step 3: Invite team members</p>
                  <p className="text-sm text-muted-foreground">
                    Share project access with your colleagues for seamless
                    collaboration
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Step 4: Start uploading files</p>
                  <p className="text-sm text-muted-foreground">
                    Upload and manage your creative assets in a centralized
                    location
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skip for now option */}
        <div className="text-center mt-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Skip for now →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
