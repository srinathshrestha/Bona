"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  ArrowLeft,
  FileQuestion,
  Search,
  Folder,
  Users,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          {/* 404 Icon and Number */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 select-none">
                404
              </div>
              <FileQuestion className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-blue-500" />
            </div>
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might
            have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Suggestions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What can you do?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Search className="h-4 w-4 text-blue-500" />
                <span>Check the URL for typos</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Home className="h-4 w-4 text-green-500" />
                <span>Go back to homepage</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Folder className="h-4 w-4 text-orange-500" />
                <span>Browse your projects</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Check your dashboard</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="default"
              size="lg"
              className="min-w-[140px]"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[140px]"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => window.history.back()}
              className="min-w-[140px] flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact support or try
              refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
