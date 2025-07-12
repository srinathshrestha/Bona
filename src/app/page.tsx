import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Welcome to <span className="text-primary">Bona</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Collaborative Media Asset Management Platform for Creative Teams
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Streamline your creative workflow with secure file sharing,
            real-time collaboration, and powerful project management tools built
            specifically for content creators.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Secure File Sharing
            </h3>
            <p className="text-sm text-muted-foreground">
              Share large media files securely with role-based access control
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Real-time Collaboration
            </h3>
            <p className="text-sm text-muted-foreground">
              Work together with your team in real-time messaging and file
              sharing
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Project Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Organize your creative assets by projects with team-based
              workflows
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground">
          <p>Built for video creators, designers, and creative teams</p>
        </div>
      </div>
    </div>
  );
}
