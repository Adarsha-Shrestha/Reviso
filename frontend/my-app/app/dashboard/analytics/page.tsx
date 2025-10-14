"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, Trophy, BookOpen, Brain, TrendingUp, Target, 
  MessageSquare, Calendar, Award, BarChart3, Flame,
  RefreshCw, ChevronRight, Zap, Star, TrendingDown,
  CheckCircle2, XCircle, FileText, Upload, Download,
  Activity, AlertCircle, BookMarked, Timer, LineChart,
  Shield, Camera, Eye, PieChart, Users, Lightbulb
} from "lucide-react"

// Type Definitions
interface QuizHistory {
  date: string
  topic: string
  subject: string
  percentage: number
  score: number
  numQuestions: number
  duration: number
}

interface FlashcardSet {
  createdAt: string
  topic: string
  subject: string
  cards: Array<{ front: string; back: string }>
}

interface ChatSession {
  created: string
  subject?: string
  message_count?: number
}

interface DocumentHistory {
  uploadDate: string
  title: string
  subject: string
}

interface SubmittedExam {
  session_id: string
  exam_id: string
  topic: string
  subject: string
  total_questions: number
  total_marks: number
  submitted_at: string
  answers: Array<{
    question_number: number
    answer: string
  }>
}

interface QuestionEvaluation {
  question_number: number
  score: number
  max_marks: number
  feedback: string
  strengths?: string[]
  improvements?: string[]
  key_points_covered?: string[]
  key_points_missed?: string[]
}

interface EvaluationData {
  session_id: string
  exam_id: string
  topic: string
  subject: string
  total_score: number
  total_max_marks: number
  percentage: number
  questions_evaluated: number
  evaluated_at: string
  overall_feedback: string
  evaluations: QuestionEvaluation[]
}

interface SubjectPerformance {
  total: number
  count: number
  correct: number
  incorrect: number
  totalMarks: number
  maxMarks: number
}

interface SubjectStats {
  subject: string
  average: number
  count: number
  correct: number
  incorrect: number
  accuracy: number
  totalMarks: number
  maxMarks: number
}

interface DayActivity {
  date: string
  quizzes: number
  exams: number
  avgScore: number
  flashcards: number
  chats: number
}

interface ActivityItem {
  type: string
  title: string
  subtitle: string
  date: string
  icon: React.ComponentType<any>
  score?: number
  color: string
}

export default function AnalyticsDashboard() {
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([])
  const [submittedExams, setSubmittedExams] = useState<SubmittedExam[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("week")

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = () => {
    setLoading(true)
    try {
      // Load Quiz History
      const quizData = localStorage.getItem("quizHistory")
      setQuizHistory(quizData ? JSON.parse(quizData) : [])

      // Load Flashcard Sets
      const flashcardData = localStorage.getItem("flashcardSets")
      setFlashcardSets(flashcardData ? JSON.parse(flashcardData) : [])

      // Load Chat Sessions
      const chatData = localStorage.getItem("chat_sessions")
      setChatSessions(chatData ? JSON.parse(chatData) : [])

      // Load Document History
      const docData = localStorage.getItem("documentHistory")
      setDocumentHistory(docData ? JSON.parse(docData) : [])

      // Load Submitted Exams
      const examData = localStorage.getItem("submittedExams")
      setSubmittedExams(examData ? JSON.parse(examData) : [])

      // Load Evaluations
      const evalData = localStorage.getItem("examEvaluations")
      setEvaluations(evalData ? JSON.parse(evalData) : [])
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Filter by time range
  const filterByTimeRange = (dateString: string): boolean => {
    if (!dateString) return false
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = diff / (1000 * 60 * 60 * 24)

    switch (timeRange) {
      case 'week': return days <= 7
      case 'month': return days <= 30
      case 'all': return true
      default: return true
    }
  }

  // Calculate Study Streak
  const calculateStreak = (): number => {
    const allActivities = [
      ...quizHistory.map(q => q.date),
      ...flashcardSets.map(f => f.createdAt),
      ...chatSessions.map(c => c.created),
      ...documentHistory.map(d => d.uploadDate),
      ...submittedExams.map(e => e.submitted_at)
    ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    if (allActivities.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < allActivities.length; i++) {
      const activityDate = new Date(allActivities[i])
      activityDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - streak)
      
      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++
      } else if (activityDate.getTime() < expectedDate.getTime()) {
        break
      }
    }

    return streak
  }

  // Calculate Statistics
  const stats = {
    // Quiz Stats
    totalQuizzes: quizHistory.filter(q => filterByTimeRange(q.date)).length,
    averageQuizScore: quizHistory.filter(q => filterByTimeRange(q.date)).length > 0
      ? Math.round(quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.percentage, 0) / quizHistory.filter(q => filterByTimeRange(q.date)).length)
      : 0,
    bestQuizScore: quizHistory.length > 0 ? Math.max(...quizHistory.map(q => q.percentage)) : 0,
    totalQuestions: quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.numQuestions, 0),
    correctAnswers: quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.score, 0),

    // Exam Stats
    totalExams: submittedExams.filter(e => filterByTimeRange(e.submitted_at)).length,
    totalExamQuestions: submittedExams.filter(e => filterByTimeRange(e.submitted_at)).reduce((acc, e) => acc + e.total_questions, 0),
    totalExamMarks: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.total_score, 0),
    totalPossibleMarks: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.total_max_marks, 0),
    averageExamScore: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).length > 0
      ? Math.round(evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.percentage, 0) / evaluations.filter(e => filterByTimeRange(e.evaluated_at)).length)
      : 0,
    bestExamScore: evaluations.length > 0 ? Math.max(...evaluations.map(e => e.percentage)) : 0,

    // Flashcard Stats
    totalFlashcardSets: flashcardSets.filter(f => filterByTimeRange(f.createdAt)).length,
    totalFlashcards: flashcardSets.filter(f => filterByTimeRange(f.createdAt)).reduce((acc, f) => acc + f.cards.length, 0),
    
    // Chat Stats
    totalChatSessions: chatSessions.filter(c => filterByTimeRange(c.created)).length,
    totalMessages: chatSessions.filter(c => filterByTimeRange(c.created)).reduce((acc, c) => acc + (c.message_count || 0), 0),

    // Document Stats
    totalDocuments: documentHistory.filter(d => filterByTimeRange(d.uploadDate)).length,

    // Time Stats
    totalStudyTime: Math.round(
      (quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + (q.duration || 0), 0)) / 60
    ),

    // Streak
    currentStreak: calculateStreak(),

    // Activity Score (0-100)
    activityScore: Math.min(100, Math.round(
      (quizHistory.filter(q => filterByTimeRange(q.date)).length * 8) +
      (submittedExams.filter(e => filterByTimeRange(e.submitted_at)).length * 15) +
      (flashcardSets.filter(f => filterByTimeRange(f.createdAt)).length * 5) +
      (chatSessions.filter(c => filterByTimeRange(c.created)).length * 3) +
      (documentHistory.filter(d => filterByTimeRange(d.uploadDate)).length * 2)
    ))
  }

  // Combined Subject Performance (Quiz + Exam)
  const subjectPerformance = () => {
    const performance: Record<string, SubjectPerformance> = {}

    // Add quiz data
    quizHistory.filter(q => filterByTimeRange(q.date)).forEach(quiz => {
      const subject = quiz.subject || 'Other'
      if (!performance[subject]) {
        performance[subject] = { total: 0, count: 0, correct: 0, incorrect: 0, totalMarks: 0, maxMarks: 0 }
      }
      performance[subject].total += quiz.percentage
      performance[subject].count += 1
      performance[subject].correct += quiz.score
      performance[subject].incorrect += (quiz.numQuestions - quiz.score)
    })

    // Add exam evaluation data
    evaluations.filter(e => filterByTimeRange(e.evaluated_at)).forEach(evaluation => {
      const subject = evaluation.subject || 'Other'
      if (!performance[subject]) {
        performance[subject] = { total: 0, count: 0, correct: 0, incorrect: 0, totalMarks: 0, maxMarks: 0 }
      }
      performance[subject].total += evaluation.percentage
      performance[subject].count += 1
      performance[subject].totalMarks += evaluation.total_score
      performance[subject].maxMarks += evaluation.total_max_marks
      
      // Count correct/incorrect from individual question evaluations
      evaluation.evaluations.forEach(q => {
        const percentage = (q.score / q.max_marks) * 100
        if (percentage >= 70) {
          performance[subject].correct += 1
        } else {
          performance[subject].incorrect += 1
        }
      })
    })

    return performance
  }

  const subjectStats: SubjectStats[] = Object.entries(subjectPerformance()).map(([subject, data]) => ({
    subject,
    average: data.count > 0 ? Math.round(data.total / data.count) : 0,
    count: data.count,
    correct: data.correct,
    incorrect: data.incorrect,
    accuracy: (data.correct + data.incorrect) > 0 ? Math.round((data.correct / (data.correct + data.incorrect)) * 100) : 0,
    totalMarks: data.totalMarks,
    maxMarks: data.maxMarks
  })).sort((a, b) => b.average - a.average)

  // Weekly Activity Pattern - Fixed to work with actual data
  const weeklyActivity = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const activity = days.map(day => ({ day, count: 0 }))

    // Collect all activities with valid dates
    const allActivities = [
      ...quizHistory.filter(q => q.date).map(q => ({ date: q.date, type: 'quiz' })),
      ...flashcardSets.filter(f => f.createdAt).map(f => ({ date: f.createdAt, type: 'flashcard' })),
      ...chatSessions.filter(c => c.created).map(c => ({ date: c.created, type: 'chat' })),
      ...submittedExams.filter(e => e.submitted_at).map(e => ({ date: e.submitted_at, type: 'exam' })),
      ...documentHistory.filter(d => d.uploadDate).map(d => ({ date: d.uploadDate, type: 'document' }))
    ]

    // Count activities by day of week
    allActivities.forEach(item => {
      try {
        if (filterByTimeRange(item.date)) {
          const date = new Date(item.date)
          if (!isNaN(date.getTime())) {
            const dayIndex = date.getDay()
            activity[dayIndex].count++
          }
        }
      } catch (err) {
        console.error('Error parsing date:', item.date, err)
      }
    })

    return activity
  }

  // Performance Trend (Last 7 days) - Fixed to work with actual data
  const performanceTrend = (): DayActivity[] => {
    const last7Days: DayActivity[] = []
    const today = new Date()
    
    // Create array for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        quizzes: 0,
        exams: 0,
        avgScore: 0,
        flashcards: 0,
        chats: 0
      })
    }

    // Process quiz data
    quizHistory.forEach(quiz => {
      try {
        const quizDate = new Date(quiz.date)
        quizDate.setHours(0, 0, 0, 0)
        
        // Find matching day in our 7-day array
        const dayIndex = last7Days.findIndex(d => {
          const targetDate = new Date(today)
          targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
          targetDate.setHours(0, 0, 0, 0)
          return targetDate.getTime() === quizDate.getTime()
        })
        
        if (dayIndex !== -1) {
          last7Days[dayIndex].quizzes++
          // Calculate rolling average
          const totalTests = last7Days[dayIndex].quizzes + last7Days[dayIndex].exams
          last7Days[dayIndex].avgScore = Math.round(
            ((last7Days[dayIndex].avgScore * (totalTests - 1)) + quiz.percentage) / totalTests
          )
        }
      } catch (err) {
        console.error('Error processing quiz date:', quiz.date, err)
      }
    })

    // Process exam evaluation data
    evaluations.forEach(evaluation => {
      try {
        const evalDate = new Date(evaluation.evaluated_at)
        evalDate.setHours(0, 0, 0, 0)
        
        const dayIndex = last7Days.findIndex(d => {
          const targetDate = new Date(today)
          targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
          targetDate.setHours(0, 0, 0, 0)
          return targetDate.getTime() === evalDate.getTime()
        })
        
        if (dayIndex !== -1) {
          last7Days[dayIndex].exams++
          const totalTests = last7Days[dayIndex].quizzes + last7Days[dayIndex].exams
          last7Days[dayIndex].avgScore = Math.round(
            ((last7Days[dayIndex].avgScore * (totalTests - 1)) + evaluation.percentage) / totalTests
          )
        }
      } catch (err) {
        console.error('Error processing evaluation date:', evaluation.evaluated_at, err)
      }
    })

    // Process flashcard data
    flashcardSets.forEach(set => {
      try {
        const setDate = new Date(set.createdAt)
        setDate.setHours(0, 0, 0, 0)
        
        const dayIndex = last7Days.findIndex(d => {
          const targetDate = new Date(today)
          targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
          targetDate.setHours(0, 0, 0, 0)
          return targetDate.getTime() === setDate.getTime()
        })
        
        if (dayIndex !== -1) {
          last7Days[dayIndex].flashcards++
        }
      } catch (err) {
        console.error('Error processing flashcard date:', set.createdAt, err)
      }
    })

    // Process chat data
    chatSessions.forEach(chat => {
      try {
        if (chat.created) {
          const chatDate = new Date(chat.created)
          chatDate.setHours(0, 0, 0, 0)
          
          const dayIndex = last7Days.findIndex(d => {
            const targetDate = new Date(today)
            targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
            targetDate.setHours(0, 0, 0, 0)
            return targetDate.getTime() === chatDate.getTime()
          })
          
          if (dayIndex !== -1) {
            last7Days[dayIndex].chats++
          }
        }
      } catch (err) {
        console.error('Error processing chat date:', chat.created, err)
      }
    })

    return last7Days
  }

  // Exam-specific insights
  const examInsights = () => {
    const insights = []
    
    // Proctored exam performance
    const proctoredExams = submittedExams.filter(e => e.exam_id === 'dummy-exam-1')
    if (proctoredExams.length > 0) {
      insights.push({
        title: "Proctored Exam Experience",
        description: `You've completed ${proctoredExams.length} proctored exam(s) with monitoring`,
        icon: Shield,
        color: "red"
      })
    }

    // High-stakes performance
    if (stats.averageExamScore >= 80) {
      insights.push({
        title: "Excellent Exam Performance",
        description: `Your average exam score is ${stats.averageExamScore}% - Outstanding!`,
        icon: Trophy,
        color: "yellow"
      })
    }

    // Areas needing improvement
    const weakSubjects = subjectStats.filter(s => s.average < 60 && s.count >= 2)
    if (weakSubjects.length > 0) {
      insights.push({
        title: "Focus Areas Identified",
        description: `Consider reviewing: ${weakSubjects.map(s => s.subject).join(', ')}`,
        icon: Target,
        color: "orange"
      })
    }

    // Consistent improvement
    const recentEvals = evaluations.slice(-3)
    if (recentEvals.length >= 3) {
      const improving = recentEvals.every((e, i) => 
        i === 0 || e.percentage >= recentEvals[i - 1].percentage
      )
      if (improving) {
        insights.push({
          title: "Steady Improvement",
          description: "Your scores are consistently improving - Keep it up!",
          icon: TrendingUp,
          color: "green"
        })
      }
    }

    return insights
  }

  // Achievements & Milestones
  const achievements = [
    { 
      id: 1, 
      name: "First Steps", 
      description: "Complete your first quiz", 
      icon: Trophy,
      unlocked: quizHistory.length > 0,
      progress: Math.min(100, quizHistory.length * 100)
    },
    { 
      id: 2, 
      name: "Quiz Master", 
      description: "Complete 10 quizzes", 
      icon: Brain,
      unlocked: quizHistory.length >= 10,
      progress: Math.min(100, (quizHistory.length / 10) * 100)
    },
    { 
      id: 3, 
      name: "Perfect Score", 
      description: "Get 100% on a quiz", 
      icon: Star,
      unlocked: quizHistory.some(q => q.percentage === 100) || evaluations.some(e => e.percentage === 100),
      progress: Math.max(stats.bestQuizScore, stats.bestExamScore)
    },
    { 
      id: 4, 
      name: "Exam Champion", 
      description: "Complete 5 exams", 
      icon: Award,
      unlocked: submittedExams.length >= 5,
      progress: Math.min(100, (submittedExams.length / 5) * 100)
    },
    { 
      id: 5, 
      name: "Proctoring Pro", 
      description: "Complete a proctored exam", 
      icon: Shield,
      unlocked: submittedExams.some(e => e.exam_id === 'dummy-exam-1'),
      progress: submittedExams.some(e => e.exam_id === 'dummy-exam-1') ? 100 : 0
    },
    { 
      id: 6, 
      name: "Flashcard Enthusiast", 
      description: "Create 5 flashcard sets", 
      icon: BookOpen,
      unlocked: flashcardSets.length >= 5,
      progress: Math.min(100, (flashcardSets.length / 5) * 100)
    },
    { 
      id: 7, 
      name: "Week Warrior", 
      description: "Maintain a 7-day streak", 
      icon: Flame,
      unlocked: stats.currentStreak >= 7,
      progress: Math.min(100, (stats.currentStreak / 7) * 100)
    },
    { 
      id: 8, 
      name: "Conversation Starter", 
      description: "Have 10 chat sessions", 
      icon: MessageSquare,
      unlocked: chatSessions.length >= 10,
      progress: Math.min(100, (chatSessions.length / 10) * 100)
    },
  ]

  // Areas for Improvement
  const areasForImprovement = subjectStats
    .filter(s => s.average < 70 && s.count >= 2)
    .map(s => ({
      subject: s.subject,
      score: s.average,
      suggestion: `Focus on ${s.subject} - Your average score is ${s.average}%`
    }))

  // Recent Activity Timeline
  const recentActivity: ActivityItem[] = [
    ...quizHistory.map(q => ({
      type: 'quiz',
      title: `Quiz: ${q.topic}`,
      subtitle: `${q.subject} - ${q.percentage}%`,
      date: q.date,
      icon: Brain,
      score: q.percentage,
      color: q.percentage >= 70 ? 'success' : q.percentage >= 50 ? 'warning' : 'destructive'
    })),
    ...submittedExams.map(e => {
      const evaluation = evaluations.find(ev => ev.session_id === e.session_id)
      return {
        type: 'exam',
        title: `Exam: ${e.topic}`,
        subtitle: evaluation 
          ? `${e.subject} - ${evaluation.percentage.toFixed(1)}% (${evaluation.total_score}/${evaluation.total_max_marks})`
          : `${e.subject} - ${e.total_questions} questions`,
        date: e.submitted_at,
        icon: FileText,
        score: evaluation?.percentage,
        color: evaluation 
          ? (evaluation.percentage >= 70 ? 'success' : evaluation.percentage >= 50 ? 'warning' : 'destructive')
          : 'primary'
      }
    }),
    ...flashcardSets.map(f => ({
      type: 'flashcard',
      title: `Flashcards: ${f.topic}`,
      subtitle: `${f.subject} - ${f.cards.length} cards`,
      date: f.createdAt,
      icon: BookOpen,
      color: 'primary'
    })),
    ...chatSessions.map(c => ({
      type: 'chat',
      title: 'Chat Session',
      subtitle: `${c.subject || 'All Subjects'} - ${c.message_count || 0} messages`,
      date: c.created || new Date().toISOString(),
      icon: MessageSquare,
      color: 'accent'
    })),
    ...documentHistory.map(d => ({
      type: 'document',
      title: `Document: ${d.title}`,
      subtitle: d.subject,
      date: d.uploadDate,
      icon: Upload,
      color: 'secondary'
    }))
  ]
    .filter(a => filterByTimeRange(a.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Learning Journey</h1>
          <p className="text-muted-foreground">Track your progress across quizzes, exams, and study activities</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline" size="icon" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Streak & Activity Score */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground">{stats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-orange-500">
                {stats.currentStreak >= 7 ? "🔥 On Fire!" : stats.currentStreak >= 3 ? "Keep Going!" : "Start Your Streak!"}
              </div>
            </div>
          </div>
          <Progress value={Math.min(100, (stats.currentStreak / 7) * 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.currentStreak >= 7 ? "Amazing! You've maintained a week-long streak!" : `${7 - stats.currentStreak} days to reach a week streak`}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground">{stats.activityScore}</div>
                <div className="text-sm text-muted-foreground">Activity Score</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-500">
                {stats.activityScore >= 80 ? "Excellent!" : stats.activityScore >= 50 ? "Good Job!" : "Keep Learning!"}
              </div>
            </div>
          </div>
          <Progress value={stats.activityScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on quizzes, exams, flashcards, chats, and documents
          </p>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <Brain className="w-6 h-6 text-primary mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
          <div className="text-xs text-muted-foreground">Quizzes</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <FileText className="w-6 h-6 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalExams}</div>
          <div className="text-xs text-muted-foreground">Exams</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5">
          <Target className="w-6 h-6 text-success mb-2" />
          <div className="text-2xl font-bold text-foreground">
            {stats.totalQuizzes + stats.totalExams > 0 
              ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
              : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Overall Avg</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5">
          <BookOpen className="w-6 h-6 text-accent mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalFlashcards}</div>
          <div className="text-xs text-muted-foreground">Flashcards</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <MessageSquare className="w-6 h-6 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalMessages}</div>
          <div className="text-xs text-muted-foreground">Messages</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <Upload className="w-6 h-6 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalDocuments}</div>
          <div className="text-xs text-muted-foreground">Documents</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <Clock className="w-6 h-6 text-orange-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalStudyTime}m</div>
          <div className="text-xs text-muted-foreground">Study Time</div>
        </Card>
      </div>

      {/* Exam Insights Banner */}
      {examInsights().length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {examInsights().map((insight, index) => {
            const Icon = insight.icon
            return (
              <Card key={index} className={`p-4 bg-gradient-to-br from-${insight.color}-500/10 to-${insight.color}-500/5 border-${insight.color}-500/20`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-${insight.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${insight.color}-500`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">7-Day Activity</h3>
                <LineChart className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {performanceTrend().map((day, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{day.date}</span>
                      <div className="flex gap-2">
                        {day.quizzes > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {day.quizzes} quiz{day.quizzes !== 1 ? 'zes' : ''}
                          </Badge>
                        )}
                        {day.exams > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.exams} exam{day.exams !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {day.avgScore > 0 && (
                          <Badge className="text-xs">
                            {day.avgScore}% avg
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={(day.quizzes + day.exams) * 15} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Pattern */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Weekly Pattern</h3>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              {weeklyActivity().some(d => d.count > 0) ? (
                <div className="flex items-end justify-between gap-2 h-48">
                  {weeklyActivity().map((day, index) => {
                    const maxCount = Math.max(...weeklyActivity().map(d => d.count), 1)
                    const height = (day.count / maxCount) * 100
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                          {day.count > 0 && (
                            <div 
                              className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                              style={{ height: `${Math.max(height, 10)}%` }}
                              title={`${day.count} activities on ${day.day}`}
                            />
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-medium ${day.count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {day.count}
                          </p>
                          <p className="text-xs text-muted-foreground">{day.day}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity data available</p>
                    <p className="text-xs mt-1">Complete activities to see weekly patterns</p>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total this week: {weeklyActivity().reduce((sum, d) => sum + d.count, 0)} activities</span>
                  <span>Most active: {weeklyActivity().reduce((max, d) => d.count > max.count ? d : max, weeklyActivity()[0]).day}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Subject Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Subject Performance</h3>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            {subjectStats.length > 0 ? (
              <div className="space-y-4">
                {subjectStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">{stat.subject}</span>
                        <Badge variant="outline" className="text-xs">{stat.count} attempts</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">
                          {stat.correct}/{stat.correct + stat.incorrect} correct
                        </div>
                        {stat.maxMarks > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {stat.totalMarks}/{stat.maxMarks} marks
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-foreground">{stat.average}%</span>
                          {stat.average >= 70 ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </div>
                    <Progress value={stat.average} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-sm mt-1">Complete quizzes and exams to see your subject performance</p>
              </div>
            )}
          </Card>

          {/* Quick Stats Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Quiz Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Quizzes</span>
                  <span className="text-lg font-bold text-foreground">{stats.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <Badge className="text-sm">{stats.averageQuizScore}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Best Score</span>
                  <Badge variant="secondary" className="text-sm">{stats.bestQuizScore}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions Answered</span>
                  <span className="text-lg font-bold text-foreground">{stats.totalQuestions}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Exam Performance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Exams</span>
                  <span className="text-lg font-bold text-foreground">{stats.totalExams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <Badge className="text-sm">{stats.averageExamScore}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Best Score</span>
                  <Badge variant="secondary" className="text-sm">{stats.bestExamScore}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Marks Earned</span>
                  <span className="text-lg font-bold text-foreground">
                    {stats.totalExamMarks}/{stats.totalPossibleMarks}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <TrendingUp className="w-5 h-5 text-green-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.correctAnswers + subjectStats.reduce((acc, s) => acc + s.correct, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Correct</div>
              <Progress 
                value={((stats.correctAnswers + subjectStats.reduce((acc, s) => acc + s.correct, 0)) / 
                        (stats.totalQuestions + stats.totalExamQuestions)) * 100} 
                className="h-2 mt-3" 
              />
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-yellow-500" />
                <Star className="w-5 h-5 text-yellow-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {Math.max(stats.bestQuizScore, stats.bestExamScore)}%
              </div>
              <div className="text-sm text-muted-foreground">Best Overall Score</div>
              <Progress value={Math.max(stats.bestQuizScore, stats.bestExamScore)} className="h-2 mt-3" />
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-blue-500" />
                <TrendingUp className="w-5 h-5 text-blue-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalQuizzes + stats.totalExams > 0 
                  ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Average</div>
              <Progress 
                value={stats.totalQuizzes + stats.totalExams > 0 
                  ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
                  : 0} 
                className="h-2 mt-3" 
              />
            </Card>
          </div>

          {/* Areas for Improvement */}
          {areasForImprovement.length > 0 && (
            <Card className="p-6 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">Areas for Improvement</h3>
              </div>
              <div className="space-y-3">
                {areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card">
                    <div>
                      <p className="font-medium text-foreground">{area.subject}</p>
                      <p className="text-sm text-muted-foreground">{area.suggestion}</p>
                    </div>
                    <Badge variant="destructive">{area.score}%</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Performance History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Assessment Performance</h3>
            <div className="space-y-3">
              {[...quizHistory, ...evaluations.map(e => ({
                date: e.evaluated_at,
                topic: e.topic,
                subject: e.subject,
                percentage: e.percentage,
                score: e.total_score,
                numQuestions: e.questions_evaluated,
                duration: 0,
                isExam: true,
                totalMarks: e.total_max_marks
              }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{item.topic}</p>
                      <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                      {(item as any).isExam && (
                        <Badge className="text-xs bg-red-500">EXAM</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {(item as any).isExam 
                          ? `${item.score}/${(item as any).totalMarks} marks`
                          : `${item.score}/${item.numQuestions} correct`
                        }
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(item.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={item.percentage >= 70 ? "default" : item.percentage >= 50 ? "secondary" : "destructive"}
                      className="text-sm"
                    >
                      {item.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <FileText className="w-8 h-8 text-red-500 mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">{stats.totalExams}</div>
              <div className="text-sm text-muted-foreground">Total Exams</div>
            </Card>

            <Card className="p-6">
              <Target className="w-8 h-8 text-green-500 mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">{stats.averageExamScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </Card>

            <Card className="p-6">
              <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">{stats.bestExamScore}%</div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </Card>

            <Card className="p-6">
              <Shield className="w-8 h-8 text-purple-500 mb-3" />
              <div className="text-3xl font-bold text-foreground mb-1">
                {submittedExams.filter(e => e.exam_id === 'dummy-exam-1').length}
              </div>
              <div className="text-sm text-muted-foreground">Proctored Exams</div>
            </Card>
          </div>

          {/* Exam Evaluation Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Exam Results</h3>
            {evaluations.length > 0 ? (
              <div className="space-y-4">
                {evaluations.slice().reverse().map((evaluation, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{evaluation.topic}</h4>
                          <Badge variant="outline">{evaluation.subject}</Badge>
                          {submittedExams.find(e => e.session_id === evaluation.session_id)?.exam_id === 'dummy-exam-1' && (
                            <Badge className="bg-red-500">
                              <Shield className="w-3 h-3 mr-1" />
                              PROCTORED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(evaluation.evaluated_at).toLocaleDateString()} • {evaluation.questions_evaluated} questions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          evaluation.percentage >= 80 ? 'text-green-500' :
                          evaluation.percentage >= 60 ? 'text-blue-500' :
                          evaluation.percentage >= 40 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {evaluation.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.total_score}/{evaluation.total_max_marks} marks
                        </div>
                      </div>
                    </div>
                    
                    {evaluation.overall_feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground italic">{evaluation.overall_feedback}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-lg font-bold text-green-500">
                          {evaluation.evaluations.filter(q => (q.score / q.max_marks) >= 0.7).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Excellent</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-lg font-bold text-yellow-500">
                          {evaluation.evaluations.filter(q => (q.score / q.max_marks) >= 0.5 && (q.score / q.max_marks) < 0.7).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Good</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-lg font-bold text-red-500">
                          {evaluation.evaluations.filter(q => (q.score / q.max_marks) < 0.5).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Needs Work</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No exam evaluations yet</p>
                <p className="text-sm mt-1">Submit an exam to see detailed evaluation results</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <Card 
                  key={achievement.id} 
                  className={`p-6 transition-all ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20' 
                      : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked ? 'bg-yellow-500/20' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    </div>
                    {achievement.unlocked && (
                      <Badge className="bg-yellow-500 text-yellow-950">Unlocked!</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{achievement.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{Math.round(achievement.progress)}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Milestones */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Milestones</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Assessment Champion</p>
                  <p className="text-sm text-muted-foreground">Completed {stats.totalQuizzes + stats.totalExams} assessments</p>
                </div>
                <Badge>{stats.totalQuizzes + stats.totalExams}</Badge>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">High Achiever</p>
                  <p className="text-sm text-muted-foreground">Overall average score</p>
                </div>
                <Badge variant="secondary">
                  {stats.totalQuizzes + stats.totalExams > 0 
                    ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
                    : 0}%
                </Badge>
              </div>

              {submittedExams.filter(e => e.exam_id === 'dummy-exam-1').length > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Proctoring Professional</p>
                    <p className="text-sm text-muted-foreground">Completed proctored exam(s) with integrity</p>
                  </div>
                  <Badge variant="outline" className="bg-red-500/10">
                    {submittedExams.filter(e => e.exam_id === 'dummy-exam-1').length}
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Flashcard Expert</p>
                  <p className="text-sm text-muted-foreground">Created {stats.totalFlashcardSets} sets with {stats.totalFlashcards} cards</p>
                </div>
                <Badge variant="outline">{stats.totalFlashcardSets}</Badge>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Engaged Learner</p>
                  <p className="text-sm text-muted-foreground">Sent {stats.totalMessages} chat messages</p>
                </div>
                <Badge variant="outline">{stats.totalMessages}</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'quiz' ? 'bg-primary/10' :
                        activity.type === 'exam' ? 'bg-red-500/10' :
                        activity.type === 'flashcard' ? 'bg-accent/10' :
                        activity.type === 'chat' ? 'bg-blue-500/10' :
                        'bg-purple-500/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          activity.type === 'quiz' ? 'text-primary' :
                          activity.type === 'exam' ? 'text-red-500' :
                          activity.type === 'flashcard' ? 'text-accent' :
                          activity.type === 'chat' ? 'text-blue-500' :
                          'text-purple-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.date)}</span>
                        </div>
                      </div>
                      {activity.score !== undefined && (
                        <Badge variant={activity.score >= 70 ? "default" : activity.score >= 50 ? "secondary" : "destructive"}>
                          {activity.score.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                  <p className="text-sm mt-1">Start learning to see your activity here</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Personalized Recommendations */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">Personalized Recommendations</h3>
            </div>
            <div className="space-y-3">
              {stats.currentStreak === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Start Your Streak!</p>
                    <p className="text-sm text-muted-foreground">Complete an activity today to begin building your learning streak.</p>
                  </div>
                </div>
              )}

              {stats.totalExams === 0 && stats.totalQuizzes > 3 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <FileText className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Try Taking an Exam!</p>
                    <p className="text-sm text-muted-foreground">You've done well on quizzes. Challenge yourself with a full exam to test your comprehensive knowledge.</p>
                  </div>
                </div>
              )}

              {stats.averageExamScore < 60 && stats.totalExams > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Target className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Focus on Exam Preparation</p>
                    <p className="text-sm text-muted-foreground">Your exam average is {stats.averageExamScore}%. Try reviewing flashcards and taking more quizzes before exams.</p>
                  </div>
                </div>
              )}

              {stats.totalFlashcardSets === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Try Flashcards!</p>
                    <p className="text-sm text-muted-foreground">Create flashcard sets to reinforce your learning and improve retention for exams.</p>
                  </div>
                </div>
              )}

              {stats.totalChatSessions < 3 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <MessageSquare className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Ask Questions!</p>
                    <p className="text-sm text-muted-foreground">Use the AI chat to clarify doubts and get instant explanations.</p>
                  </div>
                </div>
              )}

              {stats.averageExamScore >= 80 && stats.totalExams >= 3 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Excellent Exam Performance!</p>
                    <p className="text-sm text-muted-foreground">You're crushing it with an average of {stats.averageExamScore}%! Keep up the momentum and challenge yourself with more advanced topics.</p>
                  </div>
                </div>
              )}

              {submittedExams.some(e => e.exam_id === 'dummy-exam-1') && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Proctoring Experience</p>
                    <p className="text-sm text-muted-foreground">Great job completing proctored exam(s)! This experience prepares you for real test conditions.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Learning Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Learning Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Assessments</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalQuizzes + stats.totalExams}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Questions Answered</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalQuestions + stats.totalExamQuestions}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Total Marks Earned</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalExamMarks}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Total Study Time</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalStudyTime}m</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Flashcard Sets Created</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalFlashcardSets}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Study Habits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Consistency</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats.currentStreak >= 7 ? "Excellent" : stats.currentStreak >= 3 ? "Good" : "Building"}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (stats.currentStreak / 7) * 100)} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Quiz Performance</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats.averageQuizScore >= 80 ? "Excellent" : stats.averageQuizScore >= 60 ? "Good" : "Improving"}
                    </span>
                  </div>
                  <Progress value={stats.averageQuizScore} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Exam Performance</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats.averageExamScore >= 80 ? "Excellent" : stats.averageExamScore >= 60 ? "Good" : stats.totalExams > 0 ? "Improving" : "Not Started"}
                    </span>
                  </div>
                  <Progress value={stats.averageExamScore} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Engagement Level</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats.activityScore >= 80 ? "Very High" : stats.activityScore >= 50 ? "High" : "Growing"}
                    </span>
                  </div>
                  <Progress value={stats.activityScore} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Learning</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats.totalChatSessions >= 10 ? "Very Active" : stats.totalChatSessions >= 5 ? "Active" : "Getting Started"}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (stats.totalChatSessions / 10) * 100)} className="h-2" />
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Quiz vs Exam Performance
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.averageQuizScore}%</div>
                  <div className="text-sm text-muted-foreground mb-3">Quiz Average</div>
                  <Progress value={stats.averageQuizScore} className="h-2" />
                  <div className="mt-3 text-xs text-muted-foreground">
                    Based on {stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? 'zes' : ''}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.averageExamScore}%</div>
                  <div className="text-sm text-muted-foreground mb-3">Exam Average</div>
                  <Progress value={stats.averageExamScore} className="h-2" />
                  <div className="mt-3 text-xs text-muted-foreground">
                    Based on {stats.totalExams} exam{stats.totalExams !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            {stats.totalQuizzes > 0 && stats.totalExams > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {stats.averageExamScore >= stats.averageQuizScore ? (
                    <>
                      <strong>Great job!</strong> Your exam performance ({stats.averageExamScore}%) is equal to or better than your quiz performance ({stats.averageQuizScore}%). This shows excellent knowledge retention and exam readiness.
                    </>
                  ) : (
                    <>
                      <strong>Room for improvement:</strong> Your quiz average ({stats.averageQuizScore}%) is higher than your exam average ({stats.averageExamScore}%). Consider more comprehensive study sessions before exams.
                    </>
                  )}
                </p>
              </div>
            )}
          </Card>

          {/* Motivational Message */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Keep Up the Great Work!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {stats.activityScore >= 80 
                  ? "You're crushing it! Your dedication to learning is truly impressive. Your consistent effort in both quizzes and exams shows real commitment."
                  : stats.activityScore >= 50
                  ? "You're making excellent progress! Stay consistent with your studies, and you'll see even better results in both quizzes and exams."
                  : "Every expert was once a beginner. Keep learning, stay curious, and celebrate small wins! Each quiz and exam is a step forward."}
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes + stats.totalExams}</div>
                  <div className="text-xs text-muted-foreground">Total Tests</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.totalQuizzes + stats.totalExams > 0 
                      ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
                      : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Overall Avg</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalFlashcards}</div>
                  <div className="text-xs text-muted-foreground">Flashcards</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// "use client"

// import { useState, useEffect } from "react"
// import { Card } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"
// import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { 
//   Clock, Trophy, BookOpen, Brain, TrendingUp, Target, 
//   MessageSquare, Award, BarChart3, Flame, RefreshCw, 
//   Zap, Star, TrendingDown, CheckCircle2, FileText, 
//   Upload, Activity, AlertCircle, BookMarked, Timer, 
//   LineChart, Shield, PieChart, Lightbulb
// } from "lucide-react"
// import { 
//   BarChart, Bar, LineChart as RechartsLine, Line, 
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
//   ResponsiveContainer, AreaChart, Area,
//   RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
// } from "recharts"

// interface QuizHistory {
//   date: string
//   topic: string
//   subject: string
//   percentage: number
//   score: number
//   numQuestions: number
//   duration: number
// }

// interface FlashcardSet {
//   createdAt: string
//   topic: string
//   subject: string
//   cards: Array<{ front: string; back: string }>
// }

// interface ChatSession {
//   created: string
//   subject?: string
//   message_count?: number
// }

// interface DocumentHistory {
//   uploadDate: string
//   title: string
//   subject: string
// }

// interface SubmittedExam {
//   session_id: string
//   exam_id: string
//   topic: string
//   subject: string
//   total_questions: number
//   total_marks: number
//   submitted_at: string
//   answers: Array<{
//     question_number: number
//     answer: string
//   }>
// }

// interface QuestionEvaluation {
//   question_number: number
//   score: number
//   max_marks: number
//   feedback: string
// }

// interface EvaluationData {
//   session_id: string
//   exam_id: string
//   topic: string
//   subject: string
//   total_score: number
//   total_max_marks: number
//   percentage: number
//   questions_evaluated: number
//   evaluated_at: string
//   overall_feedback: string
//   evaluations: QuestionEvaluation[]
// }

// interface SubjectStats {
//   subject: string
//   average: number
//   count: number
//   correct: number
//   incorrect: number
//   accuracy: number
//   totalMarks: number
//   maxMarks: number
// }

// interface DayActivity {
//   date: string
//   quizzes: number
//   exams: number
//   avgScore: number
//   flashcards: number
//   chats: number
// }

// export default function AnalyticsDashboard() {
//   const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
//   const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
//   const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
//   const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([])
//   const [submittedExams, setSubmittedExams] = useState<SubmittedExam[]>([])
//   const [evaluations, setEvaluations] = useState<EvaluationData[]>([])
//   const [loading, setLoading] = useState(true)
//   const [timeRange, setTimeRange] = useState("week")

//   useEffect(() => {
//     loadAllData()
//   }, [])

//   const loadAllData = () => {
//     setLoading(true)
//     try {
//       setQuizHistory(JSON.parse(localStorage.getItem("quizHistory") || "[]"))
//       setFlashcardSets(JSON.parse(localStorage.getItem("flashcardSets") || "[]"))
//       setChatSessions(JSON.parse(localStorage.getItem("chat_sessions") || "[]"))
//       setDocumentHistory(JSON.parse(localStorage.getItem("documentHistory") || "[]"))
//       setSubmittedExams(JSON.parse(localStorage.getItem("submittedExams") || "[]"))
//       setEvaluations(JSON.parse(localStorage.getItem("examEvaluations") || "[]"))
//     } catch (error) {
//       console.error("Error loading data:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const filterByTimeRange = (dateString: string): boolean => {
//     if (!dateString) return false
//     const date = new Date(dateString)
//     const now = new Date()
//     const diff = now.getTime() - date.getTime()
//     const days = diff / (1000 * 60 * 60 * 24)

//     switch (timeRange) {
//       case 'week': return days <= 7
//       case 'month': return days <= 30
//       case 'all': return true
//       default: return true
//     }
//   }

//   const calculateStreak = (): number => {
//     const allActivities = [
//       ...quizHistory.map(q => q.date),
//       ...flashcardSets.map(f => f.createdAt),
//       ...chatSessions.map(c => c.created),
//       ...documentHistory.map(d => d.uploadDate),
//       ...submittedExams.map(e => e.submitted_at)
//     ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

//     if (allActivities.length === 0) return 0

//     let streak = 0
//     const today = new Date()
//     today.setHours(0, 0, 0, 0)

//     for (let i = 0; i < allActivities.length; i++) {
//       const activityDate = new Date(allActivities[i])
//       activityDate.setHours(0, 0, 0, 0)
      
//       const expectedDate = new Date(today)
//       expectedDate.setDate(today.getDate() - streak)
      
//       if (activityDate.getTime() === expectedDate.getTime()) {
//         streak++
//       } else if (activityDate.getTime() < expectedDate.getTime()) {
//         break
//       }
//     }

//     return streak
//   }

//   const stats = {
//     totalQuizzes: quizHistory.filter(q => filterByTimeRange(q.date)).length,
//     averageQuizScore: quizHistory.filter(q => filterByTimeRange(q.date)).length > 0
//       ? Math.round(quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.percentage, 0) / quizHistory.filter(q => filterByTimeRange(q.date)).length)
//       : 0,
//     bestQuizScore: quizHistory.length > 0 ? Math.max(...quizHistory.map(q => q.percentage)) : 0,
//     totalQuestions: quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.numQuestions, 0),
//     correctAnswers: quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + q.score, 0),
//     totalExams: submittedExams.filter(e => filterByTimeRange(e.submitted_at)).length,
//     totalExamQuestions: submittedExams.filter(e => filterByTimeRange(e.submitted_at)).reduce((acc, e) => acc + e.total_questions, 0),
//     totalExamMarks: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.total_score, 0),
//     totalPossibleMarks: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.total_max_marks, 0),
//     averageExamScore: evaluations.filter(e => filterByTimeRange(e.evaluated_at)).length > 0
//       ? Math.round(evaluations.filter(e => filterByTimeRange(e.evaluated_at)).reduce((acc, e) => acc + e.percentage, 0) / evaluations.filter(e => filterByTimeRange(e.evaluated_at)).length)
//       : 0,
//     bestExamScore: evaluations.length > 0 ? Math.max(...evaluations.map(e => e.percentage)) : 0,
//     totalFlashcardSets: flashcardSets.filter(f => filterByTimeRange(f.createdAt)).length,
//     totalFlashcards: flashcardSets.filter(f => filterByTimeRange(f.createdAt)).reduce((acc, f) => acc + f.cards.length, 0),
//     totalChatSessions: chatSessions.filter(c => filterByTimeRange(c.created)).length,
//     totalMessages: chatSessions.filter(c => filterByTimeRange(c.created)).reduce((acc, c) => acc + (c.message_count || 0), 0),
//     totalDocuments: documentHistory.filter(d => filterByTimeRange(d.uploadDate)).length,
//     totalStudyTime: Math.round((quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, q) => acc + (q.duration || 0), 0)) / 60),
//     currentStreak: calculateStreak(),
//     activityScore: Math.min(100, Math.round(
//       (quizHistory.filter(q => filterByTimeRange(q.date)).length * 8) +
//       (submittedExams.filter(e => filterByTimeRange(e.submitted_at)).length * 15) +
//       (flashcardSets.filter(f => filterByTimeRange(f.createdAt)).length * 5) +
//       (chatSessions.filter(c => filterByTimeRange(c.created)).length * 3) +
//       (documentHistory.filter(d => filterByTimeRange(d.uploadDate)).length * 2)
//     ))
//   }

//   const subjectPerformance = () => {
//     const performance: Record<string, any> = {}

//     quizHistory.filter(q => filterByTimeRange(q.date)).forEach(quiz => {
//       const subject = quiz.subject || 'Other'
//       if (!performance[subject]) {
//         performance[subject] = { total: 0, count: 0, correct: 0, incorrect: 0, totalMarks: 0, maxMarks: 0 }
//       }
//       performance[subject].total += quiz.percentage
//       performance[subject].count += 1
//       performance[subject].correct += quiz.score
//       performance[subject].incorrect += (quiz.numQuestions - quiz.score)
//     })

//     evaluations.filter(e => filterByTimeRange(e.evaluated_at)).forEach(evaluation => {
//       const subject = evaluation.subject || 'Other'
//       if (!performance[subject]) {
//         performance[subject] = { total: 0, count: 0, correct: 0, incorrect: 0, totalMarks: 0, maxMarks: 0 }
//       }
//       performance[subject].total += evaluation.percentage
//       performance[subject].count += 1
//       performance[subject].totalMarks += evaluation.total_score
//       performance[subject].maxMarks += evaluation.total_max_marks
      
//       evaluation.evaluations.forEach((q: any) => {
//         const percentage = (q.score / q.max_marks) * 100
//         if (percentage >= 70) {
//           performance[subject].correct += 1
//         } else {
//           performance[subject].incorrect += 1
//         }
//       })
//     })

//     return performance
//   }

//   const subjectStats: SubjectStats[] = Object.entries(subjectPerformance()).map(([subject, data]: [string, any]) => ({
//     subject,
//     average: data.count > 0 ? Math.round(data.total / data.count) : 0,
//     count: data.count,
//     correct: data.correct,
//     incorrect: data.incorrect,
//     accuracy: (data.correct + data.incorrect) > 0 ? Math.round((data.correct / (data.correct + data.incorrect)) * 100) : 0,
//     totalMarks: data.totalMarks,
//     maxMarks: data.maxMarks
//   })).sort((a, b) => b.average - a.average)

//   const weeklyActivity = () => {
//     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
//     const activity = days.map(day => ({ day, count: 0 }))

//     const allActivities = [
//       ...quizHistory.filter(q => q.date).map(q => q.date),
//       ...flashcardSets.filter(f => f.createdAt).map(f => f.createdAt),
//       ...chatSessions.filter(c => c.created).map(c => c.created),
//       ...submittedExams.filter(e => e.submitted_at).map(e => e.submitted_at),
//       ...documentHistory.filter(d => d.uploadDate).map(d => d.uploadDate)
//     ]

//     allActivities.forEach(date => {
//       try {
//         if (filterByTimeRange(date)) {
//           const d = new Date(date)
//           if (!isNaN(d.getTime())) {
//             activity[d.getDay()].count++
//           }
//         }
//       } catch (err) {
//         console.error('Error:', err)
//       }
//     })

//     return activity
//   }

//   const performanceTrend = (): DayActivity[] => {
//     const last7Days: DayActivity[] = []
//     const today = new Date()
    
//     for (let i = 6; i >= 0; i--) {
//       const date = new Date(today)
//       date.setDate(date.getDate() - i)
//       last7Days.push({
//         date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//         quizzes: 0,
//         exams: 0,
//         avgScore: 0,
//         flashcards: 0,
//         chats: 0
//       })
//     }

//     let scoreAccumulator: number[] = Array(7).fill(0)
//     let scoreCount: number[] = Array(7).fill(0)

//     quizHistory.forEach(quiz => {
//       const quizDate = new Date(quiz.date)
//       const dayIndex = last7Days.findIndex(d => {
//         const targetDate = new Date(today)
//         targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
//         targetDate.setHours(0, 0, 0, 0)
//         quizDate.setHours(0, 0, 0, 0)
//         return targetDate.getTime() === quizDate.getTime()
//       })
      
//       if (dayIndex !== -1) {
//         last7Days[dayIndex].quizzes++
//         scoreAccumulator[dayIndex] += quiz.percentage
//         scoreCount[dayIndex]++
//       }
//     })

//     evaluations.forEach(evaluation => {
//       const evalDate = new Date(evaluation.evaluated_at)
//       const dayIndex = last7Days.findIndex(d => {
//         const targetDate = new Date(today)
//         targetDate.setDate(today.getDate() - (6 - last7Days.indexOf(d)))
//         targetDate.setHours(0, 0, 0, 0)
//         evalDate.setHours(0, 0, 0, 0)
//         return targetDate.getTime() === evalDate.getTime()
//       })
      
//       if (dayIndex !== -1) {
//         last7Days[dayIndex].exams++
//         scoreAccumulator[dayIndex] += evaluation.percentage
//         scoreCount[dayIndex]++
//       }
//     })

//     return last7Days.map((day, i) => ({
//       ...day,
//       avgScore: scoreCount[i] > 0 ? Math.round(scoreAccumulator[i] / scoreCount[i]) : 0
//     }))
//   }

//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex items-center justify-center h-64">
//           <RefreshCw className="w-8 h-8 animate-spin text-primary" />
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 space-y-6">
//       <div className="flex items-start justify-between">
//         <div>
//           <h1 className="text-3xl font-bold mb-2">Your Learning Journey</h1>
//           <p className="text-muted-foreground">Track your progress with interactive visualizations</p>
//         </div>
//         <div className="flex gap-2">
//           <select
//             value={timeRange}
//             onChange={(e) => setTimeRange(e.target.value)}
//             className="px-4 py-2 border rounded-lg text-sm"
//           >
//             <option value="week">Last 7 Days</option>
//             <option value="month">Last 30 Days</option>
//             <option value="all">All Time</option>
//           </select>
//           <Button variant="outline" size="icon" onClick={loadAllData}>
//             <RefreshCw className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>

//       <div className="grid md:grid-cols-2 gap-4">
//         <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
//                 <Flame className="w-8 h-8 text-orange-500" />
//               </div>
//               <div>
//                 <div className="text-4xl font-bold">{stats.currentStreak}</div>
//                 <div className="text-sm text-muted-foreground">Day Streak</div>
//               </div>
//             </div>
//           </div>
//           <Progress value={Math.min(100, (stats.currentStreak / 7) * 100)} className="h-2" />
//         </Card>

//         <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
//                 <Zap className="w-8 h-8 text-blue-500" />
//               </div>
//               <div>
//                 <div className="text-4xl font-bold">{stats.activityScore}</div>
//                 <div className="text-sm text-muted-foreground">Activity Score</div>
//               </div>
//             </div>
//           </div>
//           <Progress value={stats.activityScore} className="h-2" />
//         </Card>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
//         <Card className="p-4">
//           <Brain className="w-6 h-6 text-primary mb-2" />
//           <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
//           <div className="text-xs text-muted-foreground">Quizzes</div>
//         </Card>
//         <Card className="p-4">
//           <FileText className="w-6 h-6 text-red-500 mb-2" />
//           <div className="text-2xl font-bold">{stats.totalExams}</div>
//           <div className="text-xs text-muted-foreground">Exams</div>
//         </Card>
//         <Card className="p-4">
//           <Target className="w-6 h-6 text-green-500 mb-2" />
//           <div className="text-2xl font-bold">
//             {stats.totalQuizzes + stats.totalExams > 0 
//               ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
//               : 0}%
//           </div>
//           <div className="text-xs text-muted-foreground">Overall Avg</div>
//         </Card>
//         <Card className="p-4">
//           <BookOpen className="w-6 h-6 text-accent mb-2" />
//           <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
//           <div className="text-xs text-muted-foreground">Flashcards</div>
//         </Card>
//         <Card className="p-4">
//           <MessageSquare className="w-6 h-6 text-blue-500 mb-2" />
//           <div className="text-2xl font-bold">{stats.totalMessages}</div>
//           <div className="text-xs text-muted-foreground">Messages</div>
//         </Card>
//         <Card className="p-4">
//           <Upload className="w-6 h-6 text-purple-500 mb-2" />
//           <div className="text-2xl font-bold">{stats.totalDocuments}</div>
//           <div className="text-xs text-muted-foreground">Documents</div>
//         </Card>
//         <Card className="p-4">
//           <Clock className="w-6 h-6 text-orange-500 mb-2" />
//           <div className="text-2xl font-bold">{stats.totalStudyTime}m</div>
//           <div className="text-xs text-muted-foreground">Study Time</div>
//         </Card>
//       </div>

//       <Tabs defaultValue="overview" className="space-y-6">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="performance">Performance</TabsTrigger>
//           <TabsTrigger value="trends">Trends</TabsTrigger>
//           <TabsTrigger value="insights">Insights</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid lg:grid-cols-2 gap-6">
//             <Card className="p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-lg font-semibold">7-Day Performance</h3>
//                 <LineChart className="w-5 h-5 text-muted-foreground" />
//               </div>
//               {performanceTrend().some(d => d.quizzes > 0 || d.exams > 0) ? (
//                 <>
//                   <ResponsiveContainer width="100%" height={250}>
//                     <RechartsLine data={performanceTrend()}>
//                       <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//                       <XAxis dataKey="date" tick={{ fontSize: 12 }} />
//                       <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
//                       <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
//                       <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
//                       <Legend />
//                       <Line yAxisId="left" type="monotone" dataKey="quizzes" stroke="hsl(var(--primary))" strokeWidth={2} name="Quizzes" />
//                       <Line yAxisId="left" type="monotone" dataKey="exams" stroke="#ef4444" strokeWidth={2} name="Exams" />
//                       <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} name="Avg Score %" />
//                     </RechartsLine>
//                   </ResponsiveContainer>
//                   <div className="mt-4 grid grid-cols-3 gap-3">
//                     <div className="text-center p-2 rounded bg-primary/10">
//                       <div className="text-xs text-muted-foreground">Quizzes</div>
//                       <div className="text-lg font-bold text-primary">
//                         {performanceTrend().reduce((sum, d) => sum + d.quizzes, 0)}
//                       </div>
//                     </div>
//                     <div className="text-center p-2 rounded bg-red-500/10">
//                       <div className="text-xs text-muted-foreground">Exams</div>
//                       <div className="text-lg font-bold text-red-500">
//                         {performanceTrend().reduce((sum, d) => sum + d.exams, 0)}
//                       </div>
//                     </div>
//                     <div className="text-center p-2 rounded bg-green-500/10">
//                       <div className="text-xs text-muted-foreground">Avg Score</div>
//                       <div className="text-lg font-bold text-green-500">
//                         {performanceTrend().filter(d => d.avgScore > 0).length > 0
//                           ? Math.round(performanceTrend().reduce((sum, d) => sum + d.avgScore, 0) / performanceTrend().filter(d => d.avgScore > 0).length)
//                           : 0}%
//                       </div>
//                     </div>
//                   </div>
//                 </>
//               ) : (
//                 <div className="h-64 flex items-center justify-center text-muted-foreground">
//                   <div className="text-center">
//                     <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
//                     <p className="text-sm">No data yet</p>
//                   </div>
//                 </div>
//               )}
//             </Card>

//             <Card className="p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-lg font-semibold">Weekly Activity Pattern</h3>
//                 <Activity className="w-5 h-5 text-muted-foreground" />
//               </div>
//               {weeklyActivity().some(d => d.count > 0) ? (
//                 <>
//                   <ResponsiveContainer width="100%" height={250}>
//                     <BarChart data={weeklyActivity()}>
//                       <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//                       <XAxis dataKey="day" tick={{ fontSize: 12 }} />
//                       <YAxis tick={{ fontSize: 12 }} />
//                       <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
//                       <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Activities" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                   <div className="mt-4 pt-4 border-t">
//                     <div className="flex justify-between text-xs text-muted-foreground">
//                       <span>Total: {weeklyActivity().reduce((sum, d) => sum + d.count, 0)} activities</span>
//                       <span>Most active: {weeklyActivity().reduce((max, d) => d.count > max.count ? d : max).day}</span>
//                     </div>
//                   </div>
//                 </>
//               ) : (
//                 <div className="h-64 flex items-center justify-center text-muted-foreground">
//                   <div className="text-center">
//                     <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
//                     <p className="text-sm">No activity data</p>
//                   </div>
//                 </div>
//               )}
//             </Card>
//           </div>

//           <Card className="p-6">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-lg font-semibold">Subject Performance</h3>
//               <BarChart3 className="w-5 h-5 text-muted-foreground" />
//             </div>
//             {subjectStats.length > 0 ? (
//               <>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={subjectStats} layout="vertical">
//                     <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//                     <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
//                     <YAxis type="category" dataKey="subject" width={100} tick={{ fontSize: 12 }} />
//                     <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
//                     <Legend />
//                     <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} name="Avg Score %" />
//                     <Bar dataKey="accuracy" fill="#10b981" radius={[0, 8, 8, 0]} name="Accuracy %" />
//                   </BarChart>
//                 </ResponsiveContainer>
//                 <div className="mt-6 space-y-3">
//                   {subjectStats.map((stat, i) => (
//                     <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
//                       <div className="flex items-center gap-3">
//                         <span className="font-medium">{stat.subject}</span>
//                         <Badge variant="outline" className="text-xs">{stat.count} attempts</Badge>
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <span className="text-xs text-muted-foreground">
//                           {stat.correct}/{stat.correct + stat.incorrect} correct
//                         </span>
//                         <Badge variant={stat.average >= 70 ? "default" : "secondary"}>
//                           {stat.average}%
//                         </Badge>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </>
//             ) : (
//               <div className="text-center py-12 text-muted-foreground">
//                 <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                 <p>No performance data yet</p>
//               </div>
//             )}
//           </Card>
//         </TabsContent>

//         <TabsContent value="performance" className="space-y-6">
//           <div className="grid md:grid-cols-3 gap-4">
//             <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
//               <CheckCircle2 className="w-8 h-8 text-green-500 mb-3" />
//               <div className="text-3xl font-bold mb-1">
//                 {stats.correctAnswers + subjectStats.reduce((acc, s) => acc + s.correct, 0)}
//               </div>
//               <div className="text-sm text-muted-foreground">Total Correct</div>
//             </Card>
//             <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
//               <Award className="w-8 h-8 text-yellow-500 mb-3" />
//               <div className="text-3xl font-bold mb-1">{Math.max(stats.bestQuizScore, stats.bestExamScore)}%</div>
//               <div className="text-sm text-muted-foreground">Best Score</div>
//             </Card>
//             <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
//               <Target className="w-8 h-8 text-blue-500 mb-3" />
//               <div className="text-3xl font-bold mb-1">
//                 {stats.totalQuizzes + stats.totalExams > 0 
//                   ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
//                   : 0}%
//               </div>
//               <div className="text-sm text-muted-foreground">Overall Average</div>
//             </Card>
//           </div>

//           {subjectStats.length > 0 && (
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Subject Comparison Radar</h3>
//               <ResponsiveContainer width="100%" height={400}>
//                 <RadarChart data={subjectStats.slice(0, 6)}>
//                   <PolarGrid stroke="currentColor" opacity={0.2} />
//                   <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
//                   <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
//                   <Radar name="Avg Score" dataKey="average" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
//                   <Radar name="Accuracy" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
//                   <Legend />
//                   <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
//                 </RadarChart>
//               </ResponsiveContainer>
//             </Card>
//           )}

//           <div className="grid md:grid-cols-2 gap-6">
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                 <Brain className="w-5 h-5 text-primary" />
//                 Quiz Performance
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Total Quizzes</span>
//                   <span className="text-lg font-bold">{stats.totalQuizzes}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Average Score</span>
//                   <Badge>{stats.averageQuizScore}%</Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Best Score</span>
//                   <Badge variant="secondary">{stats.bestQuizScore}%</Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Questions Answered</span>
//                   <span className="text-lg font-bold">{stats.totalQuestions}</span>
//                 </div>
//               </div>
//             </Card>

//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                 <FileText className="w-5 h-5 text-red-500" />
//                 Exam Performance
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Total Exams</span>
//                   <span className="text-lg font-bold">{stats.totalExams}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Average Score</span>
//                   <Badge>{stats.averageExamScore}%</Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Best Score</span>
//                   <Badge variant="secondary">{stats.bestExamScore}%</Badge>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-sm text-muted-foreground">Total Marks</span>
//                   <span className="text-lg font-bold">{stats.totalExamMarks}/{stats.totalPossibleMarks}</span>
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="trends" className="space-y-6">
//           <Card className="p-6">
//             <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
//             <ResponsiveContainer width="100%" height={350}>
//               <AreaChart data={performanceTrend()}>
//                 <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//                 <XAxis dataKey="date" tick={{ fontSize: 12 }} />
//                 <YAxis tick={{ fontSize: 12 }} />
//                 <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
//                 <Legend />
//                 <Area type="monotone" dataKey="quizzes" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Quizzes" />
//                 <Area type="monotone" dataKey="exams" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Exams" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </Card>

//           <div className="grid md:grid-cols-2 gap-6">
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Daily Activity Breakdown</h3>
//               {performanceTrend().map((day, i) => (
//                 <div key={i} className="mb-4">
//                   <div className="flex justify-between text-sm mb-2">
//                     <span className="text-muted-foreground">{day.date}</span>
//                     <div className="flex gap-2">
//                       {day.quizzes > 0 && <Badge variant="outline" className="text-xs">{day.quizzes} quiz</Badge>}
//                       {day.exams > 0 && <Badge variant="secondary" className="text-xs">{day.exams} exam</Badge>}
//                       {day.avgScore > 0 && <Badge className="text-xs">{day.avgScore}%</Badge>}
//                     </div>
//                   </div>
//                   <Progress value={(day.quizzes + day.exams) * 20} className="h-2" />
//                 </div>
//               ))}
//             </Card>

//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Study Consistency</h3>
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Current Streak</span>
//                     <span className="text-sm font-medium">{stats.currentStreak} days</span>
//                   </div>
//                   <Progress value={Math.min(100, (stats.currentStreak / 30) * 100)} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Activity Score</span>
//                     <span className="text-sm font-medium">{stats.activityScore}/100</span>
//                   </div>
//                   <Progress value={stats.activityScore} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Quiz Completion</span>
//                     <span className="text-sm font-medium">{stats.totalQuizzes} completed</span>
//                   </div>
//                   <Progress value={Math.min(100, stats.totalQuizzes * 5)} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Exam Completion</span>
//                     <span className="text-sm font-medium">{stats.totalExams} completed</span>
//                   </div>
//                   <Progress value={Math.min(100, stats.totalExams * 10)} className="h-2" />
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="insights" className="space-y-6">
//           <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
//             <div className="flex items-center gap-2 mb-4">
//               <Lightbulb className="w-5 h-5 text-purple-500" />
//               <h3 className="text-lg font-semibold">Personalized Insights</h3>
//             </div>
//             <div className="space-y-3">
//               {stats.currentStreak === 0 && (
//                 <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
//                   <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
//                   <div>
//                     <p className="font-medium mb-1">Start Your Streak!</p>
//                     <p className="text-sm text-muted-foreground">Complete an activity today to begin your learning journey.</p>
//                   </div>
//                 </div>
//               )}
//               {stats.totalExams === 0 && stats.totalQuizzes > 3 && (
//                 <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
//                   <FileText className="w-5 h-5 text-red-500 mt-0.5" />
//                   <div>
//                     <p className="font-medium mb-1">Try Taking an Exam!</p>
//                     <p className="text-sm text-muted-foreground">You've done well on quizzes. Challenge yourself with a full exam.</p>
//                   </div>
//                 </div>
//               )}
//               {stats.averageExamScore < 60 && stats.totalExams > 0 && (
//                 <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
//                   <Target className="w-5 h-5 text-yellow-500 mt-0.5" />
//                   <div>
//                     <p className="font-medium mb-1">Focus on Exam Prep</p>
//                     <p className="text-sm text-muted-foreground">Your exam average is {stats.averageExamScore}%. Review flashcards before exams.</p>
//                   </div>
//                 </div>
//               )}
//               {stats.totalFlashcardSets === 0 && (
//                 <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
//                   <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
//                   <div>
//                     <p className="font-medium mb-1">Try Flashcards!</p>
//                     <p className="text-sm text-muted-foreground">Create flashcard sets to improve retention.</p>
//                   </div>
//                 </div>
//               )}
//               {stats.averageExamScore >= 80 && stats.totalExams >= 3 && (
//                 <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
//                   <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
//                   <div>
//                     <p className="font-medium mb-1">Excellent Performance!</p>
//                     <p className="text-sm text-muted-foreground">You're crushing it with {stats.averageExamScore}% average!</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </Card>

//           <div className="grid md:grid-cols-2 gap-6">
//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Learning Stats</h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
//                   <div className="flex items-center gap-2">
//                     <Brain className="w-4 h-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">Total Assessments</span>
//                   </div>
//                   <span className="font-semibold">{stats.totalQuizzes + stats.totalExams}</span>
//                 </div>
//                 <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
//                   <div className="flex items-center gap-2">
//                     <CheckCircle2 className="w-4 h-4 text-green-500" />
//                     <span className="text-sm text-muted-foreground">Questions Answered</span>
//                   </div>
//                   <span className="font-semibold">{stats.totalQuestions + stats.totalExamQuestions}</span>
//                 </div>
//                 <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
//                   <div className="flex items-center gap-2">
//                     <Timer className="w-4 h-4 text-orange-500" />
//                     <span className="text-sm text-muted-foreground">Study Time</span>
//                   </div>
//                   <span className="font-semibold">{stats.totalStudyTime}m</span>
//                 </div>
//                 <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
//                   <div className="flex items-center gap-2">
//                     <BookMarked className="w-4 h-4 text-accent" />
//                     <span className="text-sm text-muted-foreground">Flashcard Sets</span>
//                   </div>
//                   <span className="font-semibold">{stats.totalFlashcardSets}</span>
//                 </div>
//               </div>
//             </Card>

//             <Card className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Study Habits</h3>
//               <div className="space-y-4">
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Consistency</span>
//                     <span className="text-sm font-medium">
//                       {stats.currentStreak >= 7 ? "Excellent" : stats.currentStreak >= 3 ? "Good" : "Building"}
//                     </span>
//                   </div>
//                   <Progress value={Math.min(100, (stats.currentStreak / 7) * 100)} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Quiz Performance</span>
//                     <span className="text-sm font-medium">
//                       {stats.averageQuizScore >= 80 ? "Excellent" : stats.averageQuizScore >= 60 ? "Good" : "Improving"}
//                     </span>
//                   </div>
//                   <Progress value={stats.averageQuizScore} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Exam Performance</span>
//                     <span className="text-sm font-medium">
//                       {stats.averageExamScore >= 80 ? "Excellent" : stats.averageExamScore >= 60 ? "Good" : stats.totalExams > 0 ? "Improving" : "Not Started"}
//                     </span>
//                   </div>
//                   <Progress value={stats.averageExamScore} className="h-2" />
//                 </div>
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-sm text-muted-foreground">Engagement</span>
//                     <span className="text-sm font-medium">
//                       {stats.activityScore >= 80 ? "Very High" : stats.activityScore >= 50 ? "High" : "Growing"}
//                     </span>
//                   </div>
//                   <Progress value={stats.activityScore} className="h-2" />
//                 </div>
//               </div>
//             </Card>
//           </div>

//           <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10">
//             <div className="text-center">
//               <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <Trophy className="w-8 h-8 text-primary" />
//               </div>
//               <h3 className="text-xl font-bold mb-2">Keep Up the Great Work!</h3>
//               <p className="text-muted-foreground max-w-2xl mx-auto">
//                 {stats.activityScore >= 80 
//                   ? "You're crushing it! Your dedication is impressive."
//                   : stats.activityScore >= 50
//                   ? "You're making excellent progress! Stay consistent."
//                   : "Every expert was once a beginner. Keep learning!"}
//               </p>
//               <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold">{stats.totalQuizzes + stats.totalExams}</div>
//                   <div className="text-xs text-muted-foreground">Total Tests</div>
//                 </div>
//                 <div className="w-px h-8 bg-border" />
//                 <div className="text-center">
//                   <div className="text-2xl font-bold">{stats.currentStreak}</div>
//                   <div className="text-xs text-muted-foreground">Day Streak</div>
//                 </div>
//                 <div className="w-px h-8 bg-border" />
//                 <div className="text-center">
//                   <div className="text-2xl font-bold">
//                     {stats.totalQuizzes + stats.totalExams > 0 
//                       ? Math.round(((stats.averageQuizScore * stats.totalQuizzes) + (stats.averageExamScore * stats.totalExams)) / (stats.totalQuizzes + stats.totalExams))
//                       : 0}%
//                   </div>
//                   <div className="text-xs text-muted-foreground">Overall Avg</div>
//                 </div>
//                 <div className="w-px h-8 bg-border" />
//                 <div className="text-center">
//                   <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
//                   <div className="text-xs text-muted-foreground">Flashcards</div>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }