// app/page.tsx - REPLACE YOUR ENTIRE EXISTING FILE WITH THIS
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { ApiKeySetup } from "@/components/api-key-setup";
import { useConversation } from "@/hooks/use-conversation";
import { useCanvasManager } from "@/hooks/use-canvas-manager";
import { useModalState } from "@/hooks/use-modal-state";
import { useTheme } from "@/hooks/use-theme";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useContextManagement } from "@/hooks/use-context-management";
import { useMessageActions } from "@/hooks/use-message-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Key, AlertCircle, Loader2 } from "lucide-react";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
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

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/landing");
    }
  }, [status, router]);

  // Load user's API key on login
  useEffect(() => {
    const loadApiKey = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user/api-key");
          if (response.ok) {
            const data = await response.json();
            if (data.hasApiKey) {
              setUserApiKey(data.apiKey);
            } else {
              setShowApiKeySetup(true);
            }
          }
        } catch (error) {
          console.error("Error loading API key:", error);
          setShowApiKeySetup(true);
        } finally {
          setIsLoadingApiKey(false);
        }
      }
    };

    if (status === "authenticated") {
      loadApiKey();
    }
  }, [session, status]);

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
      if (
        (!input.trim() && uploadedFiles.length === 0) ||
        isLoading ||
        !userApiKey
      )
        return;

      await submitMessage(input, uploadedFiles, userApiKey);
      setInput("");
      clearFiles();
    },
    [input, uploadedFiles, isLoading, userApiKey, submitMessage, clearFiles]
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

  const handleApiKeySetupComplete = (apiKey: string) => {
    setUserApiKey(apiKey);
    setShowApiKeySetup(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/landing" });
  };

  // Loading state
  if (status === "loading" || isLoadingApiKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const hasApiKey = !!userApiKey;

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
                user={session?.user}
                onToggleSidebar={toggleSidebar}
                onToggleExport={toggleExport}
                onToggleContextManager={toggleContextManager}
                onToggleTheme={toggleTheme}
                onToggleSettings={toggleSettings}
                onSignOut={handleSignOut}
              />

              <div className="flex flex-col flex-1 max-w-4xl mx-auto px-4 py-6 w-full min-h-0">
                {/* API Key Warning Banner */}
                {!hasApiKey && (
                  <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-orange-800 dark:text-orange-200">
                        API key required to start chatting
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setShowApiKeySetup(true)}
                        className="ml-4"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Setup API Key
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

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
                  disabled={!hasApiKey}
                  placeholder={
                    hasApiKey
                      ? "Type your message here..."
                      : "Enter your Claude API key to start chatting..."
                  }
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

      {/* API Key Setup Overlay */}
      <ApiKeySetup
        isOpen={showApiKeySetup}
        onComplete={handleApiKeySetupComplete}
        onOpenSettings={() => {
          setShowApiKeySetup(false);
          toggleSettings();
        }}
      />

      {isContextManagerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ContextManager
            messages={messages.map((msg) => ({ ...msg, tokens: undefined }))}
            onTrimConversation={handleTrimConversation}
            onClose={closeContextManager}
          />
        </div>
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        userApiKey={userApiKey}
        onApiKeyChange={setUserApiKey}
      />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={closeExport}
        conversation={exportConversation}
      />
    </div>
  );
}
