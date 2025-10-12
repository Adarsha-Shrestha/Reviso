"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Brain, BookOpen, BarChart3, Upload, FolderOpen, LogOut, History } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard/chat" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Reviso</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/quiz">
                <Brain className="w-4 h-4 mr-2" />
                Quiz
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/flashcards">
                <BookOpen className="w-4 h-4 mr-2" />
                Flashcards
              </Link>
            </Button>
            
            {/* <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/history">
                <History className="w-4 h-4 mr-2" />
                History
              </Link>
            </Button> */}
            {/* <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Link>
            </Button> */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/documents">
                <FolderOpen className="w-4 h-4 mr-2" />
                Documents
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:block">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
