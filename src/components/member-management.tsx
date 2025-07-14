"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Eye,
  MoreHorizontal,
  Activity,
  Settings,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectRole } from "@prisma/client";

interface Member {
  id: string;
  role: ProjectRole;
  joinedAt: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

interface Permissions {
  role: ProjectRole | null;
  permissions: {
    canManageMembers: boolean;
    canInvite: boolean;
    canManageProject: boolean;
  };
}

interface AdmissionStatus {
  isOpen: boolean;
  activeInviteLink: {
    url: string;
    currentUses: number;
    maxUses?: number;
    expiresAt?: string;
  } | null;
  stats: {
    totalJoins: number;
    recentJoins: number;
  };
}

interface MemberManagementProps {
  projectId: string;
  initialMembers: Member[];
  initialPermissions: Permissions;
}

export function MemberManagement({
  projectId,
  initialMembers,
  initialPermissions,
}: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<ProjectRole>(ProjectRole.MEMBER);
  const [reason, setReason] = useState("");

  // Load admission status if user is owner
  useEffect(() => {
    if (permissions.permissions.canInvite) {
      loadAdmissionStatus();
    }
  }, [permissions.permissions.canInvite]);

  const loadAdmissionStatus = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/admission-control`);
      if (response.ok) {
        const status = await response.json();
        setAdmissionStatus(status);
      }
    } catch (error) {
      console.error("Error loading admission status:", error);
    }
  };

  const getRoleIcon = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER:
        return <Crown className="w-4 h-4" />;
      case ProjectRole.ADMIN:
        return <Shield className="w-4 h-4" />;
      case ProjectRole.MEMBER:
        return <UserCheck className="w-4 h-4" />;
      case ProjectRole.VIEWER:
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER:
        return "default" as const;
      case ProjectRole.ADMIN:
        return "secondary" as const;
      case ProjectRole.MEMBER:
        return "outline" as const;
      case ProjectRole.VIEWER:
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const canManageRole = (targetRole: ProjectRole) => {
    if (permissions.role === ProjectRole.OWNER) return true;
    if (permissions.role === ProjectRole.ADMIN) {
      return targetRole === ProjectRole.MEMBER || targetRole === ProjectRole.VIEWER;
    }
    return false;
  };

  const handleRoleChange = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedMember.user.id,
          newRole,
          reason: reason.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setMembers(prev => prev.map(member => 
          member.user.id === selectedMember.user.id 
            ? { ...member, role: newRole }
            : member
        ));

        toast.success(`Role updated to ${newRole}`);
        setShowRoleDialog(false);
        setReason("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred while updating the role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedMember.user.id,
          reason: reason.trim() || undefined,
        }),
      });

      if (response.ok) {
        // Remove from local state
        setMembers(prev => prev.filter(member => member.user.id !== selectedMember.user.id));
        
        toast.success("Member removed successfully");
        setShowRemoveDialog(false);
        setReason("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred while removing the member");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdmissions = async () => {
    if (!admissionStatus) return;

    setIsLoading(true);
    try {
      const method = admissionStatus.isOpen ? "DELETE" : "POST";
      const response = await fetch(`/api/projects/${projectId}/admission-control`, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await loadAdmissionStatus();
        toast.success(admissionStatus.isOpen ? "Admissions closed" : "Admissions opened");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to toggle admissions");
      }
    } catch (error) {
      toast.error("An error occurred while toggling admissions");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (admissionStatus?.activeInviteLink?.url) {
      navigator.clipboard.writeText(admissionStatus.activeInviteLink.url);
      toast.success("Invite link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Admission Control - Owner Only */}
      {permissions.permissions.canInvite && admissionStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Admission Control
              </div>
              <Badge 
                variant={admissionStatus.isOpen ? "default" : "secondary"}
                className="flex items-center"
              >
                {admissionStatus.isOpen ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Open
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Closed
                  </>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {admissionStatus.isOpen ? "Admissions are open" : "Admissions are closed"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {admissionStatus.isOpen 
                    ? "People can join your project using the invitation link"
                    : "No one can join your project right now"
                  }
                </p>
              </div>
              <Button
                onClick={toggleAdmissions}
                disabled={isLoading}
                variant={admissionStatus.isOpen ? "destructive" : "default"}
              >
                {admissionStatus.isOpen ? "Close Admissions" : "Open Admissions"}
              </Button>
            </div>

            {admissionStatus.isOpen && admissionStatus.activeInviteLink && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>Invitation Link</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInviteLink}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(admissionStatus.activeInviteLink?.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
                <Input
                  value={admissionStatus.activeInviteLink.url}
                  readOnly
                  className="font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Uses: {admissionStatus.activeInviteLink.currentUses}</span>
                  {admissionStatus.activeInviteLink.maxUses && (
                    <span>Max: {admissionStatus.activeInviteLink.maxUses}</span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{admissionStatus.stats.totalJoins}</p>
                <p className="text-sm text-muted-foreground">Total Joins</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{admissionStatus.stats.recentJoins}</p>
                <p className="text-sm text-muted-foreground">Recent (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team Members ({members.length})
            </div>
            {permissions.permissions.canInvite && (
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-1" />
                View Activity
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {member.user.displayName || member.user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{member.role}</span>
                  </Badge>

                  {permissions.permissions.canManageMembers && canManageRole(member.role) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Member</DialogTitle>
                          <DialogDescription>
                            Manage {member.user.displayName || member.user.username}'s role and access
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Change Role
                          </Button>
                          
                          {member.role !== ProjectRole.OWNER && (
                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowRemoveDialog(true);
                              }}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Remove from Project
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update {selectedMember?.user.displayName}'s role in this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as ProjectRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {permissions.role === ProjectRole.OWNER && (
                    <SelectItem value={ProjectRole.ADMIN}>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value={ProjectRole.MEMBER}>
                    <div className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value={ProjectRole.VIEWER}>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you changing this person's role?"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
              Remove Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user.displayName} from this project?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remove-reason">Reason (optional)</Label>
              <Textarea
                id="remove-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you removing this person?"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={isLoading}>
              {isLoading ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 