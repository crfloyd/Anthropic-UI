// src/components/message-list.tsx
"use client";

import { memo } from "react";
import { Bot, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/markdown-message";
import { TokenDisplay } from "@/components/token-display";
import { CopyMessageButton } from "@/components/copy-message-button";
import { EditMessageButton } from "@/components/edit-message-button";
import { MessageFiles } from "@/components/message-files";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: any[];
}

interface MessageActions {
  isEditing: (index: number) => boolean;
  startEdit: (index: number) => void;
  cancelEdit: () => void;
  handleEdit: (index: number, content: string) => void;
  handleCopy: (content: string) => void;
  copyFeedback: string | null;
}

interface MessageListProps {
  messages: Message[];
  messageActions: MessageActions;
  isDark: boolean;
  onCodeBlockClick: (code: string, language: string, title?: string) => void;
}

const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20">
    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
    <h2 className="text-xl font-semibold mb-2">Welcome to Claude API Chat</h2>
    <p className="text-muted-foreground mb-4">
      Start a conversation with Claude by typing a message below.
    </p>
    <p className="text-sm text-muted-foreground">
      Your conversations will be automatically saved and can be accessed from
      the sidebar.
    </p>
  </div>
));

const MessageItem = memo(
  ({
    message,
    index,
    messageActions,
    isDark,
    onCodeBlockClick,
  }: {
    message: Message;
    index: number;
    messageActions: MessageActions;
    isDark: boolean;
    onCodeBlockClick: (code: string, language: string, title?: string) => void;
  }) => (
    <div
      className={cn(
        "flex w-full group relative",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] space-x-3 relative",
          message.role === "user"
            ? "flex-row-reverse space-x-reverse"
            : "flex-row"
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {message.role === "user" ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        <div className="relative w-full">
          <Card
            className={cn(
              "p-4",
              message.role === "user"
                ? "bg-muted/50 dark:bg-muted/30"
                : "bg-transparent border-none shadow-none"
            )}
          >
            {messageActions.isEditing(index) ? (
              <EditMessageButton
                message={message}
                messageIndex={index}
                onEdit={messageActions.handleEdit}
                isEditing={true}
                onStartEdit={() => messageActions.startEdit(index)}
                onCancelEdit={messageActions.cancelEdit}
              />
            ) : (
              <>
                {message.role === "assistant" ? (
                  <MarkdownMessage
                    content={message.content}
                    isDark={isDark}
                    onCodeBlockClick={onCodeBlockClick}
                  />
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap m-0">{message.content}</p>
                  </div>
                )}

                {message.files && message.files.length > 0 && (
                  <MessageFiles
                    files={message.files}
                    messageRole={message.role}
                  />
                )}

                <div
                  className={cn(
                    "text-xs mt-2 opacity-70 flex items-center justify-between",
                    "text-muted-foreground"
                  )}
                >
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  <TokenDisplay
                    content={message.content}
                    role={message.role}
                    showInline
                    className="ml-2"
                  />
                </div>
              </>
            )}
          </Card>

          {!messageActions.isEditing(index) && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end">
              <CopyMessageButton
                content={message.content}
                onCopy={messageActions.handleCopy}
              />

              <EditMessageButton
                message={message}
                messageIndex={index}
                onEdit={messageActions.handleEdit}
                isEditing={false}
                onStartEdit={() => messageActions.startEdit(index)}
                onCancelEdit={messageActions.cancelEdit}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
);

const LoadingIndicator = memo(() => (
  <div className="flex justify-start">
    <div className="flex max-w-[85%] space-x-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <Card className="p-4 bg-transparent border-none shadow-none">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
        </div>
      </Card>
    </div>
  </div>
));

export const MessageList = memo(
  ({
    messages,
    messageActions,
    isDark,
    onCodeBlockClick,
  }: MessageListProps) => {
    if (messages.length === 0) {
      return <EmptyState />;
    }

    return (
      <>
        {messageActions.copyFeedback && (
          <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-3 py-2 rounded-md shadow-lg text-sm">
            {messageActions.copyFeedback}
          </div>
        )}

        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            index={index}
            messageActions={messageActions}
            isDark={isDark}
            onCodeBlockClick={onCodeBlockClick}
          />
        ))}
      </>
    );
  }
);

MessageList.displayName = "MessageList";

export { LoadingIndicator };
