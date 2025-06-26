// src/components/artifact-canvas.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Copy, FileText, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Monaco Editor - we'll load it dynamically to avoid SSR issues
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  ),
});

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  content: string;
  filename?: string;
}

interface ArtifactCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactData | null;
  onContentChange?: (content: string) => void;
  isDark?: boolean;
  className?: string;
}

export function ArtifactCanvas({
  isOpen,
  onClose,
  artifact,
  onContentChange,
  isDark = false,
  className,
}: ArtifactCanvasProps) {
  const [copied, setCopied] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<any>(null);

  // Reset editor ready state when artifact changes
  useEffect(() => {
    if (artifact) {
      setIsEditorReady(false);
    }
  }, [artifact?.id]);

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case "javascript":
      case "typescript":
      case "jsx":
      case "tsx":
      case "json":
        return <Code className="h-4 w-4 text-yellow-600" />;
      case "python":
        return <Code className="h-4 w-4 text-blue-600" />;
      case "html":
      case "xml":
        return <Code className="h-4 w-4 text-orange-600" />;
      case "css":
      case "scss":
      case "sass":
        return <Code className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCopy = async () => {
    if (artifact?.content) {
      try {
        await navigator.clipboard.writeText(artifact.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Copy failed:", error);
      }
    }
  };

  const handleDownload = () => {
    if (artifact) {
      const filename =
        artifact.filename ||
        `${artifact.title
          .toLowerCase()
          .replace(/\s+/g, "-")}.${getFileExtension(artifact.language)}`;
      const blob = new Blob([artifact.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      jsx: "jsx",
      tsx: "tsx",
      python: "py",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      json: "json",
      markdown: "md",
      yaml: "yml",
      xml: "xml",
    };
    return extensions[language.toLowerCase()] || "txt";
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && onContentChange) {
      onContentChange(value);
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  if (!isOpen || !artifact) return null;

  return (
    <div
      className={cn(
        "h-full bg-background border-l border-border shadow-xl",
        "flex flex-col",
        className
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center justify-between p-4 border-b border-border bg-muted/50 flex-shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            {getLanguageIcon(artifact.language)}
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.h3
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="font-semibold truncate"
            >
              {artifact.title}
            </motion.h3>
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {artifact.language} • {artifact.content.split("\n").length} lines
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 transition-all duration-200 hover:scale-105"
            title="Copy code"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                  className="h-4 w-4 text-green-600"
                >
                  ✓
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 transition-all duration-200 hover:scale-105"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 transition-all duration-200 hover:scale-105 hover:text-red-500"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Editor */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex-1 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={artifact.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <MonacoEditor
              height="100%"
              language={artifact.language}
              value={artifact.content}
              onChange={handleEditorChange}
              theme={isDark ? "vs-dark" : "vs-light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: "line",
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  useShadows: false,
                },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                cursorBlinking: "smooth",
              }}
              onMount={handleEditorMount}
            />
          </motion.div>
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {!isEditorReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="p-3 border-t border-border bg-muted/50 text-xs text-muted-foreground flex-shrink-0"
      >
        Click code blocks in the chat to open them here • Changes are not saved
        automatically
      </motion.div>
    </div>
  );
}
