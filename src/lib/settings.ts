// src/lib/settings.ts
"use client";

interface Settings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  autoTrim: boolean;
  autoTrimThreshold: number;
  // Code block display settings
  codeBlockMinLines: number;
  codeBlockAlwaysInlineMaxLines: number;
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  maxTokens: 4096,
  autoTrim: false,
  autoTrimThreshold: 0.8, // 80%
  // Code block display defaults (matching current hardcoded values)
  codeBlockMinLines: 20,
  codeBlockAlwaysInlineMaxLines: 5,
};

const SETTINGS_STORAGE_KEY = "claude-api-settings";

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: Settings;
  private listeners: Array<(settings: Settings) => void> = [];

  private constructor() {
    this.settings = this.loadFromStorage();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadFromStorage(): Settings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to load settings from storage:", error);
    }

    return DEFAULT_SETTINGS;
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn("Failed to save settings to storage:", error);
    }
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<Settings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getSettings()));
  }

  // Validation helpers
  validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith("sk-ant-") && apiKey.length > 20;
  }

  validateCodeBlockSettings(newSettings: Partial<Settings>): string[] {
    const errors: string[] = [];

    // Merge with current settings to get complete picture
    const merged = { ...this.settings, ...newSettings };

    if (merged.codeBlockMinLines < 1) {
      errors.push("Minimum lines must be at least 1");
    }

    if (merged.codeBlockAlwaysInlineMaxLines < 0) {
      errors.push("Always inline max lines cannot be negative");
    }

    if (merged.codeBlockAlwaysInlineMaxLines >= merged.codeBlockMinLines) {
      errors.push(
        "Always inline max lines should be less than minimum lines for canvas"
      );
    }

    return errors;
  }

  getAvailableModels(): Array<{
    value: string;
    label: string;
    description: string;
  }> {
    return [
      {
        value: "claude-3-5-sonnet-20241022",
        label: "Claude 3.5 Sonnet",
        description: "Best balance of intelligence and speed",
      },
      {
        value: "claude-3-opus-20240229",
        label: "Claude 3 Opus",
        description: "Most capable model, higher cost",
      },
      {
        value: "claude-3-haiku-20240307",
        label: "Claude 3 Haiku",
        description: "Fastest and most affordable",
      },
    ];
  }

  // Export/Import settings
  exportSettings(): string {
    const exportData = { ...this.settings };
    // Don't export API key for security
    delete (exportData as any).apiKey;
    return JSON.stringify(exportData, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      // Don't import API key for security
      delete imported.apiKey;

      // Validate code block settings if present
      const validationErrors = this.validateCodeBlockSettings(imported);
      if (validationErrors.length > 0) {
        console.error(
          "Validation errors in imported settings:",
          validationErrors
        );
        return false;
      }

      this.updateSettings(imported);
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  }

  resetToDefaults(): void {
    // Keep API key when resetting
    const currentApiKey = this.settings.apiKey;
    this.settings = { ...DEFAULT_SETTINGS, apiKey: currentApiKey };
    this.saveToStorage();
    this.notifyListeners();
  }
}

// React hook for using settings
import { useState, useEffect } from "react";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    SettingsManager.getInstance().getSettings()
  );

  useEffect(() => {
    const manager = SettingsManager.getInstance();
    const unsubscribe = manager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    const manager = SettingsManager.getInstance();
    manager.updateSettings(updates);
  };

  return {
    settings,
    updateSettings,
    manager: SettingsManager.getInstance(),
  };
}
