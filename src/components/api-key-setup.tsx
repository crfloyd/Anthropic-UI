// components/api-key-setup.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApiKeySetupProps {
  isOpen: boolean;
  onComplete: (apiKey: string) => void;
  onOpenSettings: () => void;
}

export function ApiKeySetup({
  isOpen,
  onComplete,
  onOpenSettings,
}: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateApiKey = (key: string): boolean => {
    return key.startsWith("sk-ant-") && key.length > 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateApiKey(apiKey)) {
      setError("Please enter a valid Claude API key");
      return;
    }

    setIsLoading(true);

    try {
      // Save API key to server
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to save API key");
      }

      onComplete(apiKey);
    } catch (error) {
      setError("Failed to save API key. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Visit Anthropic Console",
      description: "Go to console.anthropic.com to get your API key",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://console.anthropic.com", "_blank")}
          className="mt-2"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Console
        </Button>
      ),
    },
    {
      number: 2,
      title: "Create API Key",
      description: "Generate a new API key for this application",
    },
    {
      number: 3,
      title: "Enter Below",
      description: "Paste your API key to start chatting with Claude",
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 transform -translate-x-12 translate-y-12" />

            <CardHeader className="relative">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="p-3 bg-primary/10 rounded-full"
                >
                  <Key className="h-8 w-8 text-primary" />
                </motion.div>
              </div>

              <CardTitle className="text-center text-2xl">
                Welcome to Claude API Chat!
              </CardTitle>
              <p className="text-center text-muted-foreground mt-2">
                To get started, you'll need to enter your Claude API key
              </p>

              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Secure
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Encrypted
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              {/* Steps */}
              <div className="grid gap-4 md:grid-cols-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="font-medium mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    {step.action}
                  </motion.div>
                ))}
              </div>

              {/* API Key Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-4 border-t pt-6"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="api-key" className="text-base font-medium">
                      Claude API Key
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className={cn(
                          "pr-10 text-base h-12",
                          error && "border-red-500",
                          validateApiKey(apiKey) && "border-green-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-12 px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {validateApiKey(apiKey) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center mt-2 text-green-600 text-sm"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Valid API key format
                      </motion.div>
                    )}
                  </div>

                  {error && (
                    <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      disabled={!validateApiKey(apiKey) || isLoading}
                      className="flex-1 h-12 text-base"
                    >
                      {isLoading ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? "Saving..." : "Save & Continue"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={onOpenSettings}
                      className="h-12 text-base"
                    >
                      Open Settings
                    </Button>
                  </div>
                </form>

                <div className="text-center text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Shield className="inline mr-1 h-3 w-3" />
                  Your API key is encrypted and stored securely. We never access
                  your conversations.
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
