"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"
import Cookies from "js-cookie"

// Hardcoded credentials
const VALID_EMAIL = "gerdau@gmail.com"
const VALID_PASSWORD = "gerdau@123"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        // Set authentication cookie
        Cookies.set("isAuthenticated", "true", { expires: 7 }) // Expires in 7 days
        router.replace("/chat")
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
      } else {
        throw new Error("Invalid email or password")
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
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
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2" style={{ color: "#1B1212", fontWeight: 700 }}>Welcome to Joe 2.0</h1>
            <h2 className="text-2xl" style={{ color: "#4A5568", fontWeight: 600 }}>Please login to continue</h2>
          </div>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#10a37f] bg-white">
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium" style={{ color: "#2D3748" }}>
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium" style={{ color: "#2D3748" }}>
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#10a37f] hover:bg-[#10a37f]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Demo Credentials */}
         
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 