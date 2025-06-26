// src/components/resizable-layout.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(60); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    setHasInitialized(true);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage, ensuring we stay within bounds
      const newLeftPercentage = (mouseX / containerWidth) * 100;
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const maxLeftPercent = 100 - (minRightWidth / containerWidth) * 100;

      const clampedPercentage = Math.max(
        minLeftPercent,
        Math.min(maxLeftPercent, newLeftPercentage)
      );

      setLeftPanelWidth(clampedPercentage);
    },
    [isResizing, minLeftWidth, minRightWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Don't render animations until after hydration to prevent initial slide
  if (!hasInitialized) {
    return (
      <div className={cn("h-full w-full relative overflow-hidden", className)}>
        <div className="h-full w-full">{leftPanel}</div>
      </div>
    );
  }

  // Mobile: Show canvas as overlay
  if (isMobile) {
    return (
      <div className={cn("h-full w-full relative", className)}>
        {/* Left panel always visible on mobile */}
        <div className="h-full">{leftPanel}</div>

        {/* Right panel as overlay */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 z-40"
              />

              {/* Canvas panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute inset-0 z-50"
              >
                {rightPanel}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const rightPanelWidth = 100 - leftPanelWidth;

  // Desktop: Animated layout with smooth transitions and working resize
  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full relative overflow-hidden", className)}
    >
      {/* Left panel - always visible, animates width */}
      <motion.div
        className="absolute inset-y-0 left-0 h-full"
        initial={{
          width: isRightPanelOpen ? `${leftPanelWidth}%` : "100%",
        }}
        animate={{
          width: isRightPanelOpen ? `${leftPanelWidth}%` : "100%",
        }}
        transition={{
          duration: isResizing ? 0 : 0.3, // No animation while resizing
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <div className="h-full w-full">{leftPanel}</div>
      </motion.div>

      {/* Resize handle - only show when panel is open */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="absolute inset-y-0 z-30"
            style={{ left: `${leftPanelWidth}%` }}
          >
            <div
              className={cn(
                "w-2 h-full bg-border/50 hover:bg-primary/20 transition-all duration-200 relative group cursor-col-resize",
                isResizing && "bg-primary/30"
              )}
              onMouseDown={handleMouseDown}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border group-hover:bg-primary/40 transition-all duration-200 rounded-full",
                  isResizing && "bg-primary/60"
                )}
              />
              <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right panel - slides in from the right */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute inset-y-0 right-0 h-full shadow-2xl z-20"
            style={{ width: `${rightPanelWidth}%` }}
          >
            {rightPanel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize overlay to prevent text selection while dragging */}
      {isResizing && (
        <div className="absolute inset-0 z-40 cursor-col-resize" />
      )}
    </div>
  );
}
