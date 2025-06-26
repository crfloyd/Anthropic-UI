// src/components/resizable-layout.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  isRightPanelOpen: boolean;
  minLeftWidth?: number;
  minRightWidth?: number;
  defaultRightWidth?: number;
  className?: string;
}

export function ResizableLayout({
  leftPanel,
  rightPanel,
  isRightPanelOpen,
  minLeftWidth = 300,
  minRightWidth = 400,
  defaultRightWidth = 600,
  className,
}: ResizableLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showPanels, setShowPanels] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle panel visibility with animation timing
  useEffect(() => {
    if (isRightPanelOpen) {
      setShowPanels(true);
    } else {
      // Delay hiding panels to allow slide-out animation
      const timer = setTimeout(() => setShowPanels(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isRightPanelOpen]);

  // Convert pixel values to percentages for react-resizable-panels
  const getDefaultSizes = () => {
    if (typeof window === "undefined") return [70, 30];

    const totalWidth = window.innerWidth - (isMobile ? 0 : 288); // Account for sidebar
    const rightPercentage = Math.round((defaultRightWidth / totalWidth) * 100);
    const leftPercentage = 100 - rightPercentage;

    return [Math.max(leftPercentage, 30), Math.min(rightPercentage, 70)];
  };

  const [defaultSizes] = useState(getDefaultSizes);

  // If panels should not be shown at all, just render the left panel
  if (!showPanels) {
    return (
      <div className={cn("h-full w-full flex", className)}>
        <div className="flex-1 h-full overflow-hidden">{leftPanel}</div>
      </div>
    );
  }

  // Mobile: Show canvas full screen with smooth animations
  if (isMobile) {
    return (
      <div className={cn("h-full w-full relative", className)}>
        <AnimatePresence>
          {isRightPanelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing
                }}
                className="absolute inset-0 z-50"
              >
                {rightPanel}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Keep left panel always visible on mobile */}
        <div
          className={cn("h-full", isRightPanelOpen && "pointer-events-none")}
        >
          {leftPanel}
        </div>
      </div>
    );
  }

  // Desktop: Resizable panels with animations
  return (
    <div className={cn("h-full w-full", className)}>
      <AnimatePresence mode="wait">
        {isRightPanelOpen ? (
          <motion.div
            key="split-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <PanelGroup
              direction="horizontal"
              className="h-full"
              autoSaveId="chat-canvas-layout"
            >
              {/* Left Panel (Chat) */}
              <Panel
                defaultSize={defaultSizes[0]}
                minSize={20}
                maxSize={80}
                className="flex"
              >
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 h-full overflow-hidden"
                >
                  {leftPanel}
                </motion.div>
              </Panel>

              {/* Resize Handle with enhanced visuals */}
              <PanelResizeHandle className="w-2 bg-border/50 hover:bg-primary/20 transition-all duration-200 relative group data-[panel-group-direction=horizontal]:cursor-col-resize">
                <motion.div
                  initial={{ scaleY: 0.8, opacity: 0.5 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border group-hover:bg-primary/40 transition-all duration-200 rounded-full"
                />
                <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </PanelResizeHandle>

              {/* Right Panel (Canvas) with slide animation */}
              <Panel
                defaultSize={defaultSizes[1]}
                minSize={20}
                maxSize={80}
                className="relative overflow-hidden"
              >
                <motion.div
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{
                    type: "tween",
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing
                  }}
                  className="h-full"
                >
                  {rightPanel}
                </motion.div>
              </Panel>
            </PanelGroup>
          </motion.div>
        ) : (
          <motion.div
            key="full-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="h-full"
          >
            {leftPanel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
