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
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  size = "sm",
}: ProjectInviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<InvitationLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expirationTime, setExpirationTime] = useState<string>("never");
  const [customExpiration, setCustomExpiration] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("unlimited");

  // Check if user can create invite links (OWNER only)
  const canCreateInvites = userRole === "OWNER";

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
  const createInviteLink = async (useAdvancedSettings = false) => {
    try {
      setLoading(true);

      // Calculate expiration date if set
      let expiresAt = null;
      if (useAdvancedSettings && expirationTime !== "never") {
        const now = new Date();
        switch (expirationTime) {
          case "1hour":
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case "1day":
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "7days":
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "30days":
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          case "custom":
            if (customExpiration) {
              expiresAt = new Date(customExpiration);
            }
            break;
        }
      }

      // Calculate max uses if set
      let maxUsesNum = null;
      if (useAdvancedSettings && maxUses !== "unlimited") {
        maxUsesNum = parseInt(maxUses);
      }

      const response = await fetch(`/api/projects/${projectId}/invite-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresAt: expiresAt?.toISOString(),
          maxUses: maxUsesNum,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data);
        toast.success("Invitation link created!");
        setShowAdvanced(false); // Close advanced settings
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invitation link");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create invitation link"
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy invitation link to clipboard with enhanced fallback
  const copyToClipboard = async () => {
    if (!inviteLink?.url) {
      toast.error("No invitation link to copy");
      return;
    }

    try {
      // Try modern clipboard API first (works in HTTPS and localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink.url);
        setCopied(true);
        toast.success("✅ Invitation link copied to clipboard!");
        console.log("📋 Copied to clipboard via modern API:", inviteLink.url);
      } else {
        // Enhanced fallback for HTTP, older browsers, or mobile
        console.log("📋 Using fallback copy method");

        // Create a temporary input element (more reliable than textarea on mobile)
        const tempInput = document.createElement("input");
        tempInput.value = inviteLink.url;
        tempInput.style.position = "fixed";
        tempInput.style.top = "0";
        tempInput.style.left = "0";
        tempInput.style.width = "2em";
        tempInput.style.height = "2em";
        tempInput.style.padding = "0";
        tempInput.style.border = "none";
        tempInput.style.outline = "none";
        tempInput.style.boxShadow = "none";
        tempInput.style.background = "transparent";
        tempInput.style.opacity = "0";
        tempInput.style.pointerEvents = "none";
        tempInput.style.zIndex = "-1";

        document.body.appendChild(tempInput);

        try {
          // Focus and select the text
          tempInput.focus();
          tempInput.select();
          tempInput.setSelectionRange(0, 99999); // For mobile devices

          // Try to copy using execCommand
          const successful = document.execCommand("copy");

          if (successful) {
            setCopied(true);
            toast.success("✅ Invitation link copied to clipboard!");
            console.log(
              "📋 Copied to clipboard via execCommand:",
              inviteLink.url
            );
          } else {
            // If execCommand fails, try to select the input field for manual copy
            tempInput.style.opacity = "1";
            tempInput.style.pointerEvents = "auto";
            tempInput.style.position = "relative";
            tempInput.style.width = "100%";
            tempInput.style.zIndex = "1000";

            toast.info("Please manually copy the selected link");
            throw new Error("execCommand copy failed");
          }
        } finally {
          // Clean up the temporary element after a short delay
          setTimeout(() => {
            if (document.body.contains(tempInput)) {
              document.body.removeChild(tempInput);
            }
          }, 100);
        }
      }

      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("❌ Error copying to clipboard:", error);

      // Final fallback: show the URL for manual copying
      toast.error(
        "Copy failed. Please manually copy the link from the input field above."
      );

      // Try to select the input field text for manual copying
      const inputElement = document.getElementById(
        "invite-url"
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
        inputElement.setSelectionRange(0, 99999);
      }
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
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
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
                  Only project owners can create invitation links.
                </p>
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                // Loading state
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : inviteLink ? (
                // Show existing invitation link
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {inviteLink.currentUses}/{inviteLink.maxUses || "∞"}{" "}
                        uses
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => createInviteLink(false)}
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
                        className="shrink-0 min-w-[80px]"
                        disabled={!inviteLink?.url}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            <span className="text-xs">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Share this link with team members to invite them</p>
                    <p>
                      • Click &quot;Copy&quot; button or manually select and
                      copy the link above
                    </p>
                    <p>
                      • Link expires:{" "}
                      {inviteLink.expiresAt
                        ? new Date(inviteLink.expiresAt).toLocaleDateString()
                        : "Never"}
                    </p>
                    <p>
                      • Created:{" "}
                      {new Date(inviteLink.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(inviteLink.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Advanced
                      {showAdvanced ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Advanced form for existing link */}
                  {showAdvanced && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="text-center">
                        <h4 className="font-medium text-sm">
                          Regenerate with New Settings
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Create a new link with custom expiration and usage
                          limits
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Expiration Time */}
                        <div>
                          <Label htmlFor="expiration-existing">
                            Link Expiration
                          </Label>
                          <Select
                            value={expirationTime}
                            onValueChange={setExpirationTime}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select expiration time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">
                                Never expires
                              </SelectItem>
                              <SelectItem value="1hour">1 hour</SelectItem>
                              <SelectItem value="1day">1 day</SelectItem>
                              <SelectItem value="7days">7 days</SelectItem>
                              <SelectItem value="30days">30 days</SelectItem>
                              <SelectItem value="custom">
                                Custom date
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Custom Expiration Date */}
                        {expirationTime === "custom" && (
                          <div>
                            <Label htmlFor="customExpiration-existing">
                              Custom Expiration Date
                            </Label>
                            <Input
                              id="customExpiration-existing"
                              type="datetime-local"
                              value={customExpiration}
                              onChange={(e) =>
                                setCustomExpiration(e.target.value)
                              }
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                        )}

                        {/* Max Uses */}
                        <div>
                          <Label htmlFor="maxUses-existing">Maximum Uses</Label>
                          <Select value={maxUses} onValueChange={setMaxUses}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select usage limit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="1">1 use</SelectItem>
                              <SelectItem value="5">5 uses</SelectItem>
                              <SelectItem value="10">10 uses</SelectItem>
                              <SelectItem value="25">25 uses</SelectItem>
                              <SelectItem value="50">50 uses</SelectItem>
                              <SelectItem value="100">100 uses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowAdvanced(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => createInviteLink(true)}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate Link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // No invitation link exists - show create form
                <div className="space-y-6">
                  {!showAdvanced ? (
                    // Simple create form
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
                      <div className="space-y-3">
                        <Button
                          onClick={() => createInviteLink(false)}
                          disabled={loading}
                          className="w-full"
                        >
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
                        <Button
                          variant="outline"
                          onClick={() => setShowAdvanced(true)}
                          className="w-full"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Advanced Settings
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Advanced create form
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="font-medium">
                          Advanced Invitation Settings
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Customize your invitation link with expiration and
                          usage limits
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Expiration Time */}
                        <div>
                          <Label htmlFor="expiration">Link Expiration</Label>
                          <Select
                            value={expirationTime}
                            onValueChange={setExpirationTime}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select expiration time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">
                                Never expires
                              </SelectItem>
                              <SelectItem value="1hour">1 hour</SelectItem>
                              <SelectItem value="1day">1 day</SelectItem>
                              <SelectItem value="7days">7 days</SelectItem>
                              <SelectItem value="30days">30 days</SelectItem>
                              <SelectItem value="custom">
                                Custom date
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Custom Expiration Date */}
                        {expirationTime === "custom" && (
                          <div>
                            <Label htmlFor="customExpiration">
                              Custom Expiration Date
                            </Label>
                            <Input
                              id="customExpiration"
                              type="datetime-local"
                              value={customExpiration}
                              onChange={(e) =>
                                setCustomExpiration(e.target.value)
                              }
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                        )}

                        {/* Max Uses */}
                        <div>
                          <Label htmlFor="maxUses">Maximum Uses</Label>
                          <Select value={maxUses} onValueChange={setMaxUses}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select usage limit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="1">1 use</SelectItem>
                              <SelectItem value="5">5 uses</SelectItem>
                              <SelectItem value="10">10 uses</SelectItem>
                              <SelectItem value="25">25 uses</SelectItem>
                              <SelectItem value="50">50 uses</SelectItem>
                              <SelectItem value="100">100 uses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowAdvanced(false)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => createInviteLink(true)}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              Create Link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 