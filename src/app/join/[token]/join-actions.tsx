"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface JoinActionsProps {
  token: string;
}

export function JoinActions({ token }: JoinActionsProps) {
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    
    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully joined the project!");
        
        // Redirect to the project dashboard
        router.push(`/dashboard/projects/${data.member.project.id}`);
      } else {
        toast.error(data.error || "Failed to join project");
      }
    } catch (error) {
      console.error("Error joining project:", error);
      toast.error("An error occurred while joining the project");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleJoin}
        disabled={isJoining}
        className="w-full"
        size="lg"
      >
        {isJoining ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            Join Project
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        By joining, you agree to collaborate respectfully and follow project guidelines.
      </p>
    </div>
  );
} 