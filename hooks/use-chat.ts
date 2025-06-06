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
  // Removed threadId state and localStorage initialization
  // Removed threadId state
  // const [threadId, setThreadId] = useState<string | undefined>(() => {
  //   if (typeof window !== 'undefined') {
  //     return localStorage.getItem('chatThreadId') || undefined;
  //   }
  //   return undefined;
  // });
  // ✅ memory per refresh
  const [isLoading, setIsLoading] = useState(false);
  const [lastCompletedAssistantMessage, setLastCompletedAssistantMessage] = useState<Message | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Removed effect to persist thread ID to localStorage
  // useEffect(() => {
  //   if (isClient && threadId) {
  //     localStorage.setItem('chatThreadId', threadId);
  //   }
  // }, [threadId, isClient]);

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
      // Removed threadId argument
      const result = await generateChatResponse(updatedMessages);

      if (result?.text) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: result.text,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastCompletedAssistantMessage(assistantMessage);
      }

      // Removed threadId update logic
      // if (result?.threadId) {
      //   setThreadId(result.threadId); // Always update thread ID if we get a new one
      // }

    } catch (err: any) {
      console.error("Assistant error:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));

      let errorMessage = "Something went wrong. Try again.";
      // Simplified error message check as thread_id error is no longer expected
      if (err.message && typeof err.message === 'string') {
         errorMessage = `Error: ${err.message.substring(0, 100)}...`;
      } else if (typeof err === 'string') {
          errorMessage = `Error: ${err.substring(0, 100)}...`;
      }

      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Removed thread ID clearing logic as it's no longer managed
      // if (err instanceof Error && err.message.includes('thread_id')) {
      //   localStorage.removeItem('chatThreadId');
      //   setThreadId(undefined);
      // }

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
  }, [input, messages, isClient]); // Removed threadId from dependencies

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
    // Removed threadId from returned object
    // threadId,
  };
}
