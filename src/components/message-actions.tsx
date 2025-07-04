// src/components/message-actions.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Edit3,
  RefreshCw,
  Copy,
  GitBranch,
  Trash2,
  Check,
  X,
  Share,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageActionsProps {
  message: Message;
  messageIndex: number;
  onEdit: (messageIndex: number, newContent: string) => void;
  onRegenerate: (messageIndex: number) => void;
  onBranch: (messageIndex: number) => void;
  onDelete: (messageIndex: number) => void;
  onCopy: (content: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  className?: string;
}

export function MessageActions({
  message,
  messageIndex,
  onEdit,
  onRegenerate,
  onBranch,
  onDelete,
  onCopy,
  isEditing,
  onStartEdit,
  onCancelEdit,
  className,
}: MessageActionsProps) {
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(messageIndex, editContent.trim());
    }
    onCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    onCancelEdit();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    onCopy(message.content);
    setShowActions(false);
  };

  const handleRegenerate = () => {
    onRegenerate(messageIndex);
    setShowActions(false);
  };

  const handleBranch = () => {
    onBranch(messageIndex);
    setShowActions(false);
  };

  const handleDelete = () => {
    if (confirm("Delete this message and all messages after it?")) {
      onDelete(messageIndex);
    }
    setShowActions(false);
  };

  const handleToggleActions = () => {
    if (!showActions && buttonRef.current) {
      // Calculate position relative to viewport
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        x: rect.right - 180, // Position menu to the left of button
        y: rect.bottom + 4, // Position below button
      });
    }
    setShowActions(!showActions);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showActions &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        // Check if click is inside the menu
        const menuElement = document.getElementById(`menu-${message.id}`);
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowActions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActions, message.id]);

  if (isEditing) {
    return (
      <Card className={cn("p-4 border-dashed border-orange-300", className)}>
        <div className="space-y-3">
          <div className="text-sm font-medium text-orange-600">
            Editing{" "}
            {message.role === "user" ? "your message" : "Claude's response"}
          </div>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] resize-y"
            placeholder={
              message.role === "user"
                ? "Edit your message..."
                : "Edit Claude's response..."
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
            >
              <Check className="h-3 w-3 mr-1" />
              Save Changes
            </Button>
          </div>
          {message.role === "user" && (
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
              💡 <strong>Tip:</strong> Editing your message will regenerate all
              responses after this point.
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Actions Trigger */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              onClick={handleToggleActions}
              className={cn(
                "h-6 w-6 rounded-full bg-background border border-border shadow-sm",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                showActions && "opacity-100"
              )}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Message actions</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Actions Menu - Rendered as Portal */}
      {showActions &&
        typeof window !== "undefined" &&
        createPortal(
          <Card
            id={`menu-${message.id}`}
            className="fixed z-50 p-2 shadow-lg w-fit"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            <div className="space-y-1">
              {/* Copy */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="w-full justify-start"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy message
              </Button>

              {/* Edit */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStartEdit();
                  setShowActions(false);
                }}
                className="w-full justify-start"
              >
                <Edit3 className="h-3 w-3 mr-2" />
                Edit message
              </Button>

              {/* Regenerate (only for assistant messages) */}
              {message.role === "assistant" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Regenerate response
                </Button>
              )}

              {/* Branch conversation */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBranch}
                className="w-full justify-start"
              >
                <GitBranch className="h-3 w-3 mr-2" />
                Branch from here
              </Button>

              <div className="border-t border-border my-1" />

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete from here
              </Button>
            </div>
          </Card>,
          document.body
        )}
    </div>
  );
}
