// src/components/message-files.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image,
  File,
  Code,
  Archive,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
}

interface MessageFilesProps {
  files: FileAttachment[];
  className?: string;
  messageRole?: "user" | "assistant";
}

export function MessageFiles({
  files,
  className,
  messageRole = "user",
}: MessageFilesProps) {
  if (!files || files.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.startsWith("text/") || type === "application/json")
      return <FileText className="h-4 w-4" />;
    if (
      type === "application/javascript" ||
      type === "application/typescript" ||
      /\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|sql)$/i.test(type)
    ) {
      return <Code className="h-4 w-4" />;
    }
    if (
      type === "application/zip" ||
      type === "application/x-rar-compressed" ||
      /\.(zip|rar|7z|tar|gz)$/i.test(type)
    ) {
      return <Archive className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handlePreview = (file: FileAttachment) => {
    if (file.content) {
      if (file.type.startsWith("image/")) {
        // Open image in new tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                <img src="${file.content}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${file.name}">
              </body>
            </html>
          `);
        }
      } else if (
        file.type.startsWith("text/") ||
        file.type === "application/json"
      ) {
        // Open text content in new tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name}</title></head>
              <body style="margin:0;padding:20px;font-family:monospace;white-space:pre-wrap;background:#f5f5f5;">
                ${file.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
              </body>
            </html>
          `);
        }
      }
    }
  };

  const handleDownload = (file: FileAttachment) => {
    if (file.content) {
      let dataUrl = file.content;

      // For text files, convert to data URL if not already
      if (file.type.startsWith("text/") && !file.content.startsWith("data:")) {
        dataUrl = `data:${file.type};charset=utf-8,${encodeURIComponent(
          file.content
        )}`;
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2 mt-3", className)}>
      {files.map((file) => (
        <Card
          key={file.id}
          className={cn(
            "p-3 max-w-[250px] group hover:bg-accent transition-colors",
            messageRole === "user" ? "bg-muted/30" : "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            {/* File Icon/Preview */}
            <div className="flex-shrink-0">
              {file.type.startsWith("image/") && file.content ? (
                <img
                  src={file.content}
                  alt={file.name}
                  className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80"
                  onClick={() => handlePreview(file)}
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                {/* Preview button for viewable files */}
                {file.content &&
                  (file.type.startsWith("image/") ||
                    file.type.startsWith("text/")) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(file)}
                      className="h-6 w-6"
                      title="Preview"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}

                {/* Download button */}
                {file.content && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file)}
                    className="h-6 w-6"
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
