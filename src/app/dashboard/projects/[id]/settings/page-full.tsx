"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/loading-button";
import {
  ArrowLeft,
  Settings,
  Users,
  Link as LinkIcon,
  Copy,
  Trash2,
  UserPlus,
  Crown,
  UserMinus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  ownerId: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
    avatar?: string;
  };
}

interface InviteLink {
  id: string;
  token: string;
  expiresAt: string;
  maxUses?: number;
  currentUses: number;
  createdAt: string;
  isActive: boolean;
}

interface ProjectSettingsProps {
  params: { id: string };
}

export default function ProjectSettings({ params }: ProjectSettingsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${params.id}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to fetch project");
      }
      const projectData = await projectResponse.json();
      setProject(projectData);

      // Fetch project members
      const membersResponse = await fetch(`/api/projects/${params.id}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      // Fetch pending invitations
      const invitationsResponse = await fetch(
        `/api/projects/${params.id}/invitations`
      );
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInviteLinks(invitationsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Fetch project data
  useEffect(() => {
    if (status === "authenticated") {
      fetchProjectData();
    }
  }, [status, params.id, fetchProjectData]);
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Project updated successfully!");
        setProject(data.project);
      } else {
        setError(data.error || "Failed to update project");
      }
    } catch {
      setError("An error occurred while updating project");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInviteLink = async () => {
    setCreatingInvite(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${params.id}/invite-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresInDays: 7, // 7 days expiry
          maxUses: 10, // Max 10 uses
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Invite link created successfully!");
        setInviteLinks([data.inviteLink, ...inviteLinks]);
      } else {
        setError(data.error || "Failed to create invite link");
      }
    } catch {
      setError("An error occurred while creating invite link");
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/join/${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSuccess("Invite link copied to clipboard!");
    } catch {
      setError("Failed to copy invite link");
    }
  };

  const handleRevokeInviteLink = async (linkId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${params.id}/invite-links/${linkId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("Invite link revoked successfully!");
        setInviteLinks(inviteLinks.filter((link) => link.id !== linkId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to revoke invite link");
      }
    } catch {
      setError("An error occurred while revoking invite link");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${params.id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSuccess("Member removed successfully!");
        setMembers(members.filter((member) => member.id !== memberId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to remove member");
      }
    } catch {
      setError("An error occurred while removing member");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Project not found
          </h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = project.ownerId === (session?.user as { id: string })?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/projects/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Project Settings
                </h1>
                <p className="text-sm text-muted-foreground">{project.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status Messages */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </div>
          )}

          {/* General Settings */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectDescription">Description</Label>
                    <Textarea
                      id="projectDescription"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      placeholder="Project description (optional)"
                    />
                  </div>
                  <LoadingButton type="submit" isLoading={saving}>
                    Update Project
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Invite Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Invite Links
                </span>
                {isOwner && (
                  <LoadingButton
                    onClick={handleCreateInviteLink}
                    isLoading={creatingInvite}
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Invite Link
                  </LoadingButton>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inviteLinks.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No invite links created yet
                  </p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Create invite links to allow others to join your project
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {inviteLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            /join/{link.token.substring(0, 8)}...
                          </code>
                          {link.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Uses: {link.currentUses}
                          {link.maxUses ? `/${link.maxUses}` : ""} • Expires:{" "}
                          {new Date(link.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInviteLink(link.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeInviteLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {member.user.avatar ? (
                            <Image
                              src={member.user.avatar}
                              alt={member.user.displayName || member.user.email}
                              className="w-10 h-10 rounded-full"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {(member.user.displayName || member.user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.displayName ||
                              member.user.username ||
                              member.user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.role === "owner" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Member
                          </span>
                        )}
                        {isOwner && member.role !== "owner" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      Delete Project
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete this project and all its data. This
                      action cannot be undone.
                    </p>
                    <Button variant="destructive" disabled>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
