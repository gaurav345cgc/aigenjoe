"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { useIsMobile } from "@/hooks/use-mobile"
import ChatMessage from "@/components/chat-message"
import StreamingAvatarComponent from "@/components/streaming-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Mic, MicOff, X, MessageSquare, Volume2, Bot, ArrowRight, ArrowLeft, Menu, StopCircle, ArrowUp, LogOut } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

type ChatMode = "text-only" | "avatar" | null

export default function ChatPage() {
  const { messages, input, handleInputChange, handleStop, handleSubmit, isLoading, lastCompletedAssistantMessage } =
    useChat()

  const isMobile = useIsMobile()
  const avatarRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messageDurations, setMessageDurations] = useState<Record<string, number>>({})
  const [stoppedTypingId, setStoppedTypingId] = useState<string | null>(null)
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null)
  const [triggerSyncId, setTriggerSyncId] = useState<string | null>(null)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showConversation, setShowConversation] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>(null)
  const [activeTab, setActiveTab] = useState<string>("avatar")
  const inputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowConversation(!isMobile)
    }
  }, [isMobile])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (hasInteracted && chatMode === "avatar" && avatarRef.current) {
      avatarRef.current.initialize()
    }
  }, [hasInteracted, chatMode])

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const speakMessage = async () => {
      if (lastCompletedAssistantMessage && avatarRef.current && chatMode === "avatar") {
        const messageId = lastCompletedAssistantMessage.id
        const text = lastCompletedAssistantMessage.content

        setTriggerSyncId(messageId)
        setCurrentlySpeakingId(messageId)

        const result = await avatarRef.current.speak(text)

        if (result?.duration_ms) {
          setMessageDurations((prev) => ({
            ...prev,
            [messageId]: result.duration_ms + 1000,
          }))
        }
      }
    }

    speakMessage()
  }, [lastCompletedAssistantMessage, chatMode])

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const toggleConversation = () => setShowConversation(!showConversation)

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hasInteracted) setHasInteracted(true)
    setCurrentlySpeakingId("pending")
    await handleSubmit(e)

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleStopResponse = () => {
    handleStop()
    if (avatarRef.current?.cancel && chatMode === "avatar") {
      avatarRef.current.cancel()
    }
    setStoppedTypingId(currentlySpeakingId)
    setCurrentlySpeakingId(null)
    setTriggerSyncId(null)
  }

  const handleModeSelection = (mode: ChatMode) => {
    if (mode === "text-only") {
      router.push("/chat/text-only")
    } else {
      setChatMode(mode)
      setHasInteracted(true)
    } 
  }

  const handleReset = () => {
    setHasInteracted(false)
    setChatMode(null)
    if (avatarRef.current?.cancel) {
      avatarRef.current.cancel()
    }
  }

  const handleLogout = () => {
    Cookies.remove("isAuthenticated")
    router.push("/login")
  }

  return (
    <main className="flex flex-col h-screen bg-white text-black">
      {/* Header */}
      <header className="w-full border-b border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between shadow-sm h-16">
        <div className="flex items-center gap-2 h-full">
          <img 
            src="/logo.svg" 
            alt="EOXS Logo" 
            className="h-[120px] w-[80px] object-contain -mt-2" 
          />
        </div>

        <div className="flex items-center gap-4">
          {(!hasInteracted || chatMode === null) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/about")}
              className="text-gray-200 bg-gray-700 hover:bg-gray-600 border-gray-600"
            >
              About
            </Button>
          )}
          {hasInteracted && chatMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="text-gray-200 bg-gray-700 hover:bg-gray-600 border-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Change Mode
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch between text and avatar modes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

      {/* Mode Selection Screen */}
      {!hasInteracted || chatMode === null ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-white">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl mb-2" style={{ color: "#1B1212", fontWeight: 700 }}>Welcome to Joe 2.0</h1>
              <h2 className="text-2xl" style={{ color: "#4A5568", fontWeight: 600 }}>I'll answer your questions — just like I did on the floor</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text-only Mode Card */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#10a37f] bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#f0f4f9] flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-[#10a37f]" />
                      </div>
                      <div>
                        <h3 className="text-lg" style={{ color: "#1B1212", fontWeight: 600 }}>Text-Only Mode</h3>
                        <p className="text-sm" style={{ color: "#4A5568" }}>
                          Fast, accurate answers for your steel questions.
                        </p>
                      </div>
                    </div>

                    <div className="h-40 flex items-center justify-center bg-[#f7f7f8] rounded-lg mb-4">
                      <div className="flex flex-col items-center">
                        <Bot className="h-16 w-16 text-[#10a37f]/30 mb-2" />
                        <div className="text-base" style={{ color: "#4A5568" }}>Instant technical support</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-6" style={{ color: "#4A5568" }}>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Steel grades, specs & calculations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Industry standards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Quick, reliable info</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setChatMode("text-only")
                        setHasInteracted(true)
                        router.push("/chat/text-only")
                      }}
                      className="w-full bg-[#10a37f] hover:bg-[#10a37f]/90 text-white"
                    >
                      Start Technical Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Avatar Mode Card */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#10a37f] bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#f0f4f9] flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-[#10a37f]" />
                      </div>
                      <div>
                        <h3 className="text-lg" style={{ color: "#1B1212", fontWeight: 600 }}>Interactive Mode</h3>
                        <p className="text-sm" style={{ color: "#4A5568" }}>
                          Real-time guidance with Joe's avatar.
                        </p>
                      </div>
                    </div>

                    <div className="h-40 flex items-center justify-center bg-[#f7f7f8] rounded-lg mb-4">
                      <div className="flex flex-col items-center">
                        <img src="/image.png" alt="Joe Avatar" className="h-16 w-16 rounded-full mb-2" />
                        <div className="text-base" style={{ color: "#4A5568" }}>Live expert advice</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-6" style={{ color: "#4A5568" }}>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Discuss complex topics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Visual explanations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f]"></span>
                        <span>Solve problems together</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setChatMode("avatar")
                        setHasInteracted(true)
                      }}
                      className="w-full bg-[#10a37f] hover:bg-[#10a37f]/90 text-white"
                    >
                      Start Interactive Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Avatar Section */}
          <div
            className={`flex flex-col items-center justify-center transition-all duration-300 w-full md:w-3/4 ${
              isMobile ? (showConversation ? "h-1/2" : "h-full") : "h-full"
            } bg-white`}
          >
            <div className="w-full h-full max-w-[1000px]">
              <StreamingAvatarComponent ref={avatarRef} />
            </div>

            {/* Toggle Chat Button (Mobile Only) */}
            {isMobile && (
              <div className="mt-auto p-2 w-full flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleConversation}
                  className="w-full text-sm bg-white border-gray-200 text-gray-900"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  {showConversation ? "Hide Chat" : "Show Chat"}
                </Button>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div
            className={`flex flex-col transition-all duration-300 ${
              isMobile
                ? showConversation
                  ? "h-1/2"
                  : "h-0"
                : "w-1/4 h-full"
            } border-l border-gray-200 bg-white`}
          >
            <div
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-3 space-y-4 ${
                isMobile && !showConversation ? "hidden" : ""
              }`}
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isSpeaking={currentlySpeakingId === message.id}
                  triggerSync={triggerSyncId === message.id}
                  durationMs={messageDurations[message.id]}
                  stopTypingSignal={stoppedTypingId === message.id}
                  mode="avatar"
                />
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
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className={`p-3 border-t ${
                "border-gray-200 bg-[#f7f7f8]"
              } flex gap-2`}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
                className={`flex-1 text-gray-900 bg-white border-gray-200 placeholder-gray-500`}
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
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-gray-900 active:scale-95 transition-transform duration-100"
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              {(currentlySpeakingId || isLoading) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleStopResponse}
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
      )}
    </main>
  )
}
