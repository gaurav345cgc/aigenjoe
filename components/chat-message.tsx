"use client";

import { cn } from "@/lib/utils";
import type { Message } from "ai";
import { User, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessageProps {
  message: Message;
  isSpeaking?: boolean;
  triggerSync?: boolean;
  durationMs?: number;
  stopTypingSignal?: boolean;
  mode?: "text-only" | "avatar";
  theme?: "dark" | "light";
}

export default function ChatMessage({
  message,
  isSpeaking = false,
  triggerSync = false,
  durationMs,
  stopTypingSignal = false,
  mode = "avatar",
  theme = "light"
}: ChatMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(message.content ?? "");
  const [isTyping, setIsTyping] = useState(false);

  const isUser = message.role === "user";
  const fullContent = message.content ?? "";

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing animation - only for avatar mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (mode === "avatar" && !isUser && isSpeaking && triggerSync && fullContent) {
      setDisplayedContent(fullContent);
      setIsTyping(false);
    } else if (mode === "text-only") {
      setDisplayedContent(fullContent);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpeaking, triggerSync, durationMs, fullContent, mode, isUser]);

  // Stop signal - only for avatar mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (mode === "avatar" && stopTypingSignal && intervalRef.current) {
      clearInterval(intervalRef.current);
      setDisplayedContent(prev => prev.trim());
      setIsTyping(false);
    }
  }, [stopTypingSignal, mode]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl p-3 shadow-sm",
          isUser
            ? theme === "dark"
              ? "bg-eoxs-green text-black dark:text-white rounded-tr-none"
              : "bg-white text-black rounded-tr-none"
            : theme === "dark"
              ? "bg-[#0a0a0a] text-white rounded-tl-none border border-gray-800"
              : "bg-[#f0f4f9] text-black rounded-tl-none border border-gray-200"
        )}
      >
        <div className="flex items-start gap-2">
          {!isUser && mode === "avatar" && (
            <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5 ${
              theme === "dark" 
                ? "bg-[#0a0a0a] border border-gray-800" 
                : "bg-white border border-gray-200"
            }`}>
              <img src="/pic.png" alt="Joseph Malchar" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-xs font-medium mb-1",
                isUser 
                  ? "text-black dark:text-white/90" 
                  : theme === "dark"
                    ? "text-eoxs-green/90"
                    : "text-eoxs-green"
              )}
            >
              {isUser ? "You": "Joseph Malchar"}
            </div>

            <div className="text-base whitespace-pre-wrap break-words">
              {isUser ? (
                fullContent
              ) : mode === "avatar" && fullContent === "" && !isTyping ? (
                <div className={`flex items-center gap-2 text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  <div className="animate-spin h-4 w-4 border-2 border-eoxs-green border-t-transparent rounded-full"></div>
                  <span>Joe is thinking...</span>
                </div>
              ) : (
                displayedContent
              )}
            </div>
          </div>

          {isUser && (
            <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 mt-0.5 ${
              theme === "dark"
                ? "bg-eoxs-green/80 border border-white/20"
                : "bg-eoxs-green border border-white/20"
            }`}>
              <User className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
