// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
}

interface MessageWithFiles {
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, conversationId, settings } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Use API key from request settings (user's encrypted API key)
    const apiKey = settings?.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Please configure it in settings." },
        { status: 400 }
      );
    }

    // Initialize Anthropic client with user's API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Get model and parameters from settings
    const model = settings?.model || "claude-3-5-sonnet-20241022";
    const maxTokens = settings?.maxTokens || 4096;
    const temperature = settings?.temperature || 0.7;

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];
    if (!latestUserMessage || latestUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "Latest message must be from user" },
        { status: 400 }
      );
    }

    // Save user message to database if conversationId provided
    if (conversationId) {
      // Verify the conversation belongs to the authenticated user
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found or access denied" },
          { status: 404 }
        );
      }

      await prisma.message.create({
        data: {
          role: "user",
          content: latestUserMessage.content,
          conversationId: conversationId,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    // Convert messages to Anthropic format, handling files
    const anthropicMessages = messages
      .filter(
        (msg: MessageWithFiles) =>
          msg.role === "user" || msg.role === "assistant"
      )
      .map((msg: MessageWithFiles) => {
        let content = msg.content;

        // If the message has files, append file information to the content
        if (msg.files && msg.files.length > 0) {
          content += "\n\nAttached files:\n";

          msg.files.forEach((file) => {
            content += `\n**${file.name}** (${file.type}, ${formatFileSize(
              file.size
            )})`;

            if (file.content) {
              if (
                file.type.startsWith("text/") ||
                file.type === "application/json"
              ) {
                // Include text file content
                content += `:\n\`\`\`\n${file.content}\n\`\`\`\n`;
              } else if (file.type.startsWith("image/")) {
                // For images, just mention they are attached
                content += ": [Image file attached]\n";
              } else {
                content += ": [File attached - content not readable]\n";
              }
            }
          });
        }

        return {
          role: msg.role,
          content: content,
        };
      });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let assistantContent = "";

        try {
          const messageStream = await anthropic.messages.create({
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            messages: anthropicMessages,
            stream: true,
          });

          for await (const chunk of messageStream) {
            if (chunk.type === "content_block_delta") {
              const text = chunk.delta.text;
              if (text) {
                assistantContent += text;
                // Send each chunk as Server-Sent Events format
                const data = `data: ${JSON.stringify({ content: text })}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
              }
            }
          }

          // Save assistant response to database if conversationId provided
          if (conversationId && assistantContent) {
            await prisma.message.create({
              data: {
                role: "assistant",
                content: assistantContent,
                conversationId: conversationId,
              },
            });

            // Update conversation timestamp again
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = `data: ${JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
