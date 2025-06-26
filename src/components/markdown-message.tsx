// src/components/markdown-message.tsx
"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  isDark?: boolean;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  isDark?: boolean;
}

const CodeBlock = memo(
  ({ inline, className, children, isDark, ...props }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const codeString = String(children).replace(/\n$/, "");

    // Smart inline detection: treat as inline if:
    // 1. Explicitly marked as inline
    // 2. Single line with no newlines and relatively short
    // 3. Very short code (under 50 characters)
    const isActuallyInline =
      inline ||
      (!codeString.includes("\n") && codeString.length < 50) ||
      codeString.length < 20;

    const handleCopy = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(codeString);
        } else {
          // Fallback for environments without clipboard API
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

    // Handle inline code (single backticks OR smart inline detection)
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

    // Handle code blocks (triple backticks)
    return (
      <div className="relative group w-full max-w-full mb-4">
        <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border-b">
          <span className="text-sm font-medium text-muted-foreground">
            {language || "code"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="w-full overflow-x-auto" style={{ maxWidth: "100%" }}>
          <SyntaxHighlighter
            style={isDark ? oneDark : oneLight}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none !rounded-b-lg !m-0"
            customStyle={{
              margin: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              width: "100%",
              maxWidth: "100%",
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
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
  ({ content, isDark }: MarkdownMessageProps) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:p-0 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => (
              <CodeBlock
                inline={inline}
                className={className}
                isDark={isDark}
                {...props}
              >
                {children}
              </CodeBlock>
            ),
            pre: ({ children, ...props }) => {
              // Don't wrap code blocks in pre tags since CodeBlock handles the container
              return <>{children}</>;
            },
            // Custom styling for other elements
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
