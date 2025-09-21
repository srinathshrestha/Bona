"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, AtSign, Users } from "lucide-react";

// Interface for project member data
interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    username: string | null;
    email: string;
    avatar: string | null;
  } | null;
}

// Interface for mention data
interface Mention {
  userId: string;
  username: string;
  displayName?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: Mention[]) => void;
  projectMembers: ProjectMember[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  resetMentions?: boolean;
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  projectMembers,
  placeholder = "Type a message...",
  className = "",
  disabled = false,
  onKeyPress,
  resetMentions = false,
}: MentionInputProps) {
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Reset mentions when parent component clears them
  useEffect(() => {
    if (resetMentions && mentions.length > 0) {
      setMentions([]);
    }
  }, [resetMentions, mentions.length]);

  // Filter members based on mention query
  const filteredMembers = projectMembers.filter((member) => {
    if (!member.user || !member.user.email) {
      return false;
    }

    const query = mentionQuery.toLowerCase();
    const username = member.user.username?.toLowerCase() || "";
    const email = member.user.email.toLowerCase();

    return username.includes(query) || email.includes(query);
  });

  // Handle input change and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @ (meaning mention is complete)
      if (textAfterAt.includes(" ")) {
        setShowMentionList(false);
        setMentionQuery("");
      } else {
        setMentionQuery(textAfterAt);
        setShowMentionList(true);
        setSelectedMentionIndex(0);
      }
    } else {
      setShowMentionList(false);
      setMentionQuery("");
    }
  };

  // Handle mention selection
  const handleMentionSelect = (member: ProjectMember) => {
    if (!member.user || !member.user.email) return;

    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
    const mentionText = `@${member.user.username || member.user.email}`;

    const newValue = textBeforeAt + mentionText + " " + textAfterCursor;
    onChange(newValue);

    // Add to mentions array
    const newMention: Mention = {
      userId: member.user.id,
      username: member.user.username || member.user.email,
      displayName: member.user.username || undefined,
    };

    const updatedMentions = [...mentions, newMention];
    setMentions(updatedMentions);
    onMentionsChange(updatedMentions);

    setShowMentionList(false);
    setMentionQuery("");

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPosition = textBeforeAt.length + mentionText.length + 1;
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle keyboard navigation in mention list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionList) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            Math.min(prev + 1, filteredMembers.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredMembers[selectedMentionIndex]) {
            handleMentionSelect(filteredMembers[selectedMentionIndex]);
          }
          break;
        case "Escape":
          setShowMentionList(false);
          setMentionQuery("");
          break;
      }
    } else {
      // Call the parent's onKeyPress if no mention list is open
      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  // Remove mention from array
  const removeMention = (userId: string) => {
    const updatedMentions = mentions.filter(
      (mention) => mention.userId !== userId
    );
    setMentions(updatedMentions);
    onMentionsChange(updatedMentions);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "MEMBER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "VIEWER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Get user initials for avatar
  const getUserInitials = (username?: string | null) => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="relative">
      {/* Mention badges */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {mentions.map((mention) => (
            <Badge
              key={mention.userId}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <AtSign className="h-3 w-3" />
              <span className="text-xs">
                {mention.displayName || mention.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeMention(mention.userId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />

      {/* Mention list dropdown */}
      {showMentionList && filteredMembers.length > 0 && (
        <Card
          ref={mentionListRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto"
        >
          <CardContent className="p-2">
            <div className="space-y-1">
              {filteredMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    index === selectedMentionIndex
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => handleMentionSelect(member)}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.user?.avatar || ""}
                      alt={member.user?.username || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(member.user?.username)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {member.user?.username ||
                          member.user?.email ||
                          "Unknown User"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @
                      {member.user?.username || member.user?.email || "unknown"}
                    </p>
                  </div>

                  {/* Mention icon */}
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showMentionList && filteredMembers.length === 0 && mentionQuery && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              No members found for &quot;@{mentionQuery}&quot;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
