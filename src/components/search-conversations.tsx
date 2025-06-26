// src/components/search-conversations.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MessageSquare,
  FileText,
  Clock,
  X,
  Loader2,
  ChevronDown,
  User,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "conversation" | "message";
  id: string;
  title: string;
  excerpt: string;
  conversationId: string;
  conversationTitle: string;
  updatedAt: string;
  matchType: "title" | "content";
  messageRole?: "user" | "assistant";
  timestamp?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  query: string;
}

interface SearchConversationsProps {
  onConversationSelect: (conversationId: string) => void;
  isOpen: boolean;
}

export function SearchConversations({
  onConversationSelect,
  isOpen,
}: SearchConversationsProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchOffset: number = 0) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          limit: "20",
          offset: searchOffset.toString(),
        });

        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) throw new Error("Search failed");

        const data: SearchResponse = await response.json();

        if (searchOffset === 0) {
          setResults(data.results);
        } else {
          setResults((prev) => [...prev, ...data.results]);
        }

        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    setOffset(0);
    debouncedSearch(query, 0);
  }, [query, debouncedSearch]);

  const handleLoadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    debouncedSearch(query, newOffset);
  };

  const handleResultClick = (result: SearchResult) => {
    onConversationSelect(result.conversationId);
    setQuery("");
    setResults([]);
    setIsExpanded(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setOffset(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <Card className="border-0 shadow-sm">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Search Results</span>
                {total > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {total} found
                  </Badge>
                )}
              </div>
              {results.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 text-xs"
                >
                  {isExpanded ? "Collapse" : "Expand"}
                  <ChevronDown
                    className={cn(
                      "ml-1 h-3 w-3 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </Button>
              )}
            </div>

            <ScrollArea
              className={cn(
                "transition-all duration-200",
                isExpanded ? "h-80" : "h-40"
              )}
            >
              <div className="space-y-2">
                {isLoading && results.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Searching...
                    </span>
                  </div>
                )}

                {!isLoading && results.length === 0 && query.length >= 2 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                )}

                {results.map((result, index) => (
                  <div key={`${result.type}-${result.id}`}>
                    <Card
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {result.type === "conversation" ? (
                              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <div className="flex-shrink-0">
                                {result.messageRole === "user" ? (
                                  <User className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Bot className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {highlightMatch(result.title, query)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.type === "conversation"
                                  ? "Conversation"
                                  : `${
                                      result.messageRole === "user"
                                        ? "Your message"
                                        : "Claude's response"
                                    }`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDate(result.updatedAt)}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {highlightMatch(result.excerpt, query)}
                        </div>
                      </div>
                    </Card>
                    {index < results.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}

                {hasMore && (
                  <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Load More Results
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
