// app/landing/page.tsx
"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Sparkles,
  Code,
  FileText,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  Chrome,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push("/");
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Intelligent AI Chat",
      description: "Powered by Claude's advanced language understanding",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Code Canvas",
      description: "Interactive code editing with syntax highlighting",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "File Support",
      description: "Upload and analyze documents, images, and code files",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Streaming",
      description: "Watch responses appear as Claude thinks",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your API key and conversations are encrypted",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Claude API Chat</span>
        </div>
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="hidden sm:flex"
        >
          <Chrome className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="relative px-6 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Sparkles className="mr-2 h-4 w-4" />
              Powered by Anthropic's Claude AI
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Your Personal
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                AI Assistant
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              A powerful, intuitive interface for Claude API with advanced
              features like code editing, file uploads, conversation management,
              and intelligent context handling.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="px-8 py-4 text-lg h-auto"
              >
                {isLoading ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                ) : (
                  <Chrome className="mr-2 h-5 w-5" />
                )}
                Get Started with Google
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg h-auto"
              >
                View Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Free to use with your own Claude API key
            </p>
          </motion.div>
        </div>

        {/* Floating Cards Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-lg opacity-20"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need for AI conversations
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Professional features that make Claude more powerful and enjoyable
            to use
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg mr-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Sign in with Google and enter your Claude API key to begin
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                No subscription required
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Your data stays private
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Free to use
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-8 px-8 py-4 text-lg h-auto"
            >
              {isLoading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <Chrome className="mr-2 h-5 w-5" />
              )}
              Start Chatting Now
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Tailwind CSS, and Anthropic's Claude API</p>
        </div>
      </footer>
    </div>
  );
}
