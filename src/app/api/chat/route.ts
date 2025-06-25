// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

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

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let assistantContent = "";

        try {
          const messageStream = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
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
