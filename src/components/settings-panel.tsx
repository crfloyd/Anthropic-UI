// src/components/settings-panel.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Key,
  Brain,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, manager } = useSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.apiKey);
  const [importData, setImportData] = useState("");
  const [activeTab, setActiveTab] = useState("api");

  if (!isOpen) return null;

  const handleApiKeyChange = (value: string) => {
    setTempApiKey(value);
    updateSettings({ apiKey: value });
  };

  const handleExportSettings = () => {
    const exported = manager.exportSettings();
    const blob = new Blob([exported], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "claude-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    if (manager.importSettings(importData)) {
      setImportData("");
      alert("Settings imported successfully!");
    } else {
      alert("Failed to import settings. Please check the format.");
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return (
      key.slice(0, 8) + "•".repeat(Math.max(0, key.length - 16)) + key.slice(-8)
    );
  };

  const isApiKeyValid = manager.validateApiKey(settings.apiKey);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Settings</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* API Configuration */}
            <TabsContent value="api" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label
                      htmlFor="api-key"
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      API Key
                    </Label>
                    <div className="flex items-center gap-2">
                      {isApiKeyValid ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Invalid
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={showApiKey ? tempApiKey : maskApiKey(tempApiKey)}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="sk-ant-..."
                      className={cn(
                        "pr-10",
                        !isApiKeyValid && tempApiKey && "border-red-500"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://console.anthropic.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      console.anthropic.com
                    </a>
                  </p>
                </div>

                {!isApiKeyValid && tempApiKey && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      API key should start with &quot;sk-ant-&quot; and be at
                      least 20 characters long.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* Model Configuration */}
            <TabsContent value="model" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" />
                    Model Selection
                  </Label>
                  <Select
                    value={settings.model}
                    onValueChange={(value) => updateSettings({ model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {manager.getAvailableModels().map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">
                    Temperature: {settings.temperature}
                  </Label>
                  <Slider
                    value={[settings.temperature]}
                    onValueChange={([value]) =>
                      updateSettings({ temperature: value })
                    }
                    max={1}
                    min={0}
                    step={0.1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>More focused</span>
                    <span>More creative</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max-tokens" className="mb-2 block">
                    Max Response Tokens
                  </Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) =>
                      updateSettings({
                        maxTokens: parseInt(e.target.value) || 4096,
                      })
                    }
                    min={1}
                    max={8192}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum tokens for each response (1-8192)
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Behavior Settings */}
            <TabsContent value="behavior" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-trim Conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically trim old messages when approaching context
                      limits
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoTrim}
                    onCheckedChange={(checked) =>
                      updateSettings({ autoTrim: checked })
                    }
                  />
                </div>

                {settings.autoTrim && (
                  <div>
                    <Label className="mb-2 block">
                      Auto-trim Threshold:{" "}
                      {Math.round(settings.autoTrimThreshold * 100)}%
                    </Label>
                    <Slider
                      value={[settings.autoTrimThreshold]}
                      onValueChange={([value]) =>
                        updateSettings({ autoTrimThreshold: value })
                      }
                      max={0.95}
                      min={0.5}
                      step={0.05}
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Trim conversation when context usage exceeds this
                      percentage
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle dark/light theme
                    </p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) =>
                      updateSettings({ darkMode: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    Export Settings
                  </Label>
                  <Button
                    onClick={handleExportSettings}
                    variant="outline"
                    className="w-full"
                  >
                    Download Settings File
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export your settings (API key excluded for security)
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    Import Settings
                  </Label>
                  <div className="space-y-2">
                    <textarea
                      className="w-full h-24 p-2 border rounded-md text-sm"
                      placeholder="Paste settings JSON here..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                    />
                    <Button
                      onClick={handleImportSettings}
                      variant="outline"
                      className="w-full"
                      disabled={!importData.trim()}
                    >
                      Import Settings
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset to Defaults
                  </Label>
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          "Reset all settings to defaults? Your API key will be preserved."
                        )
                      ) {
                        manager.resetToDefaults();
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    Reset All Settings
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will reset all settings except your API key
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
