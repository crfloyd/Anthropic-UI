// src/app/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { ContextManager } from "@/components/context-manager";
import { SettingsPanel } from "@/components/settings-panel";
import { ExportDialog } from "@/components/export-dialog";
import { ArtifactCanvas } from "@/components/artifact-canvas";
import { ResizableLayout } from "@/components/resizable-layout";
import { ChatHeader } from "@/components/chat-header";
import { MessageList, LoadingIndicator } from "@/components/message-list";
import { ChatInput } from "@/components/chat-input";
import { useConversation } from "@/hooks/use-conversation";
import { useCanvasManager } from "@/hooks/use-canvas-manager";
import { useModalState } from "@/hooks/use-modal-state";
import { useTheme } from "@/hooks/use-theme";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useContextManagement } from "@/hooks/use-context-management";
import { useMessageActions } from "@/hooks/use-message-actions";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { isDark, toggleTheme } = useTheme();

  const {
    messages,
    currentConversationId,
    isLoading,
    exportConversation,
    submitMessage,
    regenerateFromMessage,
    loadConversation,
    newConversation,
    updateMessages,
  } = useConversation();

  const {
    isCanvasOpen,
    currentArtifact,
    openCanvas,
    closeCanvas,
    updateArtifactContent,
  } = useCanvasManager();

  const {
    isSidebarOpen,
    isContextManagerOpen,
    isSettingsOpen,
    isExportOpen,
    toggleSidebar,
    closeSidebar,
    toggleContextManager,
    openContextManager,
    closeContextManager,
    toggleSettings,
    closeSettings,
    toggleExport,
    closeExport,
  } = useModalState();

  const { uploadedFiles, clearFiles, handlePaste, setUploadedFiles } =
    useFileUpload();

  const { handleTrimConversation, contextStatus } = useContextManagement({
    messages,
    updateMessages,
    isContextManagerOpen,
    openContextManager,
  });

  const messageActions = useMessageActions({
    messages,
    setMessages: updateMessages,
    onRegenerateFromIndex: (index) => {
      const userMessage = messages[index];
      if (userMessage && userMessage.role === "user") {
        regenerateFromMessage(userMessage, index);
      }
    },
    onCreateBranch: (fromIndex, branchMessages) => {
      newConversation();
      updateMessages(() => branchMessages);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messagesContainerRef.current && isCanvasOpen) {
      const container = messagesContainerRef.current;
      const restoreScroll = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const savedPosition = parseFloat(
              sessionStorage.getItem("chat-scroll-position") || "0"
            );
            if (container && savedPosition > 0) {
              container.scrollTop = savedPosition;
            }
          });
        });
      };
      const timeoutId = setTimeout(restoreScroll, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [isCanvasOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

      await submitMessage(input, uploadedFiles);
      setInput("");
      clearFiles();
    },
    [input, uploadedFiles, isLoading, submitMessage, clearFiles]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleLoadConversation = useCallback(
    async (conversationId: string) => {
      await loadConversation(conversationId);
      closeSidebar();
    },
    [loadConversation, closeSidebar]
  );

  const handleNewConversation = useCallback(() => {
    newConversation();
    clearFiles();
    closeSidebar();
    closeContextManager();
  }, [newConversation, clearFiles, closeSidebar, closeContextManager]);

  const handleCodeBlockClick = useCallback(
    (code: string, language: string, title?: string) => {
      openCanvas(code, language, title, messagesContainerRef);
    },
    [openCanvas]
  );

  const handleCanvasClose = useCallback(() => {
    closeCanvas(messagesContainerRef);
  }, [closeCanvas]);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground overflow-hidden",
        isDark && "dark"
      )}
    >
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleLoadConversation}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      <div
        className={cn(
          "h-screen flex transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-72" : "ml-0"
        )}
      >
        <ResizableLayout
          isRightPanelOpen={isCanvasOpen}
          leftPanel={
            <div className="flex flex-col h-full">
              <ChatHeader
                currentConversationId={currentConversationId}
                messages={messages}
                contextStatus={contextStatus}
                isDark={isDark}
                onToggleSidebar={toggleSidebar}
                onToggleExport={toggleExport}
                onToggleContextManager={toggleContextManager}
                onToggleTheme={toggleTheme}
                onToggleSettings={toggleSettings}
              />

              <div className="flex flex-col flex-1 max-w-4xl mx-auto px-4 py-6 w-full min-h-0">
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 mb-4 relative min-h-0"
                >
                  <MessageList
                    messages={messages}
                    messageActions={messageActions}
                    isDark={isDark}
                    onCodeBlockClick={handleCodeBlockClick}
                  />
                  {isLoading && <LoadingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                <ChatInput
                  input={input}
                  onInputChange={setInput}
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  onSubmit={handleSubmit}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  isLoading={isLoading}
                />
              </div>
            </div>
          }
          rightPanel={
            <ArtifactCanvas
              isOpen={isCanvasOpen}
              onClose={handleCanvasClose}
              artifact={currentArtifact}
              onContentChange={updateArtifactContent}
              isDark={isDark}
            />
          }
        />
      </div>

      {isContextManagerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ContextManager
            messages={messages.map((msg) => ({ ...msg, tokens: undefined }))}
            onTrimConversation={handleTrimConversation}
            onClose={closeContextManager}
          />
        </div>
      )}

      <SettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={closeExport}
        conversation={exportConversation}
      />
    </div>
  );
}
