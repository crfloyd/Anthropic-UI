// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        hasMore: false,
      });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search in both conversation titles and message content
    const [conversationResults, messageResults, totalCount] = await Promise.all(
      [
        // Search conversation titles
        prisma.conversation.findMany({
          where: {
            title: {
              contains: searchTerm,
            },
          },
          include: {
            _count: {
              select: { messages: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),

        // Search message content
        prisma.message.findMany({
          where: {
            content: {
              contains: searchTerm,
            },
          },
          include: {
            conversation: {
              select: {
                id: true,
                title: true,
                updatedAt: true,
              },
            },
          },
          orderBy: { timestamp: "desc" },
          skip: offset,
          take: limit,
        }),

        // Get total count for pagination
        prisma.message.count({
          where: {
            content: {
              contains: searchTerm,
            },
          },
        }),
      ]
    );

    // Combine and format results
    const results = [
      // Add conversation matches
      ...conversationResults.map((conv) => ({
        type: "conversation" as const,
        id: conv.id,
        title: conv.title,
        excerpt: `Conversation with ${conv._count.messages} messages`,
        conversationId: conv.id,
        conversationTitle: conv.title,
        updatedAt: conv.updatedAt,
        matchType: "title" as const,
      })),

      // Add message matches
      ...messageResults.map((msg) => {
        // Create excerpt with highlighted context
        const content = msg.content;
        const index = content.toLowerCase().indexOf(searchTerm);
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + searchTerm.length + 50);

        let excerpt = content.substring(start, end);
        if (start > 0) excerpt = "..." + excerpt;
        if (end < content.length) excerpt = excerpt + "...";

        return {
          type: "message" as const,
          id: msg.id,
          title: msg.conversation.title,
          excerpt: excerpt,
          conversationId: msg.conversation.id,
          conversationTitle: msg.conversation.title,
          updatedAt: msg.conversation.updatedAt,
          messageRole: msg.role,
          matchType: "content" as const,
          timestamp: msg.timestamp,
        };
      }),
    ];

    // Sort by relevance (conversation matches first, then by date)
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "conversation" ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const hasMore = offset + limit < totalCount + conversationResults.length;

    return NextResponse.json({
      results: results.slice(0, limit),
      total: totalCount + conversationResults.length,
      hasMore,
      query: searchTerm,
    });
  } catch (error) {
    console.error("Search error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
