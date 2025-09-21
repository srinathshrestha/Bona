"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MentionInput } from "@/components/mention-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Reply,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Paperclip,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Interface for file data
interface FileData {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  uploadedById: string;
  createdAt: string;
}

// Interface for message data
interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatar: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      displayName: string | null;
      username: string | null;
      avatar: string | null;
    };
  } | null;
  attachments?: Array<{
    fileId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
  }>;
  mentions?: Array<{
    userId: string;
    username: string;
    displayName?: string;
  }>;
  _count: {
    replies: number;
  };
}

// Props for the chat component
interface ProjectChatProps {
  projectId: string;
  userRole: string;
  trigger?: React.ReactNode;
}

export function ProjectChat({
  projectId,
  userRole,
  trigger,
}: ProjectChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [mentioningFile, setMentioningFile] = useState<FileData | null>(null);
  const [projectFiles, setProjectFiles] = useState<FileData[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mentions, setMentions] = useState<
    Array<{
      userId: string;
      username: string;
      displayName?: string;
    }>
  >([]);
  const [projectMembers, setProjectMembers] = useState<
    Array<{
      id: string;
      role: string;
      user: {
        id: string;
        username: string | null;
        email: string;
        avatar: string | null;
      } | null;
    }>
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resetMentions, setResetMentions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user can send messages
  const canSendMessages = userRole !== "VIEWER";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/messages?limit=100`
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProjectFiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/files?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectFiles(data.files || []);
      } else {
        console.error("Failed to fetch project files");
      }
    } catch (error) {
      console.error("Error fetching project files:", error);
    }
  }, [projectId]);

  // Fetch project members for mentions
  const fetchProjectMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        setProjectMembers(data.members || []);
      } else {
        console.error("Failed to fetch project members");
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  }, [projectId]);

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, projectId, fetchMessages]);

  // Fetch files only when dialog opens (files don't change as frequently)
  useEffect(() => {
    if (open) {
      fetchProjectFiles();
    }
  }, [open, fetchProjectFiles]);

  // Fetch project members when dialog opens
  useEffect(() => {
    if (open) {
      fetchProjectMembers();
    }
  }, [open, fetchProjectMembers]);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          setCurrentUserId(session.user?.id || null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    if (open) {
      getCurrentUser();
    }
  }, [open]);

  // Reset the resetMentions flag after it's been used
  useEffect(() => {
    if (resetMentions) {
      const timer = setTimeout(() => {
        setResetMentions(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [resetMentions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when replying or mentioning file
  useEffect(() => {
    if ((replyingTo || mentioningFile) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo, mentioningFile]);

  // Close file picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showFilePicker &&
        inputRef.current &&
        !inputRef.current.closest(".relative")?.contains(event.target as Node)
      ) {
        setShowFilePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilePicker]);

  // Set up SSE connection for real-time messages
  useEffect(() => {
    if (open && projectId) {
      const eventSource = new EventSource(
        `/api/projects/${projectId}/messages/sse`
      );

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "newMessage") {
            setMessages((prev) => [...prev, message.data]);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [open, projectId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      interface MessagePayload {
        content: string;
        replyToId?: string;
        attachments?: Array<{
          fileId: string;
          filename: string;
          mimeType: string;
          fileSize: number;
        }>;
        mentions?: Array<{
          userId: string;
          username: string;
          displayName?: string;
        }>;
      }

      const messageData: MessagePayload = {
        content: newMessage.trim(),
        replyToId: replyingTo?.id,
        mentions: mentions.length > 0 ? mentions : undefined,
      };

      // Add file attachment if mentioning a file
      if (mentioningFile) {
        messageData.attachments = [
          {
            fileId: mentioningFile._id,
            filename: mentioningFile.originalName,
            mimeType: mentioningFile.mimeType,
            fileSize: mentioningFile.fileSize,
          },
        ];
      }

      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage("");
        setReplyingTo(null);
        setMentioningFile(null);
        setMentions([]);
        setResetMentions(true); // Trigger mention reset
        await fetchMessages(); // Refresh messages
        // If we sent a file attachment, refresh files too
        if (mentioningFile) {
          await fetchProjectFiles();
        }
        scrollToBottom();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUserDisplayName = (user: Message["user"]) => {
    if (!user) {
      return "Unknown User";
    }
    return user.displayName || user.username || "Unknown User";
  };

  // Function to render message content with mentions highlighted
  const renderMessageContent = (
    content: string,
    mentions?: Array<{
      userId: string;
      username: string;
      displayName?: string;
    }>
  ) => {
    if (!mentions || mentions.length === 0) {
      return content;
    }

    let renderedContent = content;

    // Replace @username with highlighted mentions
    mentions.forEach((mention) => {
      const mentionPattern = new RegExp(`@${mention.username}`, "g");
      const isCurrentUserMentioned =
        currentUserId && mention.userId === currentUserId;
      const mentionClass = isCurrentUserMentioned
        ? "inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium border-2 border-yellow-300 dark:border-yellow-600"
        : "inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium";

      renderedContent = renderedContent.replace(
        mentionPattern,
        `<span class="${mentionClass}">@${
          mention.displayName || mention.username
        }</span>`
      );
    });

    return renderedContent;
  };

  // Function to check if current user is mentioned in a message
  const isCurrentUserMentioned = (
    mentions?: Array<{
      userId: string;
      username: string;
      displayName?: string;
    }>
  ) => {
    if (!mentions || !currentUserId) return false;
    return mentions.some((mention) => mention.userId === currentUserId);
  };

  const getUserAvatar = (user: Message["user"]) => {
    if (!user) {
      return `https://ui-avatars.com/api/?name=Unknown%20User&background=random`;
    }
    return (
      user.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        getUserDisplayName(user)
      )}&background=random`
    );
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "📊";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "📈";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    )
      return "📦";
    return "📎";
  };

  // Default trigger
  const defaultTrigger = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6 text-center">
        <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="font-medium text-foreground">Team Chat</p>
        <p className="text-sm text-muted-foreground">Communicate with team</p>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl sm:max-h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Project Chat
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {messages.length} messages
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div
          className={`flex-1 overflow-y-auto space-y-3 p-4 ${
            expanded ? "min-h-[400px]" : "min-h-[300px]"
          }`}
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading messages...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No messages yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start the conversation with your team
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `message-${index}-${message.createdAt}`}
                className={`space-y-2 ${
                  isCurrentUserMentioned(message.mentions)
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 pl-2 rounded-r-lg"
                    : ""
                }`}
              >
                {/* Reply context */}
                {message.replyTo && message.replyTo.user && (
                  <div className="ml-4 pl-4 border-l-2 border-muted bg-muted/20 rounded-r-lg p-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Image
                        src={getUserAvatar(message.replyTo.user)}
                        alt={getUserDisplayName(message.replyTo.user)}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {getUserDisplayName(message.replyTo.user)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.replyTo.content}
                    </p>
                  </div>
                )}

                {/* Main message */}
                {message.user && (
                  <div className="flex items-start space-x-3">
                    <Image
                      src={getUserAvatar(message.user)}
                      alt={getUserDisplayName(message.user)}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {getUserDisplayName(message.user)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-foreground break-words"
                        dangerouslySetInnerHTML={{
                          __html: renderMessageContent(
                            message.content,
                            message.mentions
                          ),
                        }}
                      />

                      {/* File attachments */}
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div
                                key={`${message.id}-${attachment.fileId}-${index}`}
                                className="flex items-center space-x-2 p-2 bg-muted/20 rounded-lg border"
                              >
                                <span className="text-lg">
                                  {getFileIcon(attachment.mimeType)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {attachment.filename}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.fileSize)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Download file"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      {canSendMessages && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(message)}
                            className="h-6 px-2 text-xs"
                          >
                            <Reply className="w-3 h-3 mr-1" />
                            Reply
                          </Button>
                          {message._count.replies > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {message._count.replies}{" "}
                              {message._count.replies === 1
                                ? "reply"
                                : "replies"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {canSendMessages ? (
          <div className="flex-shrink-0 border-t pt-4">
            {/* Reply indicator */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Replying to {getUserDisplayName(replyingTo.user)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {replyingTo.content}
                </p>
              </div>
            )}

            {/* File mention indicator */}
            {mentioningFile && (
              <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getFileIcon(mentioningFile.mimeType)}
                    </span>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Mentioning file:
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {mentioningFile.originalName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMentioningFile(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <MentionInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onMentionsChange={setMentions}
                  projectMembers={projectMembers}
                  placeholder={
                    replyingTo
                      ? "Write a reply..."
                      : mentioningFile
                      ? "Add a message about this file..."
                      : "Type a message... (use @ to mention members)"
                  }
                  className="pr-10"
                  disabled={sending}
                  onKeyPress={handleKeyPress}
                  resetMentions={resetMentions}
                />

                {/* File picker button */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFilePicker(!showFilePicker);
                      // Refresh files when file picker is opened for the first time
                      if (!showFilePicker && projectFiles.length === 0) {
                        fetchProjectFiles();
                      }
                    }}
                    className="h-6 w-6 p-0"
                    type="button"
                    title="Mention a file"
                    disabled={sending}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>

                {/* File picker dropdown */}
                {showFilePicker && projectFiles.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Select a file to mention:
                      </p>
                      {projectFiles.map((file) => (
                        <button
                          key={file._id}
                          onClick={() => {
                            setMentioningFile(file);
                            setShowFilePicker(false);
                          }}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-muted/50 rounded text-left"
                        >
                          <span className="text-lg">
                            {getFileIcon(file.mimeType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showFilePicker && projectFiles.length === 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg p-4 z-10">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No files uploaded to this project yet
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Viewers can read messages but cannot send them
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 