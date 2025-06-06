"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const assistantId = process.env.OPENAI_ASSISTANT_ID!; // No longer needed for direct chat completions

// Removed threadId parameter
export async function generateChatResponse(messages: any[]) {
  console.log("generateChatResponse called with messages:", messages.length);
  try {
    // Use Chat Completions API instead of Assistants API threads
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // You can change this to your desired model
      messages: messages,
      stream: false, // Set to true if you want to handle streaming
    });

    // Extract the assistant's message from the response
    const assistantMessageContent = completion.choices[0].message.content;

    if (!assistantMessageContent) {
      throw new Error("No content received from OpenAI chat completion.");
    }

    return {
      text: assistantMessageContent,
      // No threadId returned in this mode
    };

  } catch (err: any) { // Main error catch
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
