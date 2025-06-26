// src/components/edit-message-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Edit3, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface EditMessageButtonProps {
  message: Message;
  messageIndex: number;
  onEdit: (messageIndex: number, newContent: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  className?: string;
}

export function EditMessageButton({
  message,
  messageIndex,
  onEdit,
  isEditing,
  onStartEdit,
  onCancelEdit,
  className,
}: EditMessageButtonProps) {
  const [editContent, setEditContent] = useState(message.content);

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

  const handleStartEdit = () => {
    setEditContent(message.content);
    onStartEdit();
  };

  if (isEditing) {
    return (
      <Card className="p-4 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="space-y-3">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Edit your message
          </div>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] resize-y"
            placeholder="Edit your message..."
            autoFocus
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
              Save & Continue
            </Button>
          </div>
          <div className="text-xs text-muted-foreground bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
            💡 Saving will create a new conversation branch from this point
          </div>
        </div>
      </Card>
    );
  }

  // Only show edit button for user messages
  if (message.role !== "user") {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleStartEdit}
      className={cn(
        "h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80",
        "transition-all duration-200",
        className
      )}
      title="Edit message"
    >
      <Edit3 className="h-3.5 w-3.5" />
    </Button>
  );
}
