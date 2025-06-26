// src/components/copy-message-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyMessageButtonProps {
  content: string;
  onCopy?: (content: string) => void;
  className?: string;
}

export function CopyMessageButton({
  content,
  onCopy,
  className,
}: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn(
        "h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80",
        "transition-all duration-200",
        className
      )}
      title="Copy message"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
