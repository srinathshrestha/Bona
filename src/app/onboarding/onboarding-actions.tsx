"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


export default function OnboardingActions() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Complete onboarding process
  // This marks the user as onboarded and redirects to dashboard
  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Mark user as onboarded
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isOnboarded: true,
        }),
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        console.error("Failed to complete onboarding");
        // Still redirect to dashboard even if update fails
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Still redirect to dashboard even if error occurs
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={completeOnboarding}
      disabled={loading}
      className="min-w-[160px]"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Setting up...
        </>
      ) : (
        "Get Started"
      )}
    </Button>
  );
}
