"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  Eye,
  Users,
  Volume2,
  BookOpen,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
} from "lucide-react"
import Link from "next/link"

const API_BASE = "http://localhost:8000/api"

interface ProctoringStatus {
  active: boolean
  time_remaining: number
}

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
}

interface Quiz {
  session_id: string
  questions: QuizQuestion[]
  subject?: string
  difficulty?: string
}

export default function ProctoredQuizPage() {
  const [username, setUsername] = useState("")
  const [quizStarted, setQuizStarted] = useState(false)
  const [proctoringActive, setProctoringActive] = useState(false)
  const [status, setStatus] = useState<ProctoringStatus | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [numQuestions, setNumQuestions] = useState(5)
  const videoRef = useRef<HTMLImageElement>(null)

  // Poll proctoring status
  useEffect(() => {
    if (!proctoringActive) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/proctoring/status`)
        const data = await response.json()
        setStatus(data)

        if (!data.active) {
          setProctoringActive(false)
          handleStopProctoring()
        }
      } catch (err) {
        console.error("[v0] Error fetching status:", err)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [proctoringActive])

  const handleStartQuiz = async () => {
    if (!username.trim()) {
      setError("Please enter your username")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Start proctoring
      const proctoringResponse = await fetch(`${API_BASE}/proctoring/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          exam_duration: 60, // 10 minutes
        }),
      })

      if (!proctoringResponse.ok) {
        throw new Error("Failed to start proctoring")
      }

      // Generate quiz
      const quizResponse = await fetch(`${API_BASE}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          subject: subject,
          num_questions: numQuestions,
        }),
      })

      if (!quizResponse.ok) {
        throw new Error("Failed to generate quiz")
      }

      const quizData = await quizResponse.json()
      
      // Handle the API response structure - quiz_data is the array of questions
      if (quizData.success && quizData.quiz_data) {
        setQuiz({
          session_id: quizData.quiz_id || "",
          questions: quizData.quiz_data,
        })
        setProctoringActive(true)
        setQuizStarted(true)
      } else {
        throw new Error("Invalid quiz data received")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz")
      console.error("[v0] Error starting quiz:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStopProctoring = async () => {
    try {
      await fetch(`${API_BASE}/proctoring/stop`, { method: "POST" })
      setProctoringActive(false)
    } catch (err) {
      console.error("[v0] Error stopping proctoring:", err)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer && quiz) {
      setAnswers({ ...answers, [currentQuestion]: selectedAnswer })
      setSelectedAnswer(null)

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      }
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quiz || !selectedAnswer) return

    const finalAnswers = { ...answers, [currentQuestion]: selectedAnswer }
    setLoading(true)

    try {
      // Calculate score locally by comparing answers with correct answers
      let correctCount = 0
      quiz.questions.forEach((question, index) => {
        const userAnswer = finalAnswers[index]
        if (userAnswer === question.correct_answer) {
          correctCount++
        }
      })

      const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100)
      setScore(calculatedScore)
      await handleStopProctoring()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz")
      console.error("[v0] Error submitting quiz:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (score !== null) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center bg-card border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-6">Your proctored session has ended</p>
            <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
            <p className="text-muted-foreground mb-8">Final Score</p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/quiz">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Quiz
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>Take Another Quiz</Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Link
            href="/quiz"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Quiz
          </Link>

          <Card className="p-8 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Proctored Quiz</h1>
                <p className="text-sm text-muted-foreground">AI-monitored exam session</p>
              </div>
            </div>

            <Alert className="mb-6 border-destructive/50 bg-destructive/5">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-foreground">
                This quiz is proctored. Your camera will monitor for cheating behaviors including eye movement, head
                turning, multiple people, books, phones, and audio. Please ensure you are in a quiet, well-lit room.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="mb-6 border-destructive bg-destructive/10">
                <XCircle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-foreground">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter Topic"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="DataMining">Data Mining</option>
                  <option value="Network">Network Systems</option>
                  <option value="Distributed">Distributed Computing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Number of Questions</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-2">Proctoring Features:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Eye tracking and gaze detection
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Multiple person detection
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio monitoring
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Unauthorized material detection
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Phone detection
                </li>
              </ul>
            </div>

            <Button onClick={handleStartQuiz} disabled={loading} className="w-full" size="lg">
              {loading ? "Starting..." : "Start Proctored Quiz"}
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center bg-card border-border">
            <p className="text-muted-foreground">Loading quiz...</p>
          </Card>
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header with Timer and Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
              Proctoring Active
            </Badge>
            {status && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(status.time_remaining)}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quiz Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <Progress value={progress} className="mb-6" />

              <h2 className="text-xl font-semibold text-foreground mb-6">{question.question}</h2>

              <div className="space-y-3 mb-6">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {selectedAnswer === option && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                {isLastQuestion ? (
                  <Button onClick={handleSubmitQuiz} disabled={!selectedAnswer || loading} size="lg">
                    {loading ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion} disabled={!selectedAnswer} size="lg">
                    Next Question
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Proctoring Feed */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-card border-border sticky top-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Live Proctoring
              </h3>

              <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                {proctoringActive && (
                  <img
                    ref={videoRef}
                    src={`${API_BASE}/proctoring/video_feed/${username}`}
                    alt="Proctoring feed"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    Eye Tracking
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Person Detection
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Volume2 className="w-3 h-3" />
                    Audio Monitor
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>

              <Alert className="mt-4 border-muted">
                <AlertDescription className="text-xs text-muted-foreground">
                  Stay focused on the screen. Violations will be recorded.
                </AlertDescription>
              </Alert>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}