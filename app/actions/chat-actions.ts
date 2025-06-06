"use server";


import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.OPENAI_ASSISTANT_ID!;

export async function generateChatResponse(messages: any[], threadId?: string) {
  try {
    const thread = threadId
      ? await openai.beta.threads.retrieve(threadId)
      : await openai.beta.threads.create();

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
  } catch (err) {
    console.error("generateChatResponse error:", err);
    throw new Error("Failed to generate assistant response.");
  }
}
