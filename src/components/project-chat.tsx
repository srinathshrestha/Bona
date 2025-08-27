"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Send, 
  Reply, 
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

export function ProjectChat({ projectId, userRole, trigger }: ProjectChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user can send messages
  const canSendMessages = userRole !== "VIEWER";

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open) {
      fetchMessages();
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      if (!loading) setLoading(true);
      
      const response = await fetch(`/api/projects/${projectId}/messages?limit=100`);
      
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
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          replyToId: replyingTo?.id,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        setReplyingTo(null);
        await fetchMessages(); // Refresh messages
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

  const getUserAvatar = (user: Message["user"]) => {
    if (!user) {
      return `https://ui-avatars.com/api/?name=Unknown%20User&background=random`;
    }
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(
      getUserDisplayName(user)
    )}&background=random`;
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Default trigger
  const defaultTrigger = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6 text-center">
        <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="font-medium text-foreground">Team Chat</p>
        <p className="text-sm text-muted-foreground">
          Communicate with team
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
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
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto space-y-3 p-4 ${expanded ? 'min-h-[400px]' : 'min-h-[300px]'}`}>
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading messages...</span>
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
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* Reply context */}
                {message.replyTo && message.replyTo.user && (
                  <div className="ml-4 pl-4 border-l-2 border-muted bg-muted/20 rounded-r-lg p-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <img
                        src={getUserAvatar(message.replyTo.user)}
                        alt={getUserDisplayName(message.replyTo.user)}
                        className="w-4 h-4 rounded-full"
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
                    <img
                      src={getUserAvatar(message.user)}
                      alt={getUserDisplayName(message.user)}
                      className="w-8 h-8 rounded-full flex-shrink-0"
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
                      <p className="text-sm text-foreground break-words">
                        {message.content}
                      </p>
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
                              {message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}
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

            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={replyingTo ? "Write a reply..." : "Type a message..."}
                className="flex-1"
                disabled={sending}
                maxLength={1000}
              />
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