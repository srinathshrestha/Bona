import { SignUp } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Join Bona
          </h1>
          <p className="text-muted-foreground">
            Create your account and start collaborating with your team
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <Card className="border-border shadow-lg">
          <CardContent className="p-6">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  formButtonPrimary:
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  footerActionLink: "text-primary hover:text-primary/80",
                  inputField: "bg-background border-input",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <a
              href="/sign-in"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
