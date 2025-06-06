import type { NextRequest } from "next/server"
import { OpenAI } from "openai"
import { generateChatResponse } from "@/app/actions/chat-actions"

// Increase timeout for streaming responses
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // Get request data
    const body = await req.json()
    const { messages, vectorRatio = 75, summaryLength = "none" } = body

    console.log("Chat API request received:", {
      messageCount: messages.length,
      vectorRatio,
      summaryLength,
    })

    // Generate the response using our chat actions
    const response = await generateChatResponse(messages)

    // Create a streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Split the response into chunks for streaming
          const chunks = response.split(/(?<=\.|\n)/)
          for (const chunk of chunks) {
            if (chunk.trim()) {
              controller.enqueue(encoder.encode(chunk))
              // Add a small delay between chunks for smoother streaming
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          }
        } catch (error) {
          console.error("Error in stream:", error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    // Return the streaming response
    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("Error in chat API:", error)

    // Provide more detailed error information
    const errorMessage = error.message || "Unknown error occurred"
    const errorStatus = error.status || 500

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: errorMessage,
        status: errorStatus,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
