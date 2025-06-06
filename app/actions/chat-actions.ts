"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID!; // Assistant ID is still needed

// Removed the systemMessage constant (Assistants use their own instructions)

// Removed threadId parameter - server will always create a new thread
export async function generateChatResponse(messages: any[]) {
  console.log("generateChatResponse called (new thread per request)");
  console.log("Using OpenAI Assistant with ID:", assistantId);
  try {
    // Always create a new thread for each request
    console.log("Creating a new thread...");
    const thread = await openai.beta.threads.create();
    console.log("Created new thread with ID:", thread.id);

    // Explicitly check if the obtained thread object and its ID are valid
    if (!thread || !thread.id || typeof thread.id !== 'string' || !thread.id.startsWith('thread_')) {
        const receivedThreadInfo = thread ? `ID: ${thread.id}, Object: ${JSON.stringify(thread)}` : 'null/undefined thread object';
        throw new Error(`[THREAD_ERROR] Invalid thread object obtained after creation. Received: ${receivedThreadInfo}`);
    }

    // Get the last user message from the provided messages array
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) throw new Error("[MESSAGE_ERROR] No user message found in input.");

    console.log("Adding user message to thread:", lastUserMessage.content);
    // Add the user message to the newly created thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: lastUserMessage.content,
    });
    console.log("User message added.");

    console.log("Running the Assistant on the thread...");
    // Run the Assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    console.log("Run created with ID:", run.id);

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
        console.warn("No valid text response found in assistant message.", lastMessage);
         // Optionally delete the thread if no meaningful response was generated
         // await openai.beta.threads.del(thread.id);
         return {
          text: "No response from Assistant.", // Provide a default message
         };
      }

      const assistantResponseText = textContent.text.value;
      console.log("Assistant response text found.");

      // Optionally delete the thread after getting the response if you don't need to keep it
      // await openai.beta.threads.del(thread.id);

      return {
        text: assistantResponseText,
        // No threadId returned as it's not managed by client
      };
    } else {
      // Handle other run statuses like 'failed', 'cancelled', etc.
      throw new Error(`[RUN_STATUS_ERROR] Assistant run ended with status: ${runStatus.status}`);
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
