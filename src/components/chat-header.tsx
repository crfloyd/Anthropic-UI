// src/components/chat-header.tsx
"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Settings,
  Moon,
  Sun,
  Menu,
  BarChart3,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationStats } from "@/components/conversation-stats";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextStatus {
  status: "safe" | "warning" | "critical" | "emergency";
}

interface ChatHeaderProps {
  currentConversationId: string | null;
  messages: Message[];
  contextStatus: ContextStatus;
  isDark: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onToggleSidebar: () => void;
  onToggleExport: () => void;
  onToggleContextManager: () => void;
  onToggleTheme: () => void;
  onToggleSettings: () => void;
  onSignOut: () => void;
}

export const ChatHeader = memo(
  ({
    currentConversationId,
    messages,
    contextStatus,
    isDark,
    onToggleSidebar,
    onToggleExport,
    onToggleContextManager,
    onToggleTheme,
    onToggleSettings,
  }: ChatHeaderProps) => {
    return (
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex-shrink-0">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hidden md:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Claude API Chat</h1>
            {currentConversationId && (
              <span className="text-sm text-muted-foreground">
                • Conversation saved
              </span>
            )}
            {messages.length > 0 && (
              <ConversationStats
                messages={messages}
                className="hidden sm:flex"
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExport}
                className="rounded-full"
                title="Export Conversation"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleContextManager}
              className={cn(
                "rounded-full",
                contextStatus.status === "emergency" &&
                  "text-red-600 animate-pulse",
                contextStatus.status === "critical" && "text-orange-600",
                contextStatus.status === "warning" && "text-yellow-600"
              )}
              title="Context Management"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="rounded-full"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onToggleSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    );
  }
);

ChatHeader.displayName = "ChatHeader";
