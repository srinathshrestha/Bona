import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Users, Settings } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Animated Loading Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-6">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
              {/* Floating icons animation */}
              <div className="absolute inset-0 animate-pulse">
                <FileText
                  className="absolute -top-2 -right-2 h-4 w-4 text-blue-400 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <Users
                  className="absolute -bottom-2 -left-2 h-4 w-4 text-blue-400 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
                <Settings
                  className="absolute -top-2 -left-2 h-4 w-4 text-blue-400 animate-bounce"
                  style={{ animationDelay: "0.6s" }}
                />
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please wait while we prepare your workspace
          </p>

          {/* Loading Progress Indicator */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Initializing your experience...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
