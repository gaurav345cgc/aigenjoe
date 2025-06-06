"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse } from "@/app/actions/chat-actions"; // ✅ matches your file

export function useChat() {
  // Initialize with empty state to match server render
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatThreadId') || undefined;
    }
    return undefined;
  });
  // ✅ memory per refresh
  const [isLoading, setIsLoading] = useState(false);
  const [lastCompletedAssistantMessage, setLastCompletedAssistantMessage] = useState<Message | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Persist thread ID to localStorage when it changes
  useEffect(() => {
    if (isClient && threadId) {
      localStorage.setItem('chatThreadId', threadId);
    }
  }, [threadId, isClient]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isClient) return;
    setInput(e.target.value);
  }, [isClient]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    if (!isClient) return;
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await generateChatResponse(updatedMessages, threadId);

      if (result?.text) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: result.text,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastCompletedAssistantMessage(assistantMessage);
      }

      if (result?.threadId) {
        setThreadId(result.threadId); // Always update thread ID if we get a new one
      }
    } catch (err) {
      console.error("Assistant error:", err);
      // If we get a thread ID error, clear the stored thread ID
      if (err instanceof Error && err.message.includes('thread_id')) {
        localStorage.removeItem('chatThreadId');
        setThreadId(undefined);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, threadId, isClient]);

  const handleStop = useCallback(() => {
    if (!isClient) return;
    setIsLoading(false);
  }, [isClient]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleStop,
    isLoading,
    lastCompletedAssistantMessage,
    threadId,
  };
}
