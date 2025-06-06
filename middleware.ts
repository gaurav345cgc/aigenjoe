import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get("isAuthenticated")
  const isLoginPage = request.nextUrl.pathname === "/login"

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && !isLoginPage) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    // Add cache control headers to prevent browser caching
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }

  // If user is authenticated and trying to access login page
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // For protected routes, add cache control headers
  if (!isLoginPage) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/about", "/login"],
} 