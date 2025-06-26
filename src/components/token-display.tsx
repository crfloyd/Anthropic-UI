// src/components/token-display.tsx
"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { countTokens, calculateCost, formatCost } from "@/lib/tokens";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenDisplayProps {
  content: string;
  role: "user" | "assistant";
  model?: string;
  showInline?: boolean;
  className?: string;
}

export const TokenDisplay = memo(
  ({
    content,
    role,
    model = "claude-3-5-sonnet-20241022",
    showInline = false,
    className,
  }: TokenDisplayProps) => {
    // Memoize expensive calculations
    const { tokens, cost, costFormatted } = useMemo(() => {
      const tokens = countTokens(content);
      const cost = calculateCost(
        tokens,
        model,
        role === "user" ? "input" : "output"
      );
      const costFormatted = formatCost(cost);

      return { tokens, cost, costFormatted };
    }, [content, model, role]);

    if (tokens === 0) return null;

    const tokenInfo = (
      <Badge
        variant="secondary"
        className={cn(
          "text-xs font-mono gap-1 opacity-70 hover:opacity-100 transition-opacity",
          className
        )}
      >
        <Activity className="h-3 w-3" />
        {tokens.toLocaleString()}
      </Badge>
    );

    if (showInline) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{tokenInfo}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1 text-sm">
                <div className="font-medium">Token Usage</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="font-mono">{tokens.toLocaleString()}</span>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">
                    {role === "user" ? "Input" : "Output"}
                  </span>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-mono text-green-600">
                    {costFormatted}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  {role === "assistant" && "Output tokens cost more than input"}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return tokenInfo;
  }
);

TokenDisplay.displayName = "TokenDisplay";
