"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

// Interface for invitation link data
interface InvitationLink {
  id: string;
  secretToken: string;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  createdAt: string;
  url: string;
}

// Props for the invite dialog component
interface ProjectInviteDialogProps {
  projectId: string;
  userRole: string;
  trigger?: React.ReactNode; // Custom trigger button
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ProjectInviteDialog({ 
  projectId, 
  userRole,
  trigger,
  variant = "outline",
  size = "sm" 
}: ProjectInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<InvitationLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if user can create invite links (OWNER/ADMIN)
  const canCreateInvites = userRole === "OWNER" || userRole === "ADMIN";

  // Fetch existing invitation link
  const fetchInviteLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/invite-link`);
      
      if (response.ok) {
        const data = await response.json();
        setInviteLink(data);
      } else if (response.status === 404) {
        // No active invite link exists
        setInviteLink(null);
      } else {
        throw new Error("Failed to fetch invitation link");
      }
    } catch (error) {
      console.error("Error fetching invite link:", error);
      toast.error("Failed to load invitation link");
    } finally {
      setLoading(false);
    }
  };

  // Create new invitation link
  const createInviteLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/invite-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Use default settings
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data);
        toast.success("Invitation link created!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invitation link");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invitation link");
    } finally {
      setLoading(false);
    }
  };

  // Copy invitation link to clipboard
  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink.url);
      setCopied(true);
      toast.success("Invitation link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  // Handle dialog open
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && canCreateInvites) {
      fetchInviteLink();
    }
  };

  // Default trigger button
  const defaultTrigger = (
    <Button variant={variant} size={size}>
      <Users className="w-4 h-4 mr-2" />
      Invite
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Invite Team Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!canCreateInvites ? (
            // Show permission message for non-admin users
            <div className="flex items-center p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Permission Required</p>
                <p className="text-xs text-muted-foreground">
                  Only project owners and admins can create invitation links.
                </p>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                // Loading state
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : inviteLink ? (
                // Show existing invitation link
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {inviteLink.currentUses}/{inviteLink.maxUses || "∞"} uses
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createInviteLink}
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-url">Invitation Link</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="invite-url"
                        value={inviteLink.url}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Share this link with team members to invite them</p>
                    <p>• Link expires: {inviteLink.expiresAt ? new Date(inviteLink.expiresAt).toLocaleDateString() : "Never"}</p>
                    <p>• Created: {new Date(inviteLink.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(inviteLink.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Navigate to project settings for advanced options
                        window.location.href = `/dashboard/projects/${projectId}/settings`;
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Advanced
                    </Button>
                  </div>
                </div>
              ) : (
                // No invitation link exists - show create button
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Create Invitation Link</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a secure link to invite new team members
                    </p>
                  </div>
                  <Button onClick={createInviteLink} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Create Invitation Link
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 