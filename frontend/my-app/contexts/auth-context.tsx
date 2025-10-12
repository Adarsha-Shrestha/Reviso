"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  user: { username: string } | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for existing session on mount
    checkSession()
  }, [])

  useEffect(() => {
    // Redirect logic based on auth state
    if (!isLoading) {
      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route))
      
      if (isAuthenticated && pathname === "/login") {
        // Redirect authenticated users away from login page
        router.push("/dashboard/chat")
      } else if (!isAuthenticated && isProtectedRoute) {
        // Redirect unauthenticated users to login
        router.push("/login")
      }
    }
  }, [isAuthenticated, pathname, isLoading, router])

  const checkSession = () => {
    try {
      const storedUser = localStorage.getItem("Reviso_user")
      const sessionExpiry = localStorage.getItem("Reviso_session_expiry")
      
      if (storedUser && sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10)
        const currentTime = Date.now()
        
        // Check if session is still valid (7 days)
        if (currentTime < expiryTime) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          // Session expired, clear storage
          clearSession()
        }
      }
    } catch (error) {
      console.error("Error checking session:", error)
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = () => {
    localStorage.removeItem("Reviso_user")
    localStorage.removeItem("Reviso_session_expiry")
    setUser(null)
    setIsAuthenticated(false)
  }

  const login = (username: string, password: string) => {
    // Simple credential check - in production, this would be an API call
    if (username === "student" && password === "password123") {
      const userData = { username }
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      
      setUser(userData)
      setIsAuthenticated(true)
      
      // Store user data and session expiry
      localStorage.setItem("Reviso_user", JSON.stringify(userData))
      localStorage.setItem("Reviso_session_expiry", expiryTime.toString())
      
      return true
    }
    return false
  }

  const logout = () => {
    clearSession()
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}