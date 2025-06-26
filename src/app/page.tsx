// src/app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Send,
  Bot,
  User,
  Settings,
  Moon,
  Sun,
  Menu,
  BarChart3,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/markdown-message";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { TokenDisplay } from "@/components/token-display";
import { ConversationStats } from "@/components/conversation-stats";
import { ContextManager } from "@/components/context-manager";
import { SettingsPanel } from "@/components/settings-panel";
import { ExportDialog } from "@/components/export-dialog";
import { CopyMessageButton } from "@/components/copy-message-button";
import { EditMessageButton } from "@/components/edit-message-button";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { MessageFiles, FileAttachment } from "@/components/message-files";
import { getContextStatus, MessageWithTokens } from "@/lib/tokens";
import { useSettings } from "@/lib/settings";
import { useMessageActions } from "@/hooks/use-message-actions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
}

interface ConversationWithMessages {
  id: string;
  title: string;
  messages: {
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { settings } = useSettings();

  // Message actions hook (simplified)
  const messageActions = useMessageActions({
    messages,
    setMessages,
    onRegenerateFromIndex: (index) => {
      // When editing a user message, regenerate from that point
      const userMessage = messages[index];
      if (userMessage && userMessage.role === "user") {
        handleRegenerateFromMessage(userMessage, index);
      }
    },
    onCreateBranch: (fromIndex, branchMessages) => {
      // Create a new conversation branch
      handleNewConversation();
      setMessages(branchMessages);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to process uploaded files for API
  const processUploadedFiles = async (
    files: UploadedFile[]
  ): Promise<FileAttachment[]> => {
    const attachments: FileAttachment[] = [];

    for (const uploadedFile of files) {
      const { file } = uploadedFile;

      let content: string | undefined;

      if (file.type.startsWith("text/") || file.type === "application/json") {
        // Read text files
        content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      } else if (file.type.startsWith("image/")) {
        // Convert images to base64
        content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      attachments.push({
        id: uploadedFile.id,
        name: file.name,
        size: file.size,
        type: file.type,
        content,
      });
    }

    return attachments;
  };

  // Handle paste events to detect files
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    items.forEach((item) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      e.preventDefault();

      // Add files to uploaded files
      const newUploadedFiles: UploadedFile[] = [];
      for (const file of files) {
        const type = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("text/")
          ? "text"
          : "other";

        let preview: string | undefined;
        if (file.type.startsWith("image/")) {
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        newUploadedFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview,
          type,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    }
  };

  // Load theme preference from localStorage on mount
  useEffect(() => {
    // Avoid hydration mismatch by checking if we're in the browser
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("claude-chat-theme");
      if (savedTheme) {
        const isDarkMode = savedTheme === "dark";
        setIsDark(isDarkMode);
        if (isDarkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // Check system preference if no saved preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setIsDark(prefersDark);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        }
        // Save the initial preference
        localStorage.setItem(
          "claude-chat-theme",
          prefersDark ? "dark" : "light"
        );
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check context status and auto-open context manager if critical
  useEffect(() => {
    if (messages.length > 0) {
      const messagesWithTokens: MessageWithTokens[] = messages.map((msg) => ({
        ...msg,
        tokens: undefined, // Will be calculated by getContextStatus
      }));

      const contextStatus = getContextStatus(messagesWithTokens);

      // Auto-open context manager if emergency status and auto-trim is disabled
      if (
        contextStatus.status === "emergency" &&
        !settings.autoTrim &&
        !isContextManagerOpen
      ) {
        setIsContextManagerOpen(true);
      }

      // Auto-trim if enabled and threshold reached
      if (
        settings.autoTrim &&
        contextStatus.percentage >= settings.autoTrimThreshold
      ) {
        handleAutoTrim(messagesWithTokens, contextStatus);
      }
    }
  }, [
    messages,
    isContextManagerOpen,
    settings.autoTrim,
    settings.autoTrimThreshold,
  ]);

  const handleAutoTrim = (
    messagesWithTokens: MessageWithTokens[],
    contextStatus: any
  ) => {
    // Auto-trim to 50% of context limit
    const targetTokens = Math.floor(contextStatus.limit * 0.5);

    // Simple recent-message trimming
    let currentTokens = 0;
    const trimmedMessages: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = msg.content.length / 4; // Rough estimate

      if (currentTokens + msgTokens <= targetTokens) {
        trimmedMessages.unshift(msg);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }

    if (trimmedMessages.length < messages.length) {
      setMessages(trimmedMessages);
    }
  };

  const generateConversationTitle = (firstMessage: string): string => {
    // Generate a title from the first message (first 50 characters)
    return firstMessage.length > 50
      ? firstMessage.substring(0, 50) + "..."
      : firstMessage;
  };

  const createNewConversation = async (
    firstMessage?: string
  ): Promise<string> => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: firstMessage
            ? generateConversationTitle(firstMessage)
            : "New Conversation",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await response.json();
      return conversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const conversation: ConversationWithMessages = await response.json();

      const loadedMessages: Message[] = conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        // Note: You might want to load file attachments from database here
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      setIsSidebarOpen(false); // Close sidebar on mobile
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setUploadedFiles([]);
    setIsSidebarOpen(false); // Close sidebar on mobile
    setIsContextManagerOpen(false); // Close context manager
  };

  const handleTrimConversation = (trimmedMessages: MessageWithTokens[]) => {
    // Convert MessageWithTokens back to Message
    const convertedMessages: Message[] = trimmedMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      files: (msg as Message).files, // Preserve files if they exist
    }));

    setMessages(convertedMessages);
    setIsContextManagerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Process uploaded files
    const fileAttachments = await processUploadedFiles(uploadedFiles);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      files: fileAttachments.length > 0 ? fileAttachments : undefined,
    };

    // Clear input and files
    setUploadedFiles([]);

    await sendMessage(userMessage);
  };

  const handleRegenerateFromMessage = async (
    userMessage: Message,
    index: number
  ) => {
    // Use existing messages up to this point as context
    const contextMessages = messages.slice(0, index + 1);
    await sendMessage(userMessage, contextMessages);
  };

  const sendMessage = async (
    userMessage: Message,
    contextMessages?: Message[]
  ) => {
    // Update messages immediately for UI responsiveness
    const currentMessages = contextMessages || [...messages, userMessage];
    if (!contextMessages) {
      setMessages((prev) => [...prev, userMessage]);
    }

    setInput("");
    setIsLoading(true);

    let conversationId = currentConversationId;

    try {
      // Create new conversation if we don't have one
      if (!conversationId) {
        conversationId = await createNewConversation(userMessage.content);
        setCurrentConversationId(conversationId);
      }

      // Create assistant message placeholder for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: currentMessages,
          conversationId: conversationId,
          settings: {
            apiKey: settings.apiKey,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId || false
            ? {
                ...msg,
                content: `Error: ${
                  error instanceof Error
                    ? error.message
                    : "Failed to send message"
                }`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);

    // Update DOM classes
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save preference to localStorage (with safety check)
    if (typeof window !== "undefined") {
      localStorage.setItem("claude-chat-theme", newDarkMode ? "dark" : "light");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleContextManager = () => {
    setIsContextManagerOpen(!isContextManagerOpen);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleExport = () => {
    setIsExportOpen(!isExportOpen);
  };

  // Prepare conversation data for export
  const exportConversation =
    currentConversationId && messages.length > 0
      ? {
          id: currentConversationId,
          title:
            messages.length > 0
              ? messages[0].content.length > 50
                ? messages[0].content.substring(0, 50) + "..."
                : messages[0].content
              : "New Conversation",
          messages: messages,
          createdAt: messages.length > 0 ? messages[0].timestamp : new Date(),
          updatedAt:
            messages.length > 0
              ? messages[messages.length - 1].timestamp
              : new Date(),
        }
      : null;

  // Get current context status for UI indicators
  const messagesWithTokens: MessageWithTokens[] = messages.map((msg) => ({
    ...msg,
    tokens: undefined,
  }));
  const contextStatus = getContextStatus(messagesWithTokens);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground overflow-x-hidden",
        isDark && "dark"
      )}
    >
      {/* Conversation Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={loadConversation}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-x-hidden",
          isSidebarOpen ? "md:ml-72" : "ml-0"
        )}
      >
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden md:flex"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Claude API Chat</h1>
              {currentConversationId && (
                <span className="text-sm text-muted-foreground">
                  • Conversation saved
                </span>
              )}
              {messages.length > 0 && (
                <ConversationStats
                  messages={messages}
                  className="hidden sm:flex"
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Export button - show when we have messages */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExport}
                  className="rounded-full"
                  title="Export Conversation"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleContextManager}
                className={cn(
                  "rounded-full",
                  contextStatus.status === "emergency" &&
                    "text-red-600 animate-pulse",
                  contextStatus.status === "critical" && "text-orange-600",
                  contextStatus.status === "warning" && "text-yellow-600"
                )}
                title="Context Management"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={toggleSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="container mx-auto max-w-4xl px-4 py-6 flex flex-col h-[calc(100vh-80px)]">
          {/* Context Manager Modal */}
          {isContextManagerOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <ContextManager
                messages={messagesWithTokens}
                onTrimConversation={handleTrimConversation}
                onClose={() => setIsContextManagerOpen(false)}
              />
            </div>
          )}

          {/* Settings Panel */}
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          {/* Export Dialog */}
          <ExportDialog
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            conversation={exportConversation}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 relative">
            {/* Copy feedback */}
            {messageActions.copyFeedback && (
              <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-3 py-2 rounded-md shadow-lg text-sm">
                {messageActions.copyFeedback}
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to Claude API Chat
                </h2>
                <p className="text-muted-foreground mb-4">
                  Start a conversation with Claude by typing a message below.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your conversations will be automatically saved and can be
                  accessed from the sidebar.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
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
                    {/* Avatar */}
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

                    {/* Message Content */}
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
                              />
                            ) : (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <p className="whitespace-pre-wrap m-0">
                                  {message.content}
                                </p>
                              </div>
                            )}

                            {/* Display file attachments */}
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
                              <span>
                                {message.timestamp.toLocaleTimeString()}
                              </span>
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

                      {/* Action Buttons - positioned below the message */}
                      {!messageActions.isEditing(index) && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end">
                          {/* Copy button for all messages */}
                          <CopyMessageButton
                            content={message.content}
                            onCopy={messageActions.handleCopy}
                          />

                          {/* Edit button for user messages only */}
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
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <Card className="p-4 bg-card">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="max-w-4xl mx-auto w-full">
            <Card className="p-4">
              {/* File Upload Component */}
              <FileUpload
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                disabled={isLoading}
                className="mb-2"
              />

              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className="min-h-[60px] max-h-[200px] resize-none"
                    rows={1}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    (!input.trim() && uploadedFiles.length === 0) || isLoading
                  }
                  size="icon"
                  className="self-end h-[60px] w-[60px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
