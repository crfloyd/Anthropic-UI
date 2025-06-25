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
    return `$${(cost * 1000).toFixed(3)}k`; // Show in thousandths
  } else if (cost < 0.01) {
    return `$${(cost * 100).toFixed(2)}¢`; // Show in cents
  } else {
    return `$${cost.toFixed(4)}`;
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
