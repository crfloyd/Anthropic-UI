// src/hooks/use-modal-state.ts
import { useState, useCallback } from "react";

export function useModalState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleContextManager = useCallback(() => {
    setIsContextManagerOpen((prev) => !prev);
  }, []);

  const openContextManager = useCallback(() => {
    setIsContextManagerOpen(true);
  }, []);

  const closeContextManager = useCallback(() => {
    setIsContextManagerOpen(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const toggleExport = useCallback(() => {
    setIsExportOpen((prev) => !prev);
  }, []);

  const closeExport = useCallback(() => {
    setIsExportOpen(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsSidebarOpen(false);
    setIsContextManagerOpen(false);
    setIsSettingsOpen(false);
    setIsExportOpen(false);
  }, []);

  return {
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
    closeAllModals,
  };
}
