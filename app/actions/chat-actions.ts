"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID!;

export async function generateChatResponse(messages: any[], threadId?: string | null) {
  console.log("generateChatResponse called with threadId:", threadId);
  try {
    // Ensure threadId is treated as undefined if it's null or an empty string
    const validThreadId = (threadId && threadId.trim() !== '') ? threadId : undefined;
    console.log("Valid threadId after check:", validThreadId);

    let thread;
    try {
      if (validThreadId) {
        console.log("Attempting to retrieve thread with ID:", validThreadId);
        thread = await openai.beta.threads.retrieve(validThreadId);
        console.log("Retrieved thread ID:", thread.id);
      } else {
        console.log("No valid threadId provided, creating a new thread.");
        thread = await openai.beta.threads.create();
        console.log("Created new thread with ID:", thread.id);
      }

      // Explicitly check if the obtained thread object and its ID are valid
      if (!thread || !thread.id || typeof thread.id !== 'string' || !thread.id.startsWith('thread_')) {
          const receivedThreadInfo = thread ? `ID: ${thread.id}, Object: ${JSON.stringify(thread)}` : 'null/undefined thread object';
          throw new Error(`Invalid thread object obtained after operation. ValidThreadId was: ${validThreadId}. Received: ${receivedThreadInfo}`);
      }

    } catch (threadError: any) {
        console.error("Error during thread creation or retrieval:", threadError);
        const errorContext = `ValidThreadId: ${validThreadId || 'undefined (new thread attempt)'}`;
        // Re-throw with context in the message
        throw new Error(`Thread operation failed [${errorContext}]: ${threadError.message || 'Unknown error'}`);
    }

    console.log("Using thread ID for OpenAI API calls:", thread.id);

    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) throw new Error("No user message found.");

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: lastUserMessage.content,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (["queued", "in_progress"].includes(runStatus.status)) {
      await new Promise(res => setTimeout(res, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === "completed") {
      const threadMessages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = threadMessages.data.find(m => m.role === "assistant");
      const textContent = lastMessage?.content.find(c => c.type === "text");

      if (!textContent || textContent.type !== "text") {
        throw new Error("No valid text response found.");
      }

      return {
        text: textContent.text.value,
        threadId: thread.id, // ✅ return for frontend session
      };
    } else {
      throw new Error(`Run ended with status: ${runStatus.status}`);
    }
  } catch (err: any) {
    console.error("generateChatResponse error:", err);

    // Log specific details if available from OpenAI error
    if (err.status) console.error("Error status:", err.status);
    if (err.code) console.error("Error code:", err.code);
    if (err.param) console.error("Error param:", err.param);
    if (err.type) console.error("Error type:", err.type);
    if (err.message) console.error("Error message:", err.message);
    if (err.stack) console.error("Error stack:", err.stack);

    // Re-throw the error to be caught by the caller (e.g., the client component)
    throw err; 
  }
}
