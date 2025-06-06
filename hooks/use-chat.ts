"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "ai";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse } from "@/app/actions/chat-actions";
import { useToast } from "@/components/ui/use-toast";

export function useChat() {
  const { toast } = useToast();

  // Initialize with empty state to match server render
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  // Re-adding threadId state and localStorage initialization
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

  // Re-adding effect to persist thread ID to localStorage when it changes
  useEffect(() => {
    if (isClient && threadId) {
      localStorage.setItem('chatThreadId', threadId);
    } else if (isClient && threadId === undefined) {
       // Also clear localStorage if threadId becomes undefined (e.g., on error)
       localStorage.removeItem('chatThreadId');
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

    // Add user message to messages immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput(""); // Clear input field
    setIsLoading(true);
    setLastCompletedAssistantMessage(null); // Clear last completed message on new submission

    try {
      // Pass threadId to generateChatResponse
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

      // Update threadId state with the returned threadId
      if (result?.threadId) {
        setThreadId(result.threadId); // Always update thread ID if we get a new one
      }

    } catch (err: any) {
      console.error("Assistant error:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));

      let errorMessage = "Something went wrong. Try again.";
      // Use specific error messages from server action if available
      if (err.message && typeof err.message === 'string') {
         if (err.message.startsWith('[CRITICAL_THREAD_ERROR]') || err.message.startsWith('[THREAD_OPERATION_FAILED]') || err.message.startsWith('[THREAD_ID_MISSING]') || err.message.startsWith('[RUN_STATUS_ERROR]') || err.message.startsWith('[RUN_OPERATION_FAILED]')) {
             errorMessage = `Chat Error: ${err.message}`; // Show the detailed server error message
         } else {
             errorMessage = `Error: ${err.message.substring(0, 100)}...`;
         }
      } else if (typeof err === 'string') {
          errorMessage = `Error: ${err.substring(0, 100)}...`;
      }

      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Clear thread ID in localStorage and state on specific thread errors
      if (err instanceof Error && (err.message.includes('thread_id') || err.message.startsWith('[CRITICAL_THREAD_ERROR]') || err.message.startsWith('[THREAD_OPERATION_FAILED]') || err.message.startsWith('[THREAD_ID_MISSING]'))) {
        console.warn("Clearing threadId due to error:", err.message);
        localStorage.removeItem('chatThreadId');
        setThreadId(undefined);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, threadId, isClient]); // Re-added threadId to dependencies

  const handleStop = useCallback(() => {
    if (!isClient) return;
    setIsLoading(false);
    // Note: Stopping a streamed completion would require canceling the API request,
    // which is not implemented in this basic example.
  }, [isClient]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleStop,
    isLoading,
    lastCompletedAssistantMessage,
    threadId, // Re-adding threadId to returned object
  };
}
