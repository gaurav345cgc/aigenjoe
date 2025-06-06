"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()

  return (
    <main className="flex flex-col min-h-screen bg-white text-black">
      {/* Header */}
      <header className="w-full border-b border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between shadow-sm h-16">
        <div className="flex items-center gap-2 h-full">
          <img 
            src="/logo.svg" 
            alt="EOXS Logo" 
            className="h-[120px] w-[80px] object-contain -mt-2" 
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/chat")}
            className="text-gray-200 bg-gray-700 hover:bg-gray-600 border-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Chat
          </Button>
        </div>
      </header>

      {/* About Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#10a37f] mb-6">
              <img 
                src="/image.png" 
                alt="Joe Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl mb-4" style={{ color: "#1B1212", fontWeight: 700 }}>About Joe </h1>
            <p className="text-xl text-center max-w-2xl" style={{ color: "#4a5568" }}>
              Your Expert Steel Industry Advisor with 50+ years of hands-on experience
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
             
              <p className="mb-4" style={{ color: "#2d3748" }}>
                Howdy! I've spent 50+ years running melt shops, casting lines, and fixing problems before they hit the floor. From busted ladles to off-spec heats — I've been the guy they call.

Now I live in this little box, and I'm here to help you do the job right. Ask away — just what works.
              </p>
            </div>

           

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
              <h2 className="text-2xl mb-4" style={{ color: "#10a37f", fontWeight: 600 }}>Interactive Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2" style={{ color: "#1B1212", fontWeight: 600 }}>Text-Only Mode</h3>
                  <p style={{ color: "#4a5568" }}>
                    Quick, accurate answers for your technical questions with detailed explanations.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2" style={{ color: "#1B1212", fontWeight: 600 }}>Interactive Avatar</h3>
                  <p style={{ color: "#4a5568" }}>
                    Engage with Joe's virtual avatar for a more personal and interactive experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
              <h2 className="text-2xl mb-4" style={{ color: "#10a37f", fontWeight: 600 }}>Our Mission</h2>
              <p style={{ color: "#2d3748" }}>
                Our mission is to make expert steel industry knowledge accessible to everyone. 
                Whether you're a seasoned professional or new to the industry, Joe 2.0 is here to 
                help you make informed decisions and solve complex challenges in the world of steel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 