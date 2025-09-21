"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    if (!error) return "An unknown error occurred during authentication.";

    // Decode URL-encoded error messages
    const decodedError = decodeURIComponent(error);

    if (decodedError.includes("User validation failed")) {
      return "There was an issue creating your account. Please try again or contact support.";
    }

    if (decodedError.includes("AccessDenied")) {
      return "Access was denied. Please try signing in again.";
    }

    if (decodedError.includes("Configuration")) {
      return "There's a configuration issue. Please contact support.";
    }

    if (decodedError.includes("Verification")) {
      return "Email verification failed. Please try again.";
    }

    return "An error occurred during authentication. Please try again.";
  };

  const getErrorTitle = (error: string | null) => {
    if (!error) return "Authentication Error";

    const decodedError = decodeURIComponent(error);

    if (decodedError.includes("User validation failed")) {
      return "Account Creation Failed";
    }

    if (decodedError.includes("AccessDenied")) {
      return "Access Denied";
    }

    return "Authentication Error";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
            {getErrorTitle(error)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {getErrorMessage(error)}
          </p>

          {error && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2">
                {decodeURIComponent(error)}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
