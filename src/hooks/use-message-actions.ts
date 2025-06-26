// src/hooks/use-message-actions.ts
import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseMessageActionsProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  onRegenerateFromIndex?: (index: number) => void;
  onCreateBranch?: (fromIndex: number, messages: Message[]) => void;
}

export function useMessageActions({
  messages,
  setMessages,
  onRegenerateFromIndex,
  onCreateBranch,
}: UseMessageActionsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleEdit = (messageIndex: number, newContent: string) => {
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
    };

    // If editing a user message, we might want to regenerate subsequent responses
    if (messages[messageIndex].role === "user") {
      // Truncate conversation at this point and regenerate
      const truncatedMessages = updatedMessages.slice(0, messageIndex + 1);
      setMessages(truncatedMessages);

      // Trigger regeneration from this point
      if (onRegenerateFromIndex) {
        setTimeout(() => {
          onRegenerateFromIndex(messageIndex);
        }, 100);
      }
    } else {
      // For assistant messages, just update the content
      setMessages(updatedMessages);
    }

    setEditingIndex(null);
  };

  const handleRegenerate = (messageIndex: number) => {
    // Remove the current assistant message and all messages after it
    const truncatedMessages = messages.slice(0, messageIndex);
    setMessages(truncatedMessages);

    // Trigger regeneration
    if (onRegenerateFromIndex) {
      onRegenerateFromIndex(messageIndex - 1); // Regenerate from the user message before
    }
  };

  const handleBranch = (messageIndex: number) => {
    // Create a new conversation branch from this point
    const branchMessages = messages.slice(0, messageIndex + 1);

    if (onCreateBranch) {
      onCreateBranch(messageIndex, branchMessages);
    } else {
      // Default behavior: just truncate and continue
      setMessages(branchMessages);
    }
  };

  const handleDelete = (messageIndex: number) => {
    // Delete this message and all messages after it
    const truncatedMessages = messages.slice(0, messageIndex);
    setMessages(truncatedMessages);
  };

  const handleCopy = (content: string) => {
    setCopyFeedback("Copied to clipboard!");
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const startEdit = (messageIndex: number) => {
    setEditingIndex(messageIndex);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return {
    editingIndex,
    copyFeedback,
    handleEdit,
    handleRegenerate,
    handleBranch,
    handleDelete,
    handleCopy,
    startEdit,
    cancelEdit,
    isEditing: (index: number) => editingIndex === index,
  };
}
