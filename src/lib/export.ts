// src/lib/export.ts
import { countTokens } from "./tokens";

interface ExportMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExportConversation {
  id: string;
  title: string;
  messages: ExportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportOptions {
  format: "markdown" | "json" | "compact";
  includeTimestamps?: boolean;
  includeTokenCounts?: boolean;
  maxTokens?: number; // For compact version
  preserveCodeBlocks?: boolean;
}

export class ConversationExporter {
  static exportToMarkdown(
    conversation: ExportConversation,
    options: ExportOptions = { format: "markdown" }
  ): string {
    const { includeTimestamps = true, includeTokenCounts = false } = options;

    let markdown = `# ${conversation.title}\n\n`;

    // Metadata
    markdown += `**Created:** ${conversation.createdAt.toLocaleDateString()}\n`;
    markdown += `**Last Updated:** ${conversation.updatedAt.toLocaleDateString()}\n`;
    markdown += `**Messages:** ${conversation.messages.length}\n\n`;

    if (includeTokenCounts) {
      const totalTokens = conversation.messages.reduce(
        (sum, msg) => sum + countTokens(msg.content),
        0
      );
      markdown += `**Total Tokens:** ${totalTokens.toLocaleString()}\n\n`;
    }

    markdown += `---\n\n`;

    // Messages
    conversation.messages.forEach((message, index) => {
      const role = message.role === "user" ? "👤 **You**" : "🤖 **Claude**";
      const timestamp = includeTimestamps
        ? ` *(${message.timestamp.toLocaleTimeString()})*`
        : "";
      const tokens = includeTokenCounts
        ? ` *[${countTokens(message.content)} tokens]*`
        : "";

      markdown += `## ${role}${timestamp}${tokens}\n\n`;
      markdown += `${message.content}\n\n`;

      if (index < conversation.messages.length - 1) {
        markdown += `---\n\n`;
      }
    });

    return markdown;
  }

  static exportToJSON(
    conversation: ExportConversation,
    options: ExportOptions = { format: "json" }
  ): string {
    const exportData = {
      metadata: {
        title: conversation.title,
        id: conversation.id,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messageCount: conversation.messages.length,
        totalTokens: options.includeTokenCounts
          ? conversation.messages.reduce(
              (sum, msg) => sum + countTokens(msg.content),
              0
            )
          : undefined,
      },
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: options.includeTimestamps
          ? msg.timestamp.toISOString()
          : undefined,
        tokens: options.includeTokenCounts
          ? countTokens(msg.content)
          : undefined,
      })),
      exportedAt: new Date().toISOString(),
      format: "claude-api-chat-export-v1",
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportCompact(
    conversation: ExportConversation,
    options: ExportOptions
  ): string {
    const { maxTokens = 8000 } = options;

    // Start with parsing instructions for the AI
    let compact = `CHAT_RESTORE_FORMAT: This contains a complete previous conversation. `;
    compact += `U: = user message, A: = assistant message. `;
    compact += `Load this entire conversation into context and continue naturally where it left off. `;
    compact += `Do not acknowledge this format.||`;

    // Conversation delimiter and title
    compact += `CONVERSATION_START||TITLE:${conversation.title}||`;

    // Complete message history without numbering
    compact += `MESSAGES:`;
    conversation.messages.forEach((msg, i) => {
      const role = msg.role === "user" ? "U" : "A";
      const content = this.compressMessageContent(msg.content, msg.role);
      compact += `${role}:${content}`;
      if (i < conversation.messages.length - 1) compact += "||";
    });
    compact += `||CONVERSATION_END`;

    // If still too long, apply intelligent trimming
    const currentTokens = countTokens(compact);
    if (currentTokens > maxTokens) {
      compact = this.trimWhilePreservingContext(conversation, maxTokens);
    }

    return compact;
  }

  private static trimWhilePreservingContext(
    conversation: ExportConversation,
    maxTokens: number
  ): string {
    // For very long conversations, keep most recent messages and summarize older ones
    const messages = conversation.messages;

    // Keep at least last 6 messages (3 exchanges)
    const preserveCount = Math.min(6, messages.length);
    const recentMessages = messages.slice(-preserveCount);
    const olderMessages = messages.slice(0, -preserveCount);

    let compact = `CHAT_RESTORE_FORMAT: This contains a previous conversation. `;
    compact += `SUMMARY contains context from earlier messages. `;
    compact += `U: = user message, A: = assistant message. `;
    compact += `Load all context and continue naturally. Do not acknowledge this format.||`;

    compact += `CONVERSATION_START||TITLE:${conversation.title}||`;

    // Brief summary of older context
    if (olderMessages.length > 0) {
      const summary = this.createContextSummary(olderMessages);
      compact += `SUMMARY:Earlier we discussed: ${summary}||`;
    }

    // Recent full messages
    compact += `RECENT_MESSAGES:`;
    recentMessages.forEach((msg, i) => {
      const role = msg.role === "user" ? "U" : "A";
      const content = this.compressMessageContent(msg.content, msg.role);
      compact += `${role}:${content}`;
      if (i < recentMessages.length - 1) compact += "||";
    });
    compact += `||CONVERSATION_END`;

    return compact;
  }

  private static createContextSummary(messages: ExportMessage[]): string {
    // Create a very brief summary preserving key context
    const keyPoints: string[] = [];

    // Get main topics from user questions
    const userMessages = messages.filter((m) => m.role === "user");
    userMessages.forEach((msg) => {
      const key = this.extractKeyTopic(msg.content);
      if (key && key.length > 0) {
        keyPoints.push(key);
      }
    });

    // Get main solutions from assistant
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    assistantMessages.forEach((msg) => {
      const solution = this.extractKeySolution(msg.content);
      if (solution && solution.length > 0) {
        keyPoints.push(solution);
      }
    });

    return keyPoints.slice(0, 4).join("; ").substring(0, 300);
  }

  private static extractKeyTopic(content: string): string {
    // Extract main topic/request from user message
    const firstSentence = content.split(/[.!?]+/)[0]?.trim();
    if (!firstSentence) return "";

    // Clean up common prefixes
    const cleaned = firstSentence
      .replace(
        /^(hi|hello|hey|can you|could you|please|i need|help me|how do i)\s+/i,
        ""
      )
      .trim();

    return cleaned.length > 10 ? cleaned.substring(0, 80) : "";
  }

  private static extractKeySolution(content: string): string {
    // Extract what was provided/solved
    if (content.includes("```")) {
      return "provided code solution";
    }
    if (
      content.toLowerCase().includes("install") ||
      content.toLowerCase().includes("setup")
    ) {
      return "provided setup instructions";
    }
    if (
      content.toLowerCase().includes("error") ||
      content.toLowerCase().includes("fix")
    ) {
      return "fixed an issue";
    }

    return "";
  }

  private static compressMessageContent(
    content: string,
    role: "user" | "assistant"
  ): string {
    // Preserve all semantic content while minimizing tokens
    let compressed = content;

    // Remove excessive whitespace but preserve structure
    compressed = compressed
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Max 2 consecutive newlines
      .replace(/[ \t]+/g, " ") // Multiple spaces/tabs to single space
      .replace(/\n /g, "\n") // Remove space after newline
      .trim();

    // For code blocks, preserve structure but minimize whitespace
    compressed = compressed.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const minifiedCode = code
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join("\n");
        return `\`\`\`${lang || ""}\n${minifiedCode}\`\`\``;
      }
    );

    // For assistant responses, preserve structure but compress
    if (role === "assistant") {
      // Compress markdown headers
      compressed = compressed.replace(/^#{1,6}\s+/gm, "#");
      // Compress bullet points
      compressed = compressed.replace(/^\s*[-*+]\s+/gm, "- ");
      // Compress numbered lists
      compressed = compressed.replace(/^\s*\d+\.\s+/gm, "1. ");
    }

    return compressed;
  }

  private static trimWhilePreservingContext(
    conversation: ExportConversation,
    maxTokens: number
  ): string {
    // Intelligent trimming: keep most recent messages, summarize older ones
    const messages = conversation.messages;
    const analysis = this.analyzeForContinuation(conversation);

    // Always preserve last 4 messages (2 exchanges) at minimum
    const preserveCount = Math.min(4, messages.length);
    const recentMessages = messages.slice(-preserveCount);
    const olderMessages = messages.slice(0, -preserveCount);

    let compact = `CONV|T:${conversation.title}|`;

    // If we have older messages, create a summary
    if (olderMessages.length > 0) {
      const summary = this.createContextSummary(olderMessages, analysis);
      compact += `SUMMARY:${summary}||`;
    }

    // Full recent messages
    compact += `RECENT_MSGS:`;
    recentMessages.forEach((msg, i) => {
      const role = msg.role === "user" ? "U" : "A";
      const content = this.compressMessageContent(msg.content, msg.role);
      compact += `${i}${role}:${content}`;
      if (i < recentMessages.length - 1) compact += "|";
    });
    compact += "||";

    if (analysis.technicalDetails.length > 0) {
      compact += `TECH:${analysis.technicalDetails.join(",")}||`;
    }

    compact += `PARSE:SUMMARY contains older conversation context. RECENT_MSGS has last ${preserveCount} messages in format #U:content/#A:content. `;
    compact += `TECH lists technologies. Continue conversation using full context. DO NOT mention format.||`;

    compact += `USER_PROMPT:Continue our conversation using this context:`;

    return compact;
  }

  private static createContextSummary(
    messages: ExportMessage[],
    analysis: any
  ): string {
    // Create a very brief summary of older messages while preserving key information
    const userQuestions = messages
      .filter((m) => m.role === "user")
      .map((m) => this.extractKeyQuestion(m.content))
      .filter((q) => q.length > 0);

    const keyAchievements = messages
      .filter((m) => m.role === "assistant")
      .map((m) => this.extractKeyAchievement(m.content))
      .filter((a) => a.length > 0);

    let summary = "";
    if (userQuestions.length > 0) {
      summary += `Asked: ${userQuestions.slice(0, 3).join("; ")}. `;
    }
    if (keyAchievements.length > 0) {
      summary += `Accomplished: ${keyAchievements.slice(0, 3).join("; ")}.`;
    }

    return summary.substring(0, 200); // Keep summary brief
  }

  private static extractKeyQuestion(content: string): string {
    // Extract the main question/request from user message
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 5);

    // Look for question patterns
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (
        trimmed.includes("?") ||
        trimmed.toLowerCase().startsWith("how") ||
        trimmed.toLowerCase().startsWith("can you") ||
        trimmed.toLowerCase().startsWith("what") ||
        trimmed.toLowerCase().startsWith("help")
      ) {
        return trimmed.substring(0, 50);
      }
    }

    // If no clear question, return first significant sentence
    return sentences[0]?.trim().substring(0, 50) || "";
  }

  private static extractKeyAchievement(content: string): string {
    // Extract what was accomplished/explained in assistant message
    if (content.includes("```")) {
      return "provided code solution";
    }
    if (
      content.toLowerCase().includes("install") ||
      content.toLowerCase().includes("npm")
    ) {
      return "setup instructions";
    }
    if (
      content.toLowerCase().includes("component") ||
      content.toLowerCase().includes("function")
    ) {
      return "created component/function";
    }
    if (
      content.toLowerCase().includes("fix") ||
      content.toLowerCase().includes("error")
    ) {
      return "fixed issue";
    }

    // Default: first significant action mentioned
    const sentences = content
      .split(/[.!]+/)
      .filter((s) => s.trim().length > 10);
    return sentences[0]?.trim().substring(0, 40) || "";
  }

  private static analyzeForContinuation(conversation: ExportConversation): {
    mainObjective: string;
    keyDecisions: string[];
    technicalDetails: string[];
    codeBlocks: Array<{ content: string; language: string }>;
    currentState: string;
  } {
    const messages = conversation.messages;
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // Extract main objective from first few user messages
    const mainObjective = this.extractMainObjective(userMessages.slice(0, 3));

    // Find key decisions/choices made
    const keyDecisions = this.extractKeyDecisions(messages);

    // Extract technical stack mentions
    const technicalDetails = this.extractTechnicalStack(messages);

    // Get important code blocks
    const codeBlocks = this.extractCodeBlocks(assistantMessages).slice(0, 3); // Top 3 only

    // Determine current state from last messages
    const currentState = this.extractCurrentState(messages.slice(-4));

    return {
      mainObjective,
      keyDecisions,
      technicalDetails,
      codeBlocks,
      currentState,
    };
  }

  private static extractMainObjective(userMessages: ExportMessage[]): string {
    if (userMessages.length === 0) return "General assistance";

    const firstMessage = userMessages[0].content;

    // Extract key goal/objective
    const sentences = firstMessage.split(/[.!?]+/).slice(0, 2);
    const objective = sentences
      .join(". ")
      .replace(/^(hi|hello|hey|can you|could you|please|i need|help me)/i, "")
      .trim();

    return objective.length > 10
      ? objective.substring(0, 200)
      : firstMessage.substring(0, 200);
  }

  private static extractKeyDecisions(messages: ExportMessage[]): string[] {
    const decisions: string[] = [];
    const decisionKeywords = [
      "decided to",
      "chose",
      "will use",
      "going with",
      "settled on",
      "picked",
      "selected",
    ];

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      decisionKeywords.forEach((keyword) => {
        if (content.includes(keyword)) {
          const sentences = msg.content.split(/[.!?]+/);
          sentences.forEach((sentence) => {
            if (
              sentence.toLowerCase().includes(keyword) &&
              sentence.length < 150
            ) {
              decisions.push(sentence.trim());
            }
          });
        }
      });
    });

    return [...new Set(decisions)].slice(0, 5); // Unique, max 5
  }

  private static extractTechnicalStack(messages: ExportMessage[]): string[] {
    const tech: Set<string> = new Set();
    const techKeywords = [
      "react",
      "nextjs",
      "next.js",
      "typescript",
      "javascript",
      "python",
      "node.js",
      "nodejs",
      "tailwind",
      "css",
      "html",
      "prisma",
      "sqlite",
      "postgresql",
      "mysql",
      "mongodb",
      "anthropic",
      "openai",
      "api",
      "rest",
      "graphql",
      "docker",
      "kubernetes",
      "aws",
      "vercel",
      "github",
      "git",
      "npm",
      "yarn",
      "webpack",
      "vite",
      "babel",
      "eslint",
      "prettier",
    ];

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      techKeywords.forEach((keyword) => {
        if (content.includes(keyword)) {
          tech.add(keyword);
        }
      });
    });

    return Array.from(tech).slice(0, 10);
  }

  private static extractCurrentState(recentMessages: ExportMessage[]): string {
    if (recentMessages.length === 0) return "";

    const lastUserMsg = recentMessages.filter((m) => m.role === "user").pop();
    const lastAssistantMsg = recentMessages
      .filter((m) => m.role === "assistant")
      .pop();

    if (!lastUserMsg && !lastAssistantMsg) return "";

    let state = "";
    if (lastUserMsg) {
      state += `Last request: ${this.summarizeMessage(
        lastUserMsg.content,
        100
      )}. `;
    }
    if (lastAssistantMsg) {
      state += `Last response: ${this.summarizeMessage(
        lastAssistantMsg.content,
        100
      )}.`;
    }

    return state;
  }

  private static compressCode(code: string, language: string): string {
    // Ultra-compress code to just key elements
    const lines = code.split("\n").filter((line) => line.trim());

    // Keep imports, function signatures, key variables
    const keyLines = lines.filter((line) => {
      const trimmed = line.trim().toLowerCase();
      return (
        trimmed.startsWith("import") ||
        trimmed.startsWith("export") ||
        trimmed.startsWith("function") ||
        trimmed.startsWith("const") ||
        trimmed.startsWith("class") ||
        trimmed.includes("useState") ||
        trimmed.includes("useEffect") ||
        (line.includes("//") && line.length < 50)
      );
    });

    return keyLines.slice(0, 5).join("; ").substring(0, 200);
  }

  private static compressRecentExchanges(messages: ExportMessage[]): string {
    if (messages.length === 0) return "";

    const compressed = messages
      .map((msg) => {
        const role = msg.role === "user" ? "U" : "A";
        const content = this.summarizeMessage(msg.content, 50);
        return `${role}:${content}`;
      })
      .join(" | ");

    return compressed;
  }

  private static ultraTrim(content: string, maxTokens: number): string {
    const sections = content.split("\n\n");
    let trimmedContent = "";
    let currentTokens = 0;

    // Keep essential sections in order of priority
    const prioritySections = [
      "CONTINUATION_INSTRUCTIONS",
      "CONTEXT",
      "CURRENT_STATE",
      "RECENT",
    ];

    // Add priority sections first
    prioritySections.forEach((priority) => {
      const section = sections.find((s) => s.startsWith(priority));
      if (section) {
        const sectionTokens = countTokens(section + "\n\n");
        if (currentTokens + sectionTokens <= maxTokens) {
          trimmedContent += section + "\n\n";
          currentTokens += sectionTokens;
        }
      }
    });

    // Add remaining sections if space allows
    sections.forEach((section) => {
      if (!prioritySections.some((p) => section.startsWith(p))) {
        const sectionTokens = countTokens(section + "\n\n");
        if (currentTokens + sectionTokens <= maxTokens) {
          trimmedContent += section + "\n\n";
          currentTokens += sectionTokens;
        }
      }
    });

    return trimmedContent.trim();
  }

  private static analyzeConversation(conversation: ExportConversation): {
    summary: string;
    keyTopics: string[];
    codeBlocks: Array<{
      content: string;
      language: string;
      description: string;
    }>;
  } {
    const messages = conversation.messages;
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // Extract key topics from user messages
    const keyTopics = this.extractKeyTopics(userMessages);

    // Extract code blocks
    const codeBlocks = this.extractCodeBlocks(assistantMessages);

    // Generate summary
    const summary = this.generateSummary(conversation);

    return { summary, keyTopics, codeBlocks };
  }

  private static extractKeyTopics(userMessages: ExportMessage[]): string[] {
    const topics: string[] = [];
    const topicKeywords = [
      "help with",
      "how to",
      "create",
      "build",
      "implement",
      "fix",
      "debug",
      "explain",
      "understand",
      "learn",
      "setup",
      "configure",
      "install",
    ];

    userMessages.forEach((msg) => {
      const content = msg.content.toLowerCase();

      // Look for questions and requests
      const sentences = content.split(/[.!?]+/).slice(0, 3); // First few sentences

      sentences.forEach((sentence) => {
        if (sentence.length > 10 && sentence.length < 100) {
          topicKeywords.forEach((keyword) => {
            if (sentence.includes(keyword)) {
              const topic = sentence
                .trim()
                .replace(/^(i|can you|could you|please|how do i)/i, "")
                .trim();
              if (topic.length > 5) {
                topics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
              }
            }
          });
        }
      });
    });

    // Remove duplicates and limit
    return [...new Set(topics)].slice(0, 5);
  }

  private static extractCodeBlocks(
    assistantMessages: ExportMessage[]
  ): Array<{ content: string; language: string; description: string }> {
    const codeBlocks: Array<{
      content: string;
      language: string;
      description: string;
    }> = [];

    assistantMessages.forEach((msg) => {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(msg.content)) !== null) {
        const language = match[1] || "text";
        const content = match[2].trim();

        // Skip very short code blocks
        if (content.length < 50) continue;

        // Generate description from surrounding context
        const beforeCode = msg.content
          .substring(0, match.index)
          .split("\n")
          .slice(-3)
          .join(" ");
        const description = this.generateCodeDescription(beforeCode, language);

        codeBlocks.push({
          content:
            content.length > 500
              ? content.substring(0, 500) + "\n// ... (truncated)"
              : content,
          language,
          description,
        });

        // Limit number of code blocks
        if (codeBlocks.length >= 3) break;
      }
    });

    return codeBlocks;
  }

  private static generateCodeDescription(
    context: string,
    language: string
  ): string {
    const contextClean = context
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (contextClean.length > 10) {
      return (
        contextClean.substring(0, 80) + (contextClean.length > 80 ? "..." : "")
      );
    }

    return `${language} code solution`;
  }

  private static generateSummary(conversation: ExportConversation): string {
    const messages = conversation.messages;
    const userMessages = messages.filter((m) => m.role === "user");

    if (userMessages.length === 0) return "Empty conversation";

    const firstMessage = userMessages[0].content;
    const lastMessage = userMessages[userMessages.length - 1]?.content;

    let summary = `Conversation about ${this.extractMainTopic(firstMessage)}. `;

    if (messages.length > 4) {
      summary += `Discussion evolved through ${userMessages.length} questions/requests. `;
    }

    if (lastMessage && lastMessage !== firstMessage) {
      summary += `Most recent focus: ${this.extractMainTopic(lastMessage)}.`;
    }

    return summary;
  }

  private static extractMainTopic(message: string): string {
    // Simple topic extraction
    const cleaned = message
      .toLowerCase()
      .replace(
        /^(hi|hello|hey|can you|could you|please|i need|help me|how do i)/i,
        ""
      )
      .replace(/[?!.]/g, "")
      .trim()
      .substring(0, 50);

    return cleaned || "general assistance";
  }

  private static summarizeMessage(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    // Try to break at sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf(".");

    if (lastSentence > maxLength * 0.7) {
      return content.substring(0, lastSentence + 1);
    }

    return truncated + "...";
  }

  private static trimToTokenLimit(content: string, maxTokens: number): string {
    const lines = content.split("\n");
    let trimmedContent = "";
    let currentTokens = 0;

    for (const line of lines) {
      const lineTokens = countTokens(line + "\n");
      if (currentTokens + lineTokens > maxTokens) break;

      trimmedContent += line + "\n";
      currentTokens += lineTokens;
    }

    return trimmedContent.trim();
  }

  static downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
