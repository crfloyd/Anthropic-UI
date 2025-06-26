// src/hooks/use-canvas-manager.ts
import { useState, useRef, useCallback } from "react";

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  content: string;
  filename?: string;
}

export function useCanvasManager() {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<ArtifactData | null>(
    null
  );
  const savedScrollPosition = useRef<number>(0);

  const getFileExtension = useCallback((language: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      jsx: "jsx",
      tsx: "tsx",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
      yaml: "yml",
      xml: "xml",
    };
    return extensions[language.toLowerCase()] || "txt";
  }, []);

  const openCanvas = useCallback(
    (
      code: string,
      language: string,
      title?: string,
      messagesContainerRef?: React.RefObject<HTMLDivElement>
    ) => {
      if (messagesContainerRef?.current) {
        const container = messagesContainerRef.current;
        savedScrollPosition.current = container.scrollTop;

        const scrollRatio =
          container.scrollTop /
          (container.scrollHeight - container.clientHeight || 1);
        sessionStorage.setItem("chat-scroll-ratio", scrollRatio.toString());
      }

      const artifact: ArtifactData = {
        id: Date.now().toString(),
        title: title || `${language} Code`,
        language: language || "text",
        content: code,
        filename: `code.${getFileExtension(language)}`,
      };

      setCurrentArtifact(artifact);
      setIsCanvasOpen(true);

      setTimeout(() => {
        if (messagesContainerRef?.current) {
          const container = messagesContainerRef.current;
          const savedRatio = parseFloat(
            sessionStorage.getItem("chat-scroll-ratio") || "0"
          );

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (savedScrollPosition.current > 0) {
                container.scrollTop = savedScrollPosition.current;

                setTimeout(() => {
                  const newScrollHeight =
                    container.scrollHeight - container.clientHeight;
                  const ratioBasedPosition = newScrollHeight * savedRatio;

                  if (
                    Math.abs(
                      container.scrollTop - savedScrollPosition.current
                    ) > 100
                  ) {
                    container.scrollTop = ratioBasedPosition;
                  }
                }, 50);
              }
            });
          });
        }
      }, 100);
    },
    [getFileExtension]
  );

  const closeCanvas = useCallback(
    (messagesContainerRef?: React.RefObject<HTMLDivElement>) => {
      if (messagesContainerRef?.current) {
        const container = messagesContainerRef.current;
        savedScrollPosition.current = container.scrollTop;

        const scrollRatio =
          container.scrollTop /
          (container.scrollHeight - container.clientHeight || 1);
        sessionStorage.setItem("chat-scroll-ratio", scrollRatio.toString());
      }

      setIsCanvasOpen(false);

      setTimeout(() => {
        if (messagesContainerRef?.current) {
          const container = messagesContainerRef.current;
          const savedRatio = parseFloat(
            sessionStorage.getItem("chat-scroll-ratio") || "0"
          );

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (savedScrollPosition.current > 0) {
                container.scrollTop = savedScrollPosition.current;

                setTimeout(() => {
                  const newScrollHeight =
                    container.scrollHeight - container.clientHeight;
                  const ratioBasedPosition = newScrollHeight * savedRatio;

                  if (
                    Math.abs(
                      container.scrollTop - savedScrollPosition.current
                    ) > 100
                  ) {
                    container.scrollTop = ratioBasedPosition;
                  }
                }, 50);
              }
            });
          });
        }

        setTimeout(() => {
          setCurrentArtifact(null);
        }, 100);
      }, 300);
    },
    []
  );

  const updateArtifactContent = useCallback(
    (content: string) => {
      if (currentArtifact) {
        setCurrentArtifact({
          ...currentArtifact,
          content,
        });
      }
    },
    [currentArtifact]
  );

  return {
    isCanvasOpen,
    currentArtifact,
    openCanvas,
    closeCanvas,
    updateArtifactContent,
  };
}
