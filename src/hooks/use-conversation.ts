// src/hooks/use-conversation.ts
import { useState, useCallback } from "react";
import { useSettings } from "@/lib/settings";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "text" | "code" | "archive" | "other";
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

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  // Helper function to process uploaded files for API
  const processUploadedFiles = useCallback(
    async (files: UploadedFile[]): Promise<FileAttachment[]> => {
      const attachments: FileAttachment[] = [];

      for (const uploadedFile of files) {
        const { file } = uploadedFile;
        let content: string | undefined;

        if (file.type.startsWith("text/") || file.type === "application/json") {
          content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });
        } else if (file.type.startsWith("image/")) {
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
    },
    []
  );

  const generateConversationTitle = useCallback(
    (firstMessage: string): string => {
      return firstMessage.length > 50
        ? firstMessage.substring(0, 50) + "..."
        : firstMessage;
    },
    []
  );

  const createNewConversation = useCallback(
    async (firstMessage?: string): Promise<string> => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    },
    [generateConversationTitle]
  );

  const loadConversation = useCallback(async (conversationId: string) => {
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
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      return loadedMessages;
    } catch (error) {
      console.error("Error loading conversation:", error);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(
    async (
      userMessage: Message,
      contextMessages?: Message[],
      apiKey?: string
    ) => {
      const currentMessages = contextMessages || [...messages, userMessage];
      if (!contextMessages) {
        setMessages((prev) => [...prev, userMessage]);
      }

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentMessages,
            conversationId: conversationId,
            settings: {
              apiKey: apiKey || settings.apiKey,
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
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
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
    },
    [messages, currentConversationId, createNewConversation, settings]
  );

  const submitMessage = useCallback(
    async (input: string, uploadedFiles: UploadedFile[], apiKey: string) => {
      if ((!input.trim() && uploadedFiles.length === 0) || isLoading || !apiKey)
        return;

      const fileAttachments = await processUploadedFiles(uploadedFiles);
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
        files: fileAttachments.length > 0 ? fileAttachments : undefined,
      };

      await sendMessage(userMessage, undefined, apiKey);
    },
    [isLoading, processUploadedFiles, sendMessage]
  );

  const regenerateFromMessage = useCallback(
    async (userMessage: Message, index: number, apiKey?: string) => {
      const contextMessages = messages.slice(0, index + 1);
      await sendMessage(userMessage, contextMessages, apiKey);
    },
    [messages, sendMessage]
  );

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const updateMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages(updater);
    },
    []
  );

  // Export conversation data for other components
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

  return {
    // State
    messages,
    currentConversationId,
    isLoading,
    exportConversation,

    // Actions
    submitMessage,
    sendMessage,
    regenerateFromMessage,
    loadConversation,
    newConversation,
    updateMessages,
    processUploadedFiles,
  };
}
