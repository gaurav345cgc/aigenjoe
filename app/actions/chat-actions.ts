"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID!; // Re-added Assistant ID

// Removed the systemMessage constant
// const systemMessage: { role: "system"; content: string } = {
//   role: "system",
//   content: `You are Joseph Malchar, a seasoned expert in the steel industry. Your primary function is to provide accurate, concise, and helpful technical information related to steel grades, specifications, calculations, and industry standards. Respond in a knowledgeable, professional, and approachable manner, just as Joe would on the floor. Do not provide information outside of your expertise in the steel industry unless absolutely necessary for context. Keep responses focused and relevant to steel-related queries.`, // Add your specific persona details here
// };

// Added threadId parameter back
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
        console.log("Retrieved thread ID:", thread.id);
      } else {
        console.log("No valid threadId provided, creating a new thread.");
        thread = await openai.beta.threads.create();
        console.log("Created new thread with ID:", thread.id);
      }

      // Explicitly check if the obtained thread object and its ID are valid
      if (!thread || !thread.id || typeof thread.id !== 'string' || !thread.id.startsWith('thread_')) {
          const receivedThreadInfo = thread ? `ID: ${thread.id}, Object: ${JSON.stringify(thread)}` : 'null/undefined thread object';
          throw new Error(`[THREAD_ERROR] Invalid thread object obtained after operation. ValidThreadId was: ${validThreadId}. Received: ${receivedThreadInfo}`);
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
      if (!lastUserMessage) throw new Error("[MESSAGE_ERROR] No user message found.");

      // Use thread.id explicitly
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: lastUserMessage.content,
      });

      // Use thread.id explicitly
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });

      // Polling for run completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (["queued", "in_progress"].includes(runStatus.status)) {
        await new Promise(res => setTimeout(res, 1000)); // Poll every 1 second
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      if (runStatus.status === "completed") {
        const threadMessages = await openai.beta.threads.messages.list(thread.id, { order: 'desc', limit: 1 }); // Get the last message
        const lastMessage = threadMessages.data.find(m => m.role === "assistant");
        const textContent = lastMessage?.content.find(c => c.type === "text");

        if (!textContent || textContent.type !== "text") {
          // Return an empty string or a default message if no text content is found
           console.warn("No valid text response found in assistant message.", lastMessage);
           return {
            text: "",
            threadId: thread.id,
           };
        }

        return {
          text: textContent.text.value,
          threadId: thread.id, // Return thread ID for frontend session
        };
      } else {
        // Handle other run statuses like 'failed', 'cancelled', etc.
        throw new Error(`[RUN_STATUS_ERROR] Run ended with status: ${runStatus.status}`);
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
