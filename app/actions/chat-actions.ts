"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID!; // Re-adding Assistant ID

// Removed the systemMessage constant as we are using the Assistants API with its own instructions
// const systemMessage: { role: "system"; content: string } = { ... };

// Re-adding threadId parameter for thread management
export async function generateChatResponse(messages: any[], threadId?: string | null) {
  console.log("generateChatResponse called with threadId:", threadId);
  console.log("Using OpenAI Assistant with ID:", assistantId); // Log when the assistant is used
  try {
    // Ensure threadId is treated as undefined if it's null or an empty string
    const validThreadId = (threadId && threadId.trim() !== '') ? threadId : undefined;
    console.log("Valid threadId after check:", validThreadId);

    let thread;
    try {
      if (validThreadId) {
        console.log("Attempting to retrieve thread with ID:", validThreadId);
        thread = await openai.beta.threads.retrieve(validThreadId);
        console.log("Retrieved thread ID:", thread?.id); // Log the ID if it exists
      } else {
        console.log("No valid threadId provided, creating a new thread.");
        thread = await openai.beta.threads.create();
        console.log("Created new thread with ID:", thread?.id); // Log the ID if it exists
      }

      // Explicitly check if the obtained thread object and its ID are valid
      if (!thread || !thread.id || typeof thread.id !== 'string' || !thread.id.startsWith('thread_')) {
          const receivedThreadInfo = thread ? `ID: ${thread.id}, Type: ${typeof thread}, Object: ${JSON.stringify(thread)}` : 'null/undefined thread object';
          const errorMessage = `[CRITICAL_THREAD_ERROR] Failed to obtain a valid thread ID after operation. ValidThreadId was: ${validThreadId}. Received: ${receivedThreadInfo}`;
          console.error(errorMessage); // Also log this critical error
          throw new Error(errorMessage); // Throw a clear error with details
      }

    } catch (threadError: any) {
        console.error("Error during thread creation or retrieval:", threadError);
        const errorContext = `ValidThreadId: ${validThreadId || 'undefined (new thread attempt)'}`;
        // Re-throw with context in the message
        throw new Error(`[THREAD_OPERATION_FAILED] Thread operation failed [${errorContext}]: ${threadError.message || 'Unknown error'}`);
    }

    // Explicitly check thread.id BEFORE using it in subsequent calls
    if (!thread.id || typeof thread.id !== 'string' || !thread.id.startsWith('thread_')) {
        throw new Error(`[THREAD_ID_MISSING] Thread ID is missing or invalid before API calls. Thread object: ${JSON.stringify(thread)}`);
    }

    console.log("Using thread ID for OpenAI API calls:", thread.id);

    try {
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      if (!lastUserMessage) throw new Error("[MESSAGE_ERROR] No user message found in input.");

      // Use thread.id explicitly to add message
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: lastUserMessage.content,
      });

      // Use thread.id explicitly to create run
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });

      // Polling for run completion
      console.log("Polling for run completion...");
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (["queued", "in_progress"].includes(runStatus.status)) {
        await new Promise(res => setTimeout(res, 1000)); // Poll every 1 second
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
      console.log("Run completed with status:", runStatus.status);

      if (runStatus.status === "completed") {
        console.log("Retrieving messages from completed run...");
        // Retrieve messages added by the Assistant
        const threadMessages = await openai.beta.threads.messages.list(thread.id, { order: 'desc', limit: 1 }); // Get the last message
        const lastMessage = threadMessages.data.find(m => m.role === "assistant");
        const textContent = lastMessage?.content.find(c => c.type === "text");
        console.log("Last assistant message content type:", textContent?.type);

        if (!textContent || textContent.type !== "text") {
          console.warn("[NO_TEXT_CONTENT] No valid text response found in assistant message.", lastMessage);
           // Optionally delete the thread if no meaningful response was generated
           // await openai.beta.threads.del(thread.id);
           return {
            text: "No response from Assistant.", // Provide a default message
            threadId: thread.id, // Still return threadId even on no text content
           };
        }

        const assistantResponseText = textContent.text.value;
        console.log("Assistant response text found.");

        // Optionally delete the thread after getting the response if you don't need to keep it
        // await openai.beta.threads.del(thread.id);

        return {
          text: assistantResponseText,
          threadId: thread.id, // Return thread ID for frontend session
        };
      } else {
        // Handle other run statuses like 'failed', 'cancelled', etc.
        throw new Error(`[RUN_STATUS_ERROR] Assistant run ended with status: ${runStatus.status}`);
      }
    } catch (runOrMessageError: any) { // Catch errors during run or message operations
        console.error("Error during run or message operation:", runOrMessageError);
        const errorContext = `Thread ID: ${thread?.id || 'undefined'}`;
        // Re-throw with context in the message
        throw new Error(`[RUN_OPERATION_FAILED] Run or message operation failed [${errorContext}]: ${runOrMessageError.message || 'Unknown error'}`);
    }

  } catch (mainError: any) { // Main error catch for any uncaught errors
    console.error("generateChatResponse main error:", mainError);

    // Log specific details if available from OpenAI error
    if (mainError.status) console.error("Error status:", mainError.status);
    if (mainError.code) console.error("Error code:", mainError.code);
    if (mainError.param) console.error("Error param:", mainError.param);
    if (mainError.type) console.error("Error type:", mainError.type);
    if (mainError.message) console.error("Error message:", mainError.message);
    if (mainError.stack) console.error("Error stack:", mainError.stack);

    // Re-throw the error to be caught by the caller (e.g., the client component)
    throw mainError;
  }
}
