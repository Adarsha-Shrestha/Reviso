"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, Loader2, BookOpen, Plus, MessageSquare, MoreVertical, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const API_BASE_URL = "http://localhost:8000/api/chat"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: Array<{ page_content: string; metadata: any }>
  isConversational?: boolean
}

interface Session {
  session_id: string
  message_count: number
  created: string | null
  subject?: string
  title?: string
  preview?: string
}

interface ChatSession {
  session_id: string
  messages: Message[]
}

// Friendly labels for display
const SUBJECT_LABELS: Record<string, string> = {
  "All Subjects": "All Subjects",
  Network: "Network Systems",
  DataMining: "Data Mining",
  Distributed: "Distributed Computing",
}

const STORAGE_KEY = "chat_sessions"
const CHAT_HISTORY_KEY = "chat_history"

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [subject, setSubject] = useState<string>("All Subjects")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load sessions and chat history from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadSessionsFromStorage()
      loadChatHistoryFromStorage()
    }
  }, [])

  // Save sessions to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && sessions.length > 0) {
      saveSessionsToStorage()
    }
  }, [sessions])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(chatHistory).length > 0) {
      saveChatHistoryToStorage()
    }
  }, [chatHistory])

  // Save current session messages to chat history whenever messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setChatHistory(prev => ({
        ...prev,
        [currentSessionId]: messages
      }))
    }
  }, [messages, currentSessionId])

  const loadSessionsFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSessions = JSON.parse(stored)
        setSessions(parsedSessions)
      }
    } catch (error) {
      console.error("Error loading sessions from localStorage:", error)
    }
  }

  const saveSessionsToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving sessions to localStorage:", error)
    }
  }

  const loadChatHistoryFromStorage = () => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY)
      if (stored) {
        const parsedHistory = JSON.parse(stored)
        setChatHistory(parsedHistory)
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error)
    }
  }

  const saveChatHistoryToStorage = () => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory))
    } catch (error) {
      console.error("Error saving chat history to localStorage:", error)
    }
  }

  const createNewSession = async (newSubject?: string): Promise<string | null> => {
    try {
      const chosenSubject = newSubject || subject || "All Subjects"

      const response = await fetch(`${API_BASE_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: chosenSubject }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`)
      }
      
      const data = await response.json()

      const newSession: Session = {
        session_id: data.session_id,
        message_count: 0,
        created: new Date().toISOString(),
        subject: chosenSubject,
        title: SUBJECT_LABELS[chosenSubject] || chosenSubject,
        preview: "New conversation"
      }

      setCurrentSessionId(data.session_id)
      setMessages([])
      setSubject(chosenSubject)
      setSessions((prev) => [newSession, ...prev])

      // Initialize empty chat history for new session
      setChatHistory(prev => ({
        ...prev,
        [data.session_id]: []
      }))

      return data.session_id
    } catch (error) {
      console.error("Error creating session:", error)
      alert("Failed to create session. Please make sure the backend is running.")
      return null
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      // First check if we have the chat history in localStorage
      if (chatHistory[sessionId] && chatHistory[sessionId].length > 0) {
        setCurrentSessionId(sessionId)
        setMessages(chatHistory[sessionId])
        
        const session = sessions.find((s) => s.session_id === sessionId)
        if (session?.subject) setSubject(session.subject)
        return
      }

      // If not in localStorage, try to fetch from backend
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`)
      }
      
      const data: ChatSession = await response.json()

      setCurrentSessionId(sessionId)
      const loadedMessages = data.messages || []
      setMessages(loadedMessages)

      // Store the loaded messages in chat history
      setChatHistory(prev => ({
        ...prev,
        [sessionId]: loadedMessages
      }))

      const session = sessions.find((s) => s.session_id === sessionId)
      if (session?.subject) setSubject(session.subject)
    } catch (error) {
      console.error("Error loading session:", error)
      alert("Failed to load session. It may have been deleted from the backend.")
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE_URL}/session/${sessionId}`, { method: "DELETE" })

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
        setMessages([])
        setSubject("All Subjects")
      }

      // Remove from sessions list
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))

      // Remove from chat history
      setChatHistory(prev => {
        const newHistory = { ...prev }
        delete newHistory[sessionId]
        return newHistory
      })

      // Update localStorage immediately
      if (typeof window !== 'undefined') {
        const updatedHistory = { ...chatHistory }
        delete updatedHistory[sessionId]
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory))
      }
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const handleSubjectChange = async (newSubject: string) => {
    if (messages.length > 0) {
      await createNewSession(newSubject)
    } else {
      setSubject(newSubject)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = await createNewSession()
      if (!sessionId) return
    }

    const userMessage: Message = { role: "user", content: input, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    
    const userInput = input
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userInput,
          subject: subject === "All Subjects" ? undefined : subject,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.generation || "No response generated.",
        timestamp: new Date().toISOString(),
        sources: data.sources || [],
        isConversational: data.is_conversational,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Update session with title and preview
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId
            ? {
                ...s,
                subject: subject,
                title: SUBJECT_LABELS[subject] || subject,
                preview: messages.length === 0 ? userInput : s.preview,
                message_count: s.message_count + 2
              }
            : s
        )
      )
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please make sure the backend is running on http://localhost:8000",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getSessionTitle = (session: Session) => {
    return session.title || SUBJECT_LABELS[session.subject || ""] || "New Chat"
  }

  const getSessionPreview = (session: Session) => {
    // Try to get preview from chat history
    if (chatHistory[session.session_id] && chatHistory[session.session_id].length > 0) {
      const firstUserMessage = chatHistory[session.session_id].find(msg => msg.role === "user")
      if (firstUserMessage) {
        return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
      }
    }
    return session.preview || "No messages yet"
  }

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-border bg-card flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-border">
          <Button onClick={() => createNewSession()} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              className={`group flex items-center gap-2 p-3 rounded-lg mb-1 cursor-pointer hover:bg-accent ${
                currentSessionId === session.session_id ? "bg-accent" : ""
              }`}
              onClick={() => loadSession(session.session_id)}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getSessionTitle(session)}</p>
                <p className="text-xs text-muted-foreground truncate">{getSessionPreview(session)}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.session_id)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold text-foreground">AI Chat Assistant</h2>
          </div>
          <Select value={subject} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Subjects">All Subjects</SelectItem>
              <SelectItem value="DataMining">Data Mining</SelectItem>
              <SelectItem value="Network">Network Systems</SelectItem>
              <SelectItem value="Distributed">Distributed Computing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ask me anything</h2>
                <p className="text-muted-foreground leading-relaxed">
                  I can help you understand concepts from your course materials using advanced retrieval-augmented generation.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Current subject: <span className="font-medium text-foreground">{SUBJECT_LABELS[subject]}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <BookOpen className="w-3 h-3" />
                          <span>Sources ({message.sources.length})</span>
                        </div>
                        <div className="space-y-2">
                          {message.sources.slice(0, 2).map((source, idx) => (
                            <div key={idx} className="text-xs bg-muted/50 p-2 rounded">
                              <p className="line-clamp-2">{source.page_content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="p-4 bg-card">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
              placeholder="Ask a question about your course materials..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}