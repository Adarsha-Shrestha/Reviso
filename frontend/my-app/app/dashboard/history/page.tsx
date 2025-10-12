"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, BookOpen, Calendar, Trophy, Clock } from "lucide-react"

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"quizzes" | "flashcards">("quizzes")

  const quizHistory = [
    {
      id: "1",
      topic: "Classification Algorithms",
      subject: "Data Mining",
      score: 95,
      questions: 10,
      date: "2025-01-08",
      duration: "12 min",
    },
    {
      id: "2",
      topic: "TCP/IP Protocol",
      subject: "Network Systems",
      score: 78,
      questions: 8,
      date: "2025-01-07",
      duration: "10 min",
    },
    {
      id: "3",
      topic: "Consensus Algorithms",
      subject: "Distributed Computing",
      score: 85,
      questions: 12,
      date: "2025-01-06",
      duration: "15 min",
    },
  ]

  const flashcardHistory = [
    {
      id: "1",
      topic: "Decision Trees",
      subject: "Data Mining",
      cardsReviewed: 25,
      date: "2025-01-08",
      duration: "18 min",
    },
    {
      id: "2",
      topic: "OSI Model",
      subject: "Network Systems",
      cardsReviewed: 15,
      date: "2025-01-07",
      duration: "12 min",
    },
    {
      id: "3",
      topic: "MapReduce",
      subject: "Distributed Computing",
      cardsReviewed: 20,
      date: "2025-01-06",
      duration: "15 min",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Study History</h1>
        <p className="text-muted-foreground">Review your past quizzes and flashcard sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "quizzes" ? "default" : "outline"}
          onClick={() => setActiveTab("quizzes")}
          className="flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Quizzes
        </Button>
        <Button
          variant={activeTab === "flashcards" ? "default" : "outline"}
          onClick={() => setActiveTab("flashcards")}
          className="flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Flashcards
        </Button>
      </div>

      {/* Quiz History */}
      {activeTab === "quizzes" && (
        <div className="space-y-4">
          {quizHistory.map((quiz) => (
            <Card key={quiz.id} className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{quiz.topic}</h3>
                      <p className="text-sm text-muted-foreground">{quiz.subject}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="w-4 h-4" />
                      <span>Score: {quiz.score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Brain className="w-4 h-4" />
                      <span>{quiz.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{quiz.date}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={quiz.score >= 90 ? "default" : quiz.score >= 70 ? "secondary" : "destructive"}>
                  {quiz.score >= 90 ? "Excellent" : quiz.score >= 70 ? "Good" : "Needs Work"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Flashcard History */}
      {activeTab === "flashcards" && (
        <div className="space-y-4">
          {flashcardHistory.map((session) => (
            <Card key={session.id} className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{session.topic}</h3>
                      <p className="text-sm text-muted-foreground">{session.subject}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{session.cardsReviewed} cards reviewed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{session.date}</span>
                    </div>
                  </div>
                </div>
                <Badge>Completed</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
