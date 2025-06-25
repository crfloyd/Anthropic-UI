// src/lib/tokens.ts
import { encode } from "gpt-tokenizer";

// Claude pricing (as of 2024) - per million tokens
const CLAUDE_PRICING = {
  "claude-3-5-sonnet-20241022": {
    input: 3.0, // $3 per million input tokens
    output: 15.0, // $15 per million output tokens
  },
  "claude-3-opus-20240229": {
    input: 15.0,
    output: 75.0,
  },
  "claude-3-haiku-20240307": {
    input: 0.25,
    output: 1.25,
  },
};

// Context management constants
export const CONTEXT_LIMITS = {
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-opus-20240229": 200000,
  "claude-3-haiku-20240307": 200000,
};

export const CONTEXT_THRESHOLDS = {
  WARNING: 0.7, // 70% - show warning
  CRITICAL: 0.85, // 85% - suggest trimming
  EMERGENCY: 0.95, // 95% - force trim
};

export function countTokens(text: string): number {
  if (!text || text.trim() === "") return 0;

  try {
    // GPT tokenizer is a good approximation for Claude
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    // Fallback: rough estimation (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}

export function calculateCost(
  tokens: number,
  model: string = "claude-3-5-sonnet-20241022",
  type: "input" | "output" = "input"
): number {
  const pricing = CLAUDE_PRICING[model as keyof typeof CLAUDE_PRICING];
  if (!pricing) return 0;

  const pricePerToken = pricing[type] / 1_000_000; // Convert per-million to per-token
  return tokens * pricePerToken;
}

export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `${(cost * 1000).toFixed(3)}k`; // Show in thousandths
  } else if (cost < 0.01) {
    return `${(cost * 100).toFixed(2)}¢`; // Show in cents
  } else {
    return `${cost.toFixed(4)}`;
  }
}

export function getTotalConversationTokens(
  messages: Array<{ content: string }>
): number {
  return messages.reduce(
    (total, message) => total + countTokens(message.content),
    0
  );
}

export function getModelDisplayName(model: string): string {
  switch (model) {
    case "claude-3-5-sonnet-20241022":
      return "Claude 3.5 Sonnet";
    case "claude-3-opus-20240229":
      return "Claude 3 Opus";
    case "claude-3-haiku-20240307":
      return "Claude 3 Haiku";
    default:
      return model;
  }
}

// Context management functions
export interface MessageWithTokens {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
}

export function getContextStatus(
  messages: MessageWithTokens[],
  model: string = "claude-3-5-sonnet-20241022"
): {
  totalTokens: number;
  percentage: number;
  status: "safe" | "warning" | "critical" | "emergency";
  limit: number;
} {
  const limit = CONTEXT_LIMITS[model as keyof typeof CONTEXT_LIMITS] || 200000;
  const totalTokens = getTotalConversationTokens(messages);
  const percentage = totalTokens / limit;

  let status: "safe" | "warning" | "critical" | "emergency" = "safe";
  if (percentage >= CONTEXT_THRESHOLDS.EMERGENCY) status = "emergency";
  else if (percentage >= CONTEXT_THRESHOLDS.CRITICAL) status = "critical";
  else if (percentage >= CONTEXT_THRESHOLDS.WARNING) status = "warning";

  return {
    totalTokens,
    percentage,
    status,
    limit,
  };
}

export function trimConversation(
  messages: MessageWithTokens[],
  targetTokens: number,
  strategy: "recent" | "important" = "recent"
): {
  trimmedMessages: MessageWithTokens[];
  removedCount: number;
  tokensSaved: number;
} {
  if (messages.length === 0) {
    return { trimmedMessages: [], removedCount: 0, tokensSaved: 0 };
  }

  // Add token counts to messages if not present
  const messagesWithTokens = messages.map((msg) => ({
    ...msg,
    tokens: msg.tokens || countTokens(msg.content),
  }));

  const totalTokens = messagesWithTokens.reduce(
    (sum, msg) => sum + (msg.tokens || 0),
    0
  );

  if (totalTokens <= targetTokens) {
    return { trimmedMessages: messages, removedCount: 0, tokensSaved: 0 };
  }

  if (strategy === "recent") {
    // Keep recent messages, remove from the beginning
    let currentTokens = 0;
    const trimmedMessages: MessageWithTokens[] = [];

    // Work backwards to keep the most recent messages
    for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
      const msg = messagesWithTokens[i];
      const msgTokens = msg.tokens || 0;

      if (currentTokens + msgTokens <= targetTokens) {
        trimmedMessages.unshift(msg);
        currentTokens += msgTokens;
      } else {
        break;
      }
    }

    const removedCount = messages.length - trimmedMessages.length;
    const tokensSaved = totalTokens - currentTokens;

    return { trimmedMessages, removedCount, tokensSaved };
  }

  // Default fallback - just return recent messages
  return trimConversation(messages, targetTokens, "recent");
}

export function getRecommendedTrimTarget(
  totalTokens: number,
  model: string = "claude-3-5-sonnet-20241022"
): number {
  const limit = CONTEXT_LIMITS[model as keyof typeof CONTEXT_LIMITS] || 200000;
  // Target 50% of context limit after trimming to leave room for growth
  return Math.floor(limit * 0.5);
}
