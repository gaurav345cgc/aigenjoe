// Function to split text into chunks of roughly equal size
export function splitTextIntoChunks(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = []

  // Simple splitting by paragraphs first
  const paragraphs = text.split(/\n\s*\n/)

  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = ""
    }

    // If a single paragraph is too large, split it by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/)

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = ""
        }

        currentChunk += sentence + " "
      }
    } else {
      currentChunk += paragraph + "\n\n"
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  // If no chunks were created (e.g., very short text), return the original text as a single chunk
  if (chunks.length === 0 && text.trim().length > 0) {
    return [text.trim()]
  }

  return chunks
}

// Function to clean and normalize text
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/\n+/g, "\n") // Replace multiple newlines with a single newline
    .trim() // Remove leading/trailing whitespace
}

// Function to extract text from different file types
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  // Plain text files
  if (fileType.includes("text/plain") || fileName.endsWith(".txt")) {
    return await file.text()
  }

  // JSON files
  if (fileType.includes("application/json") || fileName.endsWith(".json")) {
    const jsonText = await file.text()
    try {
      const jsonData = JSON.parse(jsonText)
      return JSON.stringify(jsonData, null, 2)
    } catch (e) {
      return jsonText
    }
  }

  // CSV files
  if (fileType.includes("text/csv") || fileName.endsWith(".csv")) {
    return await file.text()
  }

  // For PDF, DOCX, etc. we would need server-side processing
  // For now, just return text for supported formats
  if (
    fileType.includes("application/pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    fileName.endsWith(".docx")
  ) {
    return "This file type requires server-side processing. Please upload as plain text if possible."
  }

  // Default fallback
  try {
    return await file.text()
  } catch (e) {
    return "Could not extract text from this file type."
  }
}
