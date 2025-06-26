// src/hooks/use-context-management.ts
import { useEffect, useCallback } from "react";
import { getContextStatus, MessageWithTokens } from "@/lib/tokens";
import { useSettings } from "@/lib/settings";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseContextManagementProps {
  messages: Message[];
  updateMessages: (updater: (prev: Message[]) => Message[]) => void;
  isContextManagerOpen: boolean;
  openContextManager: () => void;
}

export function useContextManagement({
  messages,
  updateMessages,
  isContextManagerOpen,
  openContextManager,
}: UseContextManagementProps) {
  const { settings } = useSettings();

  const handleAutoTrim = useCallback(
    (messagesWithTokens: MessageWithTokens[], contextStatus: any) => {
      const targetTokens = Math.floor(contextStatus.limit * 0.5);
      let currentTokens = 0;
      const trimmedMessages: Message[] = [];

      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const msgTokens = msg.content.length / 4;

        if (currentTokens + msgTokens <= targetTokens) {
          trimmedMessages.unshift(msg);
          currentTokens += msgTokens;
        } else {
          break;
        }
      }

      if (trimmedMessages.length < messages.length) {
        updateMessages(() => trimmedMessages);
      }
    },
    [messages, updateMessages]
  );

  const handleTrimConversation = useCallback(
    (trimmedMessages: MessageWithTokens[]) => {
      const convertedMessages: Message[] = trimmedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        files: (msg as any).files,
      }));

      updateMessages(() => convertedMessages);
    },
    [updateMessages]
  );

  useEffect(() => {
    if (messages.length > 0) {
      const messagesWithTokens: MessageWithTokens[] = messages.map((msg) => ({
        ...msg,
        tokens: undefined,
      }));

      const contextStatus = getContextStatus(messagesWithTokens);

      if (
        contextStatus.status === "emergency" &&
        !settings.autoTrim &&
        !isContextManagerOpen
      ) {
        openContextManager();
      }

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
    openContextManager,
    handleAutoTrim,
  ]);

  const getCurrentContextStatus = useCallback(() => {
    const messagesWithTokens: MessageWithTokens[] = messages.map((msg) => ({
      ...msg,
      tokens: undefined,
    }));
    return getContextStatus(messagesWithTokens);
  }, [messages]);

  return {
    handleTrimConversation,
    contextStatus: getCurrentContextStatus(),
  };
}
