"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, X, ArrowLeft, StopCircle, Mic, ArrowUp, LogOut } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import type { Message } from "ai"
import Cookies from "js-cookie"


export default function TextOnlyChat() {
  const router = useRouter()
  const {
    messages,
    input,
    handleInputChange,
    handleStop,
    handleSubmit,
    isLoading,
  } = useChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayedContent, setDisplayedContent] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const [stoppedTypingId, setStoppedTypingId] = useState<string | null>(null)
  const [isAnyMessageTyping, setIsAnyMessageTyping] = useState(false)

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle typing animation
  useEffect(() => {
    let isTyping = false
    messages.forEach((message) => {
      if (message.role === "assistant" && !displayedContent[message.id] && !stoppedTypingId) {
        isTyping = true
        setIsTyping((prev) => ({ ...prev, [message.id]: true }))
        let currentText = ""
        const content = message.content
        const typingSpeed = 10 // Average typing speed in milliseconds per character (20 words per second)

        const typeText = () => {
          if (currentText.length < content.length && !stoppedTypingId) {
            currentText = content.slice(0, currentText.length + 1)
            setDisplayedContent((prev) => ({ ...prev, [message.id]: currentText }))
            setTimeout(typeText, typingSpeed)
          } else {
            setIsTyping((prev) => {
              const newTypingState = { ...prev, [message.id]: false }
              // Check if any message is still typing
              const anyTyping = Object.values(newTypingState).some(Boolean)
              setIsAnyMessageTyping(anyTyping)
              return newTypingState
            })
          }
        }

        typeText()
      }
    })
    setIsAnyMessageTyping(isTyping)
  }, [messages, stoppedTypingId])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStoppedTypingId(null)
    setIsAnyMessageTyping(true)
    await handleSubmit(e)

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleStopGeneration = () => {
    handleStop()
    setStoppedTypingId(messages[messages.length - 1]?.id || null)
  }

  const handleBack = () => {
    router.push("/chat")
  }

  const handleLogout = () => {
    Cookies.remove("isAuthenticated")
    router.push("/login")
  }

  return (
    <main className="flex flex-col h-screen bg-white text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between shadow-sm h-16">
        <div className="flex items-center gap-2 h-full">
          <img 
            src="/logo.svg" 
            alt="EOXS Logo" 
            className="h-[120px] w-[80px] object-contain -mt-2" 
          />
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="text-gray-200 bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to chat selection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-200 bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign out of your account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col bg-white mt-[73px]">
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                <div className="mb-4">
                  <span className="text-2xl font-bold text-eoxs-green">Welcome to Joe 2.0</span>
                </div>
                <div className="mb-2 text-base">How can I assist you with your steel industry needs today?</div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-eoxs-green text-black rounded-tr-none"
                          : "bg-white text-black rounded-tl-none border border-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs mb-1 ${
                              message.role === "user" ? "text-[#1B1212]" : "text-[#10a37f]"
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            {message.role === "user" ? "You" : "Joseph Malchar"}
                          </div>
                          <div className="text-base whitespace-pre-wrap break-words" style={{ color: "#2D3748" }}>
                            {message.role === "assistant" && isTyping[message.id]
                              ? displayedContent[message.id] || ""
                              : message.content}
                            {message.role === "assistant" && isTyping[message.id] && (
                              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="max-w-[85%] rounded-2xl p-3 shadow-sm bg-white text-black rounded-tl-none border border-gray-100">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs mb-1 text-[#10a37f]" style={{ fontWeight: 500 }}>
                            Joseph Malchar
                          </div>
                          <div className="flex items-center gap-2 text-sm" style={{ color: "#4A5568" }}>
                            <div className="animate-spin h-4 w-4 border-2 border-eoxs-green border-t-transparent rounded-full"></div>
                            <span>Joe is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading || isAnyMessageTyping}
                className="flex-1 bg-white text-gray-900 border-gray-200 placeholder-gray-500"
              />
              {/* Voice Button */}
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-100 active:scale-95 transition-transform duration-100 mr-2"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()} 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-gray-900 active:scale-95 transition-transform duration-100"
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              {(isLoading || isAnyMessageTyping) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 active:scale-95 transition-transform duration-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-eoxs-green"
                        aria-label="Stop generating"
                      >
                        <span className="block w-4 h-4 bg-white rounded-sm"></span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop generating</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  )
} 