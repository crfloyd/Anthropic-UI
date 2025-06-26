// src/components/file-upload.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Paperclip,
  X,
  FileText,
  Image,
  File,
  Code,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "text" | "code" | "archive" | "other";
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  files,
  onFilesChange,
  disabled = false,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getFileType = (file: File): UploadedFile["type"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("text/") || file.type === "application/json")
      return "text";
    if (
      file.type === "application/javascript" ||
      file.type === "application/typescript" ||
      file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|sql)$/i)
    ) {
      return "code";
    }
    if (
      file.type === "application/zip" ||
      file.type === "application/x-rar-compressed" ||
      file.name.match(/\.(zip|rar|7z|tar|gz)$/i)
    ) {
      return "archive";
    }
    return "other";
  };

  const getFileIcon = (type: UploadedFile["type"]) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "code":
        return <Code className="h-4 w-4" />;
      case "archive":
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return undefined;
  };

  const addFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadedFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const type = getFileType(file);
      const preview = await createFilePreview(file);

      uploadedFiles.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview,
        type,
      });
    }

    onFilesChange([...files, ...uploadedFiles]);
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only stop dragging if we're leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* File Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileSelect}
          disabled={disabled}
          className="flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
      </div>

      {/* Drag and Drop Zone (only shows when dragging) */}
      {isDragging && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        >
          <Card className="p-8 border-2 border-dashed border-primary bg-background">
            <div className="text-center">
              <Paperclip className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
              <p className="text-muted-foreground">
                Release to upload files to your conversation
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Invisible drag zone overlay for the entire chat area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="fixed inset-0 pointer-events-none"
        style={{ pointerEvents: isDragging ? "auto" : "none" }}
      />

      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {files.map((uploadedFile) => (
            <Card
              key={uploadedFile.id}
              className="relative group p-2 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2 max-w-[200px]">
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      {getFileIcon(uploadedFile.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
