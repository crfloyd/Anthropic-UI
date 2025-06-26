// src/hooks/use-theme.ts
import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setIsDark(prefersDark);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        }
        localStorage.setItem(
          "claude-chat-theme",
          prefersDark ? "dark" : "light"
        );
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("claude-chat-theme", newDarkMode ? "dark" : "light");
    }
  }, [isDark]);

  return {
    isDark,
    toggleTheme,
  };
}
