"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Loader2, Trophy, Clock, BarChart3, Calendar, Download, TrendingUp, Award, Target, Repeat, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  difficulty: string
}

interface QuestionAttempt {
  question: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent: number
  explanation: string
}

interface QuizHistory {
  id: string
  quizId: string
  topic: string
  subject: string
  numQuestions: number
  score: number
  percentage: number
  date: string
  duration: number
  questions: QuestionAttempt[]
  difficulty: string
  originalQuestions: QuizQuestion[]
}

type QuizState = "setup" | "taking" | "results" | "history"

export default function QuizPage() {
  const [state, setState] = useState<QuizState>("setup")
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("")
  const [numQuestions, setNumQuestions] = useState("5")
  const [isLoading, setIsLoading] = useState(false)
  const [quizId, setQuizId] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [questionAttempts, setQuestionAttempts] = useState<QuestionAttempt[]>([])
  const [score, setScore] = useState(0)
  const [quizStartTime, setQuizStartTime] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [historyFilter, setHistoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const saved = localStorage.getItem("quizHistory")
    if (saved) {
      try {
        setQuizHistory(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading quiz history:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (state === "taking" && quizStartTime > 0) {
      const timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - quizStartTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [state, quizStartTime])

  const saveToHistory = (historyItem: QuizHistory) => {
    const updated = [historyItem, ...quizHistory]
    setQuizHistory(updated)
    localStorage.setItem("quizHistory", JSON.stringify(updated))
  }

  const toggleQuizExpansion = (quizId: string) => {
    const newExpanded = new Set(expandedQuizzes)
    if (newExpanded.has(quizId)) {
      newExpanded.delete(quizId)
    } else {
      newExpanded.add(quizId)
    }
    setExpandedQuizzes(newExpanded)
  }

  const generateQuiz = async () => {
    if (!topic.trim()) return
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject: subject || undefined,
          num_questions: Number.parseInt(numQuestions),
        }),
      })
      const data = await response.json()
      if (data.success) {
        setQuizId(data.quiz_id)
        setQuestions(data.quiz_data)
        setState("taking")
        setCurrentQuestion(0)
        setQuestionAttempts([])
        setScore(0)
        setQuizStartTime(Date.now())
        setQuestionStartTime(Date.now())
        setShowFeedback(false)
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
      alert("Failed to generate quiz. Make sure the backend is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = () => {
    if (!selectedAnswer) return
    const current = questions[currentQuestion]
    const isCorrect = selectedAnswer === current.correct_answer
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const attempt: QuestionAttempt = {
      question: current.question,
      selectedAnswer,
      correctAnswer: current.correct_answer,
      isCorrect,
      timeSpent,
      explanation: current.explanation,
    }
    const updatedAttempts = [...questionAttempts, attempt]
    setQuestionAttempts(updatedAttempts)
    setIsCorrectAnswer(isCorrect)
    setShowFeedback(true)
    if (isCorrect) {
      setScore(score + 1)
    }
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer("")
        setQuestionStartTime(Date.now())
        setShowFeedback(false)
      } else {
        finishQuiz(updatedAttempts, isCorrect ? score + 1 : score)
      }
    }, 2500)
  }

  const finishQuiz = (attempts: QuestionAttempt[], finalScore: number) => {
    const duration = Math.floor((Date.now() - quizStartTime) / 1000)
    const percentage = Math.round((finalScore / questions.length) * 100)
    const historyItem: QuizHistory = {
      id: Date.now().toString(),
      quizId,
      topic,
      subject: subject || "All Subjects",
      numQuestions: questions.length,
      score: finalScore,
      percentage,
      date: new Date().toISOString(),
      duration,
      questions: attempts,
      difficulty: questions[0]?.difficulty || "Medium",
      originalQuestions: questions,
    }
    saveToHistory(historyItem)
    setState("results")
  }

  const resetQuiz = () => {
    setState("setup")
    setTopic("")
    setSubject("")
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer("")
    setQuestionAttempts([])
    setScore(0)
    setShowFeedback(false)
  }

  const retakeQuiz = (historyItem: QuizHistory) => {
    setTopic(historyItem.topic)
    setSubject(historyItem.subject)
    setNumQuestions(historyItem.numQuestions.toString())
    setState("setup")
  }

  const exportHistory = () => {
    const dataStr = JSON.stringify(quizHistory, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `quiz-history-${new Date().toISOString().split('T')[0]}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const deleteHistory = (id: string) => {
    const updated = quizHistory.filter(h => h.id !== id)
    setQuizHistory(updated)
    localStorage.setItem("quizHistory", JSON.stringify(updated))
  }

  const stats = {
    totalQuizzes: quizHistory.length,
    averageScore: quizHistory.length > 0 
      ? Math.round(quizHistory.reduce((acc, h) => acc + h.percentage, 0) / quizHistory.length)
      : 0,
    totalQuestions: quizHistory.reduce((acc, h) => acc + h.numQuestions, 0),
    totalTime: Math.floor(quizHistory.reduce((acc, h) => acc + h.duration, 0) / 60),
    bestScore: quizHistory.length > 0 ? Math.max(...quizHistory.map(h => h.percentage)) : 0,
  }

  const filteredHistory = quizHistory
    .filter(h => historyFilter === "all" || h.subject === historyFilter)
    .filter(h => h.topic.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index)

  if (state === "history") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quiz History</h1>
            <p className="text-muted-foreground">Track your progress and review past quizzes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportHistory}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setState("setup")}>
              Back to Quiz
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <Trophy className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
            <div className="text-xs text-muted-foreground">Total Quizzes</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <Target className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.averageScore}%</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <Award className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.bestScore}%</div>
            <div className="text-xs text-muted-foreground">Best Score</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <Brain className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <Clock className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.totalTime}</div>
            <div className="text-xs text-muted-foreground">Total Minutes</div>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={historyFilter} onValueChange={setHistoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="DataMining">Data Mining</SelectItem>
              <SelectItem value="Network">Network Systems</SelectItem>
              <SelectItem value="Distributed">Distributed Computing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No quiz history found</h3>
              <p className="text-muted-foreground mb-4">Start taking quizzes to build your history</p>
              <Button onClick={() => setState("setup")}>Create Your First Quiz</Button>
            </Card>
          ) : (
            filteredHistory.map((item) => {
              const isExpanded = expandedQuizzes.has(item.id)
              return (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{item.topic}</h3>
                          <Badge variant={item.percentage >= 70 ? "default" : item.percentage >= 40 ? "secondary" : "destructive"}>
                            {item.percentage}%
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            {item.subject}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {item.score}/{item.numQuestions} correct
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(item.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => retakeQuiz(item)}>
                          <Repeat className="w-4 h-4 mr-2" />
                          Retake
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteHistory(item.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleQuizExpansion(item.id)}
                      className="w-full mt-2 flex items-center justify-center gap-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show Details
                        </>
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                      {item.questions.map((q, qIdx) => {
                        const originalQuestion = item.originalQuestions?.[qIdx]
                        return (
                          <div key={qIdx} className={`p-4 rounded-lg border-2 ${q.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                            <div className="flex items-start gap-3 mb-4">
                              {q.isCorrect ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-bold text-foreground">Question {qIdx + 1}</span>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {q.timeSpent}s
                                  </Badge>
                                  <Badge variant={q.isCorrect ? "default" : "destructive"} className="text-xs">
                                    {q.isCorrect ? "Correct" : "Incorrect"}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium text-foreground mb-3">{q.question}</p>
                              </div>
                            </div>
                            
                            <div className="ml-9 space-y-2 mb-4">
                              {originalQuestion ? (
                                originalQuestion.options.map((option, optIdx) => {
                                  const optionLetter = getOptionLetter(optIdx)
                                  const isUserAnswer = q.selectedAnswer === optionLetter
                                  const isCorrectOption = q.correctAnswer === optionLetter
                                  return (
                                    <div 
                                      key={optIdx}
                                      className={`p-3 rounded-lg border-2 transition-all ${
                                        isCorrectOption ? 'border-green-500 bg-green-500/10 shadow-sm' :
                                        isUserAnswer && !isCorrectOption ? 'border-red-500 bg-red-500/10 shadow-sm' :
                                        'border-border bg-muted/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-sm ${
                                          isCorrectOption ? 'text-green-500' :
                                          isUserAnswer ? 'text-red-500' :
                                          'text-muted-foreground'
                                        }`}>
                                          {optionLetter}.
                                        </span>
                                        <span className={`flex-1 text-sm ${
                                          isCorrectOption || isUserAnswer ? 'font-medium text-foreground' : 'text-muted-foreground'
                                        }`}>
                                          {option}
                                        </span>
                                        {isCorrectOption && (
                                          <div className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Correct
                                          </div>
                                        )}
                                        {isUserAnswer && !isCorrectOption && (
                                          <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                                            <XCircle className="w-4 h-4" />
                                            Your Answer
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <>
                                  <div className={`p-3 rounded-lg border-2 ${q.selectedAnswer === q.correctAnswer ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                                    <div className="text-sm">
                                      <span className="font-semibold">Your answer: </span>
                                      <span className={q.isCorrect ? "text-green-500" : "text-red-500"}>{q.selectedAnswer}</span>
                                    </div>
                                  </div>
                                  {!q.isCorrect && (
                                    <div className="p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                                      <div className="text-sm">
                                        <span className="font-semibold">Correct answer: </span>
                                        <span className="text-green-500">{q.correctAnswer}</span>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <div className="ml-9 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-500 font-medium text-sm">💡</span>
                                <div>
                                  <span className="text-blue-500 font-medium text-sm">Explanation: </span>
                                  <p className="text-foreground text-sm mt-1">{q.explanation}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>
    )
  }

  if (state === "results") {
    const percentage = Math.round((score / questions.length) * 100)
    const lastQuiz = quizHistory[0]

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2 mb-6">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>

          <h2 className="text-4xl font-bold text-foreground mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-8">Excellent work on finishing the quiz</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-card rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <div className="text-3xl font-bold text-foreground mb-1">{score}/{questions.length}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 bg-card rounded-lg">
              <div className="text-3xl font-bold text-foreground mb-1">{formatDuration(lastQuiz?.duration || 0)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>

          <div className="text-lg text-muted-foreground mb-8">
            {percentage >= 90 ? "🎉 Outstanding! You're a master!" :
             percentage >= 70 ? "👏 Great job! Very impressive!" :
             percentage >= 50 ? "👍 Good work! Keep it up!" :
             "💪 Keep practicing! You'll improve!"}
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={resetQuiz} variant="outline" size="lg">
              <Brain className="w-5 h-5 mr-2" />
              New Quiz
            </Button>
            <Button onClick={() => setState("history")} size="lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              View History
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Question Review
          </h3>
          <div className="space-y-6">
            {questionAttempts.map((attempt, index) => {
              const question = questions[index]
              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${attempt.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {attempt.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-foreground">Question {index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {attempt.timeSpent}s
                        </Badge>
                        <Badge variant={attempt.isCorrect ? "default" : "destructive"} className="text-xs">
                          {attempt.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-3">{attempt.question}</p>
                    </div>
                  </div>
                  
                  <div className="ml-9 space-y-2 mb-4">
                    {question.options.map((option, optIdx) => {
                      const optionLetter = String.fromCharCode(65 + optIdx)
                      const isUserAnswer = attempt.selectedAnswer === optionLetter
                      const isCorrectOption = attempt.correctAnswer === optionLetter
                      return (
                        <div 
                          key={optIdx}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isCorrectOption ? 'border-green-500 bg-green-500/10 shadow-sm' :
                            isUserAnswer && !isCorrectOption ? 'border-red-500 bg-red-500/10 shadow-sm' :
                            'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${
                              isCorrectOption ? 'text-green-500' :
                              isUserAnswer ? 'text-red-500' :
                              'text-muted-foreground'
                            }`}>
                              {optionLetter}.
                            </span>
                            <span className={`flex-1 text-sm ${
                              isCorrectOption || isUserAnswer ? 'font-medium text-foreground' : 'text-muted-foreground'
                            }`}>
                              {option}
                            </span>
                            {isCorrectOption && (
                              <div className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Correct
                              </div>
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                                <XCircle className="w-4 h-4" />
                                Your Answer
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="ml-9 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 font-medium text-sm">💡</span>
                      <div>
                        <span className="text-blue-500 font-medium text-sm">Explanation: </span>
                        <p className="text-foreground text-sm mt-1">{attempt.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    )
  }

  if (state === "taking") {
    const current = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Score: {score}/{currentQuestion}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(currentTime)}
              </Badge>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="p-8 bg-card border-2 border-border">
          <div className="mb-6">
            <Badge className="mb-4">{current.difficulty}</Badge>
            <h3 className="text-2xl font-semibold text-foreground leading-relaxed mb-6">
              {current.question}
            </h3>
          </div>

          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={setSelectedAnswer}
            disabled={showFeedback}
          >
            <div className="space-y-3">
              {current.options.map((option: string, index: number) => {
                const optionLetter = String.fromCharCode(65 + index)
                const isSelected = selectedAnswer === optionLetter
                const isCorrect = optionLetter === current.correct_answer
                const showCorrect = showFeedback && isCorrect
                const showWrong = showFeedback && isSelected && !isCorrect

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-5 rounded-lg border-2 transition-all cursor-pointer
                      ${showCorrect ? 'border-green-500 bg-green-500/10 animate-pulse' :
                        showWrong ? 'border-red-500 bg-red-500/10' :
                        isSelected ? 'border-primary bg-primary/5' :
                        'border-border hover:bg-muted/50 hover:border-primary/50'}`}
                  >
                    <RadioGroupItem value={optionLetter} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer font-medium flex items-center gap-2"
                    >
                      <span className="text-muted-foreground">{optionLetter}.</span>
                      {option}
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                    </Label>
                  </div>
                )
              })}
            </div>
          </RadioGroup>

          {showFeedback && (
            <Alert className={`mt-6 ${isCorrectAnswer ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
              {isCorrectAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <AlertDescription className="text-foreground font-medium">
                {isCorrectAnswer ? "✨ Correct! Well done!" : "❌ Incorrect. The correct answer is highlighted above."}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={submitAnswer} 
            disabled={!selectedAnswer || showFeedback} 
            className="w-full mt-6" 
            size="lg"
          >
            {showFeedback ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading next question...
              </>
            ) : currentQuestion < questions.length - 1 ? (
              "Submit Answer"
            ) : (
              "Finish Quiz"
            )}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quiz Generator</h1>
          <p className="text-muted-foreground">Create a custom quiz on any topic</p>
        </div>

        {quizHistory.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="text-center">
                <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
                <div className="text-xs text-muted-foreground">Quizzes Taken</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
              <div className="text-center">
                <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.bestScore}%</div>
                <div className="text-xs text-muted-foreground">Best Score</div>
              </div>
            </Card>
          </div>
        )}

        <Card className="p-8 bg-card border-border mb-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Decision Trees, TCP/IP, MapReduce"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DataMining">Data Mining</SelectItem>
                  <SelectItem value="Network">Network Systems</SelectItem>
                  <SelectItem value="Distributed">Distributed Computing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions</SelectItem>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateQuiz} disabled={isLoading || !topic.trim()} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quiz History
            </h3>
            {quizHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setState("history")}>
                View All
              </Button>
            )}
          </div>

          {quizHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No quizzes taken yet. Start your first quiz above!
            </p>
          ) : (
            <div className="space-y-3">
              {quizHistory.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => retakeQuiz(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{item.topic}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{item.subject}</span>
                      <span>•</span>
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.percentage >= 70 ? "default" : item.percentage >= 40 ? "secondary" : "destructive"}>
                      {item.percentage}%
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Repeat className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}