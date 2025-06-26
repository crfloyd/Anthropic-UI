// src/components/markdown-message.tsx
"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  isDark?: boolean;
  onCodeBlockClick?: (code: string, language: string, title?: string) => void;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  isDark?: boolean;
  onCodeBlockClick?: (code: string, language: string, title?: string) => void;
}

const CodeBlock = memo(
  ({
    inline,
    className,
    children,
    isDark,
    onCodeBlockClick,
    ...props
  }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const codeString = String(children).replace(/\n$/, "");

    // Smart inline detection
    const isActuallyInline =
      inline ||
      (!codeString.includes("\n") && codeString.length < 50) ||
      codeString.length < 20;

    const handleCopy = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(codeString);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = codeString;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Copy failed:", error);
      }
    };

    const handleOpenInCanvas = () => {
      if (onCodeBlockClick && !isActuallyInline) {
        const title = `${language || "Code"} Snippet`;
        onCodeBlockClick(codeString, language || "text", title);
      }
    };

    // Handle inline code
    if (isActuallyInline) {
      return (
        <code
          className="bg-muted text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Handle code blocks with enhanced interactions
    return (
      <div
        className="relative group w-full max-w-full mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            "flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b transition-all duration-200",
            isHovered && "bg-muted/80",
            onCodeBlockClick && "cursor-pointer hover:bg-accent/50"
          )}
          onClick={onCodeBlockClick ? handleOpenInCanvas : undefined}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {language || "code"}
            </span>
            {onCodeBlockClick && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-all duration-200",
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-60 -translate-x-1"
                )}
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open in Canvas</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCodeBlockClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenInCanvas();
                }}
                className={cn(
                  "h-7 w-7 p-0 transition-all duration-200 text-blue-600 hover:text-blue-700 dark:text-blue-400",
                  isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
                title="Open in Canvas"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className={cn(
                "h-7 w-7 p-0 transition-all duration-200",
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
              title="Copy code"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "w-full overflow-x-auto transition-all duration-200 border border-t-0 rounded-b-lg",
            isHovered &&
              onCodeBlockClick &&
              "shadow-md border-blue-200 dark:border-blue-800"
          )}
          style={{ maxWidth: "100%" }}
        >
          <SyntaxHighlighter
            style={isDark ? oneDark : oneLight}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none !rounded-b-lg !m-0 !border-0"
            customStyle={{
              margin: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              width: "100%",
              maxWidth: "100%",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              border: "none",
            }}
            codeTagProps={{
              style: {
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                overflowWrap: "anywhere",
              },
            }}
            wrapLongLines={true}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

export const MarkdownMessage = memo(
  ({ content, isDark, onCodeBlockClick }: MarkdownMessageProps) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:p-0 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => (
              <CodeBlock
                inline={inline}
                className={className}
                isDark={isDark}
                onCodeBlockClick={onCodeBlockClick}
                {...props}
              >
                {children}
              </CodeBlock>
            ),
            pre: ({ children, ...props }) => {
              return <>{children}</>;
            },
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium mt-4 mb-2 first:mt-0">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <div className="mb-3 last:mb-0 leading-relaxed">{children}</div>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-4">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-4 py-2 text-left font-medium">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-4 py-2">{children}</td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);

MarkdownMessage.displayName = "MarkdownMessage";
