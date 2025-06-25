// src/components/context-manager.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Scissors,
  BarChart3,
  MessageSquare,
  Clock,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getContextStatus,
  trimConversation,
  getRecommendedTrimTarget,
  MessageWithTokens,
  formatCost,
  calculateCost,
} from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface ContextManagerProps {
  messages: MessageWithTokens[];
  model?: string;
  onTrimConversation: (trimmedMessages: MessageWithTokens[]) => void;
  onClose: () => void;
}

export function ContextManager({
  messages,
  model = "claude-3-5-sonnet-20241022",
  onTrimConversation,
  onClose,
}: ContextManagerProps) {
  const [trimStrategy, setTrimStrategy] = useState<"recent">("recent");
  const [isProcessing, setIsProcessing] = useState(false);

  const contextStatus = getContextStatus(messages, model);
  const recommendedTarget = getRecommendedTrimTarget(
    contextStatus.totalTokens,
    model
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-orange-600";
      case "emergency":
        return "text-red-600";
      default:
        return "text-green-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "warning":
      case "critical":
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const handleTrimConversation = async (targetTokens: number) => {
    setIsProcessing(true);

    try {
      const result = trimConversation(messages, targetTokens, trimStrategy);

      if (result.removedCount > 0) {
        onTrimConversation(result.trimmedMessages);
        onClose();
      }
    } catch (error) {
      console.error("Error trimming conversation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const previewTrim = (targetTokens: number) => {
    return trimConversation(messages, targetTokens, trimStrategy);
  };

  const aggressiveTrim = previewTrim(Math.floor(contextStatus.limit * 0.3)); // 30%
  const moderateTrim = previewTrim(Math.floor(contextStatus.limit * 0.5)); // 50%
  const lightTrim = previewTrim(Math.floor(contextStatus.limit * 0.7)); // 70%

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(contextStatus.status)}
            <h2 className="text-xl font-semibold">Context Management</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Context Usage</span>
            <Badge
              variant="outline"
              className={cn("gap-1", getStatusColor(contextStatus.status))}
            >
              {getStatusIcon(contextStatus.status)}
              {(contextStatus.percentage * 100).toFixed(1)}%
            </Badge>
          </div>

          <Progress value={contextStatus.percentage * 100} className="h-2" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{contextStatus.totalTokens.toLocaleString()} tokens</span>
            <span>{contextStatus.limit.toLocaleString()} limit</span>
          </div>
        </div>

        {/* Status Alert */}
        {contextStatus.status !== "safe" && (
          <Alert
            className={cn(
              contextStatus.status === "emergency" && "border-red-500",
              contextStatus.status === "critical" && "border-orange-500",
              contextStatus.status === "warning" && "border-yellow-500"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {contextStatus.status === "emergency" && (
                <>
                  <strong>Emergency:</strong> You're at{" "}
                  {(contextStatus.percentage * 100).toFixed(1)}% of the context
                  limit. Trim the conversation immediately to avoid API errors.
                </>
              )}
              {contextStatus.status === "critical" && (
                <>
                  <strong>Critical:</strong> Context usage is high (
                  {(contextStatus.percentage * 100).toFixed(1)}%). Consider
                  trimming to reduce costs and improve performance.
                </>
              )}
              {contextStatus.status === "warning" && (
                <>
                  <strong>Warning:</strong> Context usage is approaching the
                  limit ({(contextStatus.percentage * 100).toFixed(1)}%).
                  Monitor your conversation length.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Trim Options */}
        {contextStatus.status !== "safe" && (
          <div className="space-y-4">
            <h3 className="font-medium">Trim Options</h3>

            <div className="grid gap-3">
              {/* Light Trim */}
              <Card
                className="p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() =>
                  handleTrimConversation(Math.floor(contextStatus.limit * 0.7))
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Light Trim</div>
                      <div className="text-sm text-muted-foreground">
                        Remove {lightTrim.removedCount} oldest messages
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      70% →{" "}
                      {(
                        ((lightTrim.trimmedMessages.length > 0
                          ? lightTrim.trimmedMessages.reduce(
                              (sum, msg) => sum + (msg.tokens || 0),
                              0
                            )
                          : 0) /
                          contextStatus.limit) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-muted-foreground">
                      Save{" "}
                      {formatCost(
                        calculateCost(lightTrim.tokensSaved, model, "input")
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Moderate Trim */}
              <Card
                className="p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() =>
                  handleTrimConversation(Math.floor(contextStatus.limit * 0.5))
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <Scissors className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">Moderate Trim</div>
                      <div className="text-sm text-muted-foreground">
                        Remove {moderateTrim.removedCount} oldest messages
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      50% →{" "}
                      {(
                        ((moderateTrim.trimmedMessages.length > 0
                          ? moderateTrim.trimmedMessages.reduce(
                              (sum, msg) => sum + (msg.tokens || 0),
                              0
                            )
                          : 0) /
                          contextStatus.limit) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-muted-foreground">
                      Save{" "}
                      {formatCost(
                        calculateCost(moderateTrim.tokensSaved, model, "input")
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Aggressive Trim */}
              <Card
                className="p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() =>
                  handleTrimConversation(Math.floor(contextStatus.limit * 0.3))
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Zap className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Aggressive Trim</div>
                      <div className="text-sm text-muted-foreground">
                        Remove {aggressiveTrim.removedCount} oldest messages
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      30% →{" "}
                      {(
                        ((aggressiveTrim.trimmedMessages.length > 0
                          ? aggressiveTrim.trimmedMessages.reduce(
                              (sum, msg) => sum + (msg.tokens || 0),
                              0
                            )
                          : 0) /
                          contextStatus.limit) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-muted-foreground">
                      Save{" "}
                      {formatCost(
                        calculateCost(
                          aggressiveTrim.tokensSaved,
                          model,
                          "input"
                        )
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-xs text-muted-foreground">
              💡 Trimming removes older messages but keeps the conversation
              flow. Recent messages are always preserved.
            </div>
          </div>
        )}

        {/* Conversation Stats */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="font-medium text-sm">Conversation Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span>{contextStatus.totalTokens.toLocaleString()} tokens</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
