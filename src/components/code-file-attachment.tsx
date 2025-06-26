// src/components/code-file-attachment.tsx
"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Code,
  Download,
  Copy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CodeFileAttachmentProps {
  filename: string;
  language: string;
  content: string;
  lineCount: number;
  size: string;
  onOpenInCanvas: () => void;
  className?: string;
}

export const CodeFileAttachment = memo(function CodeFileAttachment({
  filename,
  language,
  content,
  lineCount,
  size,
  onOpenInCanvas,
  className,
}: CodeFileAttachmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const getLanguageIcon = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "javascript":
      case "typescript":
      case "jsx":
      case "tsx":
      case "json":
        return <Code className="h-5 w-5 text-yellow-600" />;
      case "python":
        return <Code className="h-5 w-5 text-blue-600" />;
      case "html":
      case "xml":
        return <Code className="h-5 w-5 text-orange-600" />;
      case "css":
      case "scss":
      case "sass":
        return <Code className="h-5 w-5 text-blue-500" />;
      case "java":
        return <Code className="h-5 w-5 text-red-600" />;
      case "rust":
        return <Code className="h-5 w-5 text-orange-700" />;
      case "go":
        return <Code className="h-5 w-5 text-cyan-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "javascript":
      case "typescript":
      case "jsx":
      case "tsx":
      case "json":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "python":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "html":
      case "xml":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "css":
      case "scss":
      case "sass":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "java":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "rust":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "go":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("my-4", className)}
    >
      <Card
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
          "border-l-blue-500 hover:border-l-blue-600",
          "bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent",
          isHovered && "scale-[1.02] shadow-lg"
        )}
        onClick={onOpenInCanvas}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          {/* Left side - File info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              {getLanguageIcon(language)}
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">{filename}</h4>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    getLanguageColor(language)
                  )}
                >
                  {language}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{lineCount} lines</span>
                <span>•</span>
                <span>{size}</span>
                <span>•</span>
                <motion.span
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  Click to open
                </motion.span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{
                opacity: isHovered ? 1 : 0.7,
                x: isHovered ? 0 : 10,
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                title="Copy code"
              >
                {copied ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="h-4 w-4 text-green-600"
                  >
                    ✓
                  </motion.div>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              animate={{ x: isHovered ? 0 : -4 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
