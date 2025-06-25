// src/components/conversation-stats.tsx
"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  countTokens,
  calculateCost,
  formatCost,
  getTotalConversationTokens,
} from "@/lib/tokens";
import { BarChart3, DollarSign, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationStatsProps {
  messages: Message[];
  model?: string;
  className?: string;
}

export const ConversationStats = memo(
  ({
    messages,
    model = "claude-3-5-sonnet-20241022",
    className,
  }: ConversationStatsProps) => {
    if (messages.length === 0) return null;

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    const inputTokens = getTotalConversationTokens(userMessages);
    const outputTokens = getTotalConversationTokens(assistantMessages);
    const totalTokens = inputTokens + outputTokens;

    const inputCost = calculateCost(inputTokens, model, "input");
    const outputCost = calculateCost(outputTokens, model, "output");
    const totalCost = inputCost + outputCost;

    // Context window warning (Claude 3.5 Sonnet has 200K context)
    const contextLimit = 200000;
    const contextUsagePercent = (totalTokens / contextLimit) * 100;
    const isNearLimit = contextUsagePercent > 80;

    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {/* Message Count */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {messages.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium mb-1">Messages</div>
                <div className="text-xs text-muted-foreground">
                  {userMessages.length} from you, {assistantMessages.length}{" "}
                  from Claude
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Token Count */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 font-mono",
                  isNearLimit && "border-orange-500 text-orange-600"
                )}
              >
                <BarChart3 className="h-3 w-3" />
                {totalTokens.toLocaleString()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2 text-sm">
                <div className="font-medium">Token Usage</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Input:</span>
                  <span className="font-mono">
                    {inputTokens.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Output:</span>
                  <span className="font-mono">
                    {outputTokens.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-mono font-medium">
                    {totalTokens.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Context:</span>
                  <span
                    className={cn(
                      "font-mono",
                      isNearLimit ? "text-orange-600" : "text-green-600"
                    )}
                  >
                    {contextUsagePercent.toFixed(1)}%
                  </span>
                </div>
                {isNearLimit && (
                  <div className="text-xs text-orange-600 border-t pt-1">
                    ⚠️ Approaching context limit
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Cost */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-green-600">
                <DollarSign className="h-3 w-3" />
                {formatCost(totalCost)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2 text-sm">
                <div className="font-medium">Estimated Cost</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Input:</span>
                  <span className="font-mono text-green-600">
                    {formatCost(inputCost)}
                  </span>
                  <span className="text-muted-foreground">Output:</span>
                  <span className="font-mono text-green-600">
                    {formatCost(outputCost)}
                  </span>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-mono font-medium text-green-600">
                    {formatCost(totalCost)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-1">
                  Based on Claude 3.5 Sonnet pricing
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

ConversationStats.displayName = "ConversationStats";
