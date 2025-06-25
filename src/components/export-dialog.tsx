// src/components/export-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  FileText,
  Code,
  Zap,
  Clock,
  Hash,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationExporter, ExportOptions } from "@/lib/export";
import { countTokens } from "@/lib/tokens";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export function ExportDialog({
  isOpen,
  onClose,
  conversation,
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<
    "markdown" | "json" | "compact"
  >("markdown");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeTokenCounts, setIncludeTokenCounts] = useState(false);
  const [preserveCodeBlocks, setPreserveCodeBlocks] = useState(true);
  const [compactTokenLimit, setCompactTokenLimit] = useState([8000]);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !conversation) return null;

  const totalTokens = conversation.messages.reduce(
    (sum, msg) => sum + countTokens(msg.content),
    0
  );

  // Better compact estimation - should be much smaller than original
  const getCompactEstimate = () => {
    // Compact format strips out all fluff and uses compressed notation
    // Should typically be 70-90% smaller than original
    if (totalTokens <= 200) {
      return Math.max(50, totalTokens * 0.4); // Very small convos have overhead
    } else if (totalTokens <= 1000) {
      return totalTokens * 0.2; // 80% reduction
    } else {
      return totalTokens * 0.15; // 85% reduction for large convos
    }
  };

  const estimatedCompactTokens = getCompactEstimate();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeTimestamps,
        includeTokenCounts,
        preserveCodeBlocks,
        maxTokens: compactTokenLimit[0],
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      const dateStr = new Date().toISOString().split("T")[0];
      const titleSlug = conversation.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 30);

      switch (exportFormat) {
        case "markdown":
          content = ConversationExporter.exportToMarkdown(
            conversation,
            options
          );
          filename = `${titleSlug}-${dateStr}.md`;
          mimeType = "text/markdown";
          break;
        case "json":
          content = ConversationExporter.exportToJSON(conversation, options);
          filename = `${titleSlug}-${dateStr}.json`;
          mimeType = "application/json";
          break;
        case "compact":
          content = ConversationExporter.exportCompact(conversation, options);
          filename = `${titleSlug}-compact-${dateStr}.md`;
          mimeType = "text/markdown";
          break;
        default:
          throw new Error("Invalid export format");
      }

      ConversationExporter.downloadFile(content, filename, mimeType);

      // Brief success feedback
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
    }
  };

  const formatDescriptions = {
    markdown: {
      icon: <FileText className="h-4 w-4" />,
      title: "Full Markdown",
      description:
        "Complete conversation with formatting, perfect for documentation",
      fileSize: `~${Math.ceil((totalTokens * 4) / 1024)}KB`,
      tokens: totalTokens,
    },
    json: {
      icon: <Code className="h-4 w-4" />,
      title: "JSON Data",
      description: "Structured data format, ideal for importing or processing",
      fileSize: `~${Math.ceil((totalTokens * 5) / 1024)}KB`,
      tokens: totalTokens,
    },
    compact: {
      icon: <Zap className="h-4 w-4" />,
      title: "AI Continuation Format",
      description:
        "Ultra-compressed data for seamless conversation continuation in new chats",
      fileSize: `~${Math.ceil((estimatedCompactTokens * 4) / 1024)}KB`,
      tokens: estimatedCompactTokens,
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Conversation
            </CardTitle>
            <CardDescription>
              Export "{conversation.title}" in your preferred format
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Conversation Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {conversation.messages.length}
              </div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalTokens.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.ceil(
                  (new Date(conversation.updatedAt).getTime() -
                    new Date(conversation.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
                d
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid gap-3">
              {Object.entries(formatDescriptions).map(([format, info]) => (
                <Card
                  key={format}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-accent",
                    exportFormat === format && "ring-2 ring-primary bg-accent"
                  )}
                  onClick={() => setExportFormat(format as any)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{info.icon}</div>
                      <div>
                        <div className="font-medium">{info.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {info.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {info.fileSize}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {info.tokens.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Compact Options */}
          {exportFormat === "compact" && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <Label className="font-medium text-blue-900 dark:text-blue-100">
                  Compact Settings
                </Label>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm">
                    Token Limit: {compactTokenLimit[0].toLocaleString()}
                  </Label>
                  <Slider
                    value={compactTokenLimit}
                    onValueChange={setCompactTokenLimit}
                    max={20000}
                    min={2000}
                    step={500}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Minimal (2K)</span>
                    <span>Comprehensive (20K)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Preserve Code Blocks</Label>
                    <p className="text-xs text-muted-foreground">
                      Include important code solutions
                    </p>
                  </div>
                  <Switch
                    checked={preserveCodeBlocks}
                    onCheckedChange={setPreserveCodeBlocks}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>AI Continuation Format:</strong> Creates
                  ultra-compressed conversation data optimized for AI parsing.
                  Not human-readable, but perfect for seamlessly continuing
                  conversations in new chats with minimal token usage.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* General Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Options</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Include Timestamps
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add message timestamps to export
                  </p>
                </div>
                <Switch
                  checked={includeTimestamps}
                  onCheckedChange={setIncludeTimestamps}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Include Token Counts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show token usage per message
                  </p>
                </div>
                <Switch
                  checked={includeTokenCounts}
                  onCheckedChange={setIncludeTokenCounts}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
