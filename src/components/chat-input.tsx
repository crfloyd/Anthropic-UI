// src/components/chat-input.tsx
"use client";

import { memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { FileUpload, UploadedFile } from "@/components/file-upload";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = memo(
  ({
    input,
    onInputChange,
    uploadedFiles,
    onFilesChange,
    onSubmit,
    onPaste,
    onKeyDown,
    isLoading,
    disabled = false,
  }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isSubmitDisabled =
      (!input.trim() && uploadedFiles.length === 0) || isLoading || disabled;

    return (
      <div className="flex-shrink-0 w-full">
        <Card className="p-4">
          <FileUpload
            files={uploadedFiles}
            onFilesChange={onFilesChange}
            disabled={isLoading || disabled}
            className="mb-2"
          />

          <form onSubmit={onSubmit} className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                disabled={isLoading || disabled}
                className="min-h-[60px] max-h-[200px] resize-none"
                rows={1}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              size="icon"
              className="self-end h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
