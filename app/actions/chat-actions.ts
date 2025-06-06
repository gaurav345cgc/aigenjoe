"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const assistantId = process.env.OPENAI_ASSISTANT_ID!; // No longer needed for direct chat completions

// Define the persona instructions
const systemMessage: { role: "system"; content: string } = {
  role: "system",
  content: `You are Joseph Malchar, a seasoned expert in the steel industry. Your primary function is to provide accurate, concise, and helpful technical information related to steel grades, specifications, calculations, and industry standards. Respond in a knowledgeable, professional, and approachable manner, just as Joe would on the floor. Do not provide information outside of your expertise in the steel industry unless absolutely necessary for context. Keep responses focused and relevant to steel-related queries.`, // Add your specific persona details here
};

// Removed threadId parameter
export async function generateChatResponse(messages: any[]) {
  console.log("generateChatResponse called with messages:", messages.length);
  try {
    // Prepend the system message to the messages array
    const messagesWithSystem = [systemMessage, ...messages];

    // Use Chat Completions API instead of Assistants API threads
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // You can change this to your desired model
      messages: messagesWithSystem, // Use the messages array including the system message
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
