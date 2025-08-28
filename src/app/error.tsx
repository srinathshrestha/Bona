"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, RefreshCw, AlertTriangle, Bug, Mail } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-200 dark:border-red-800">
        <CardContent className="p-8 text-center">
          {/* Error Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-6">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Something went wrong!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            We encountered an unexpected error. Don&apos;t worry, our team has
            been notified and we&apos;re working to fix it.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-sm">
                  Development Error Details:
                </span>
              </div>
              <code className="text-xs text-red-600 dark:text-red-400 break-all">
                {error.message}
              </code>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What you can try:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <span>Refresh the page</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Home className="h-4 w-4 text-green-500" />
                <span>Go to homepage</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>Check your internet connection</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 text-purple-500" />
                <span>Contact support if it persists</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={reset}
              variant="default"
              size="lg"
              className="min-w-[140px] flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[140px]"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>

            <Button asChild variant="ghost" size="lg" className="min-w-[140px]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If this error continues to occur, please save any unsaved work and
              contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
