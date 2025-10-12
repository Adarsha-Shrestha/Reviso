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
  Activity, AlertCircle, BookMarked, Timer, LineChart
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

interface SubjectPerformance {
  total: number
  count: number
  correct: number
  incorrect: number
}

interface SubjectStats {
  subject: string
  average: number
  count: number
  correct: number
  incorrect: number
  accuracy: number
}

interface DayActivity {
  date: string
  quizzes: number
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
  const [studySessions, setStudySessions] = useState<any[]>([])
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

      // Load Study Sessions (tracked across all activities)
      const sessionData = localStorage.getItem("studySessions")
      setStudySessions(sessionData ? JSON.parse(sessionData) : [])
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
      ...documentHistory.map(d => d.uploadDate)
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
      (quizHistory.filter(q => filterByTimeRange(q.date)).length * 10) +
      (flashcardSets.filter(f => filterByTimeRange(f.createdAt)).length * 5) +
      (chatSessions.filter(c => filterByTimeRange(c.created)).length * 3) +
      (documentHistory.filter(d => filterByTimeRange(d.uploadDate)).length * 2)
    ))
  }

  // Subject Performance
  const subjectPerformance = quizHistory.filter(q => filterByTimeRange(q.date)).reduce((acc, quiz) => {
    const subject = quiz.subject || 'Other'
    if (!acc[subject]) {
      acc[subject] = { total: 0, count: 0, correct: 0, incorrect: 0 }
    }
    acc[subject].total += quiz.percentage
    acc[subject].count += 1
    acc[subject].correct += quiz.score
    acc[subject].incorrect += (quiz.numQuestions - quiz.score)
    return acc
  }, {} as Record<string, SubjectPerformance>)

  const subjectStats: SubjectStats[] = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count),
    count: data.count,
    correct: data.correct,
    incorrect: data.incorrect,
    accuracy: Math.round((data.correct / (data.correct + data.incorrect)) * 100)
  })).sort((a, b) => b.average - a.average)

  // Weekly Activity Pattern
  const weeklyActivity = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const activity = days.map(day => ({ day, count: 0 }))

    const allActivities = [
      ...quizHistory.map(q => q.date),
      ...flashcardSets.map(f => f.createdAt),
      ...chatSessions.map(c => c.created),
    ].filter(Boolean)

    allActivities.forEach(dateStr => {
      if (filterByTimeRange(dateStr)) {
        const dayIndex = new Date(dateStr).getDay()
        activity[dayIndex].count++
      }
    })

    return activity
  }

  // Performance Trend (Last 7 days)
  const performanceTrend = (): DayActivity[] => {
    const last7Days: DayActivity[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        quizzes: 0,
        avgScore: 0,
        flashcards: 0,
        chats: 0
      })
    }

    quizHistory.forEach(quiz => {
      const quizDate = new Date(quiz.date)
      quizDate.setHours(0, 0, 0, 0)
      const dayIndex = last7Days.findIndex(d => {
        const trendDate = new Date(d.date + ', 2025')
        return trendDate.getTime() === quizDate.getTime()
      })
      if (dayIndex !== -1) {
        last7Days[dayIndex].quizzes++
        last7Days[dayIndex].avgScore = Math.round(
          ((last7Days[dayIndex].avgScore * (last7Days[dayIndex].quizzes - 1)) + quiz.percentage) / last7Days[dayIndex].quizzes
        )
      }
    })

    flashcardSets.forEach(set => {
      const setDate = new Date(set.createdAt)
      setDate.setHours(0, 0, 0, 0)
      const dayIndex = last7Days.findIndex(d => {
        const trendDate = new Date(d.date + ', 2025')
        return trendDate.getTime() === setDate.getTime()
      })
      if (dayIndex !== -1) {
        last7Days[dayIndex].flashcards++
      }
    })

    return last7Days
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
      unlocked: quizHistory.some(q => q.percentage === 100),
      progress: quizHistory.some(q => q.percentage === 100) ? 100 : stats.bestQuizScore
    },
    { 
      id: 4, 
      name: "Flashcard Enthusiast", 
      description: "Create 5 flashcard sets", 
      icon: BookOpen,
      unlocked: flashcardSets.length >= 5,
      progress: Math.min(100, (flashcardSets.length / 5) * 100)
    },
    { 
      id: 5, 
      name: "Week Warrior", 
      description: "Maintain a 7-day streak", 
      icon: Flame,
      unlocked: stats.currentStreak >= 7,
      progress: Math.min(100, (stats.currentStreak / 7) * 100)
    },
    { 
      id: 6, 
      name: "Conversation Starter", 
      description: "Have 10 chat sessions", 
      icon: MessageSquare,
      unlocked: chatSessions.length >= 10,
      progress: Math.min(100, (chatSessions.length / 10) * 100)
    },
  ]

  // Areas for Improvement
  const areasForImprovement = subjectStats
    .filter(s => s.average < 70)
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
      icon: FileText,
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
          <p className="text-muted-foreground">Track your progress and stay motivated</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadAllData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
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
            Based on your quizzes, flashcards, chats, and documents
          </p>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <Brain className="w-6 h-6 text-primary mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
          <div className="text-xs text-muted-foreground">Quizzes</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5">
          <Target className="w-6 h-6 text-success mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.averageQuizScore}%</div>
          <div className="text-xs text-muted-foreground">Avg Score</div>
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
          <FileText className="w-6 h-6 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalDocuments}</div>
          <div className="text-xs text-muted-foreground">Documents</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <Clock className="w-6 h-6 text-orange-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalStudyTime}m</div>
          <div className="text-xs text-muted-foreground">Study Time</div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
                        <Badge variant="outline" className="text-xs">
                          {day.quizzes} quizzes
                        </Badge>
                        {day.avgScore > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.avgScore}% avg
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={day.quizzes * 20} className="h-2" />
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
              <div className="flex items-end justify-between gap-2 h-48">
                {weeklyActivity().map((day, index) => {
                  const maxCount = Math.max(...weeklyActivity().map(d => d.count), 1)
                  const height = (day.count / maxCount) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-foreground">{day.count}</p>
                        <p className="text-xs text-muted-foreground">{day.day}</p>
                      </div>
                    </div>
                  )
                })}
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
                        <Badge variant="outline" className="text-xs">{stat.count} quizzes</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">
                          {stat.correct}/{stat.correct + stat.incorrect} correct
                        </div>
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
                <p className="text-sm mt-1">Complete quizzes to see your subject performance</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <TrendingUp className="w-5 h-5 text-green-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
              <Progress value={(stats.correctAnswers / stats.totalQuestions) * 100} className="h-2 mt-3" />
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-500" />
                <TrendingDown className="w-5 h-5 text-red-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalQuestions - stats.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect Answers</div>
              <Progress 
                value={((stats.totalQuestions - stats.correctAnswers) / stats.totalQuestions) * 100} 
                className="h-2 mt-3" 
              />
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-yellow-500" />
                <Star className="w-5 h-5 text-yellow-500/60" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.bestQuizScore}%</div>
              <div className="text-sm text-muted-foreground">Best Quiz Score</div>
              <Progress value={stats.bestQuizScore} className="h-2 mt-3" />
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

          {/* Detailed Quiz History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Quiz Performance</h3>
            <div className="space-y-3">
              {quizHistory.slice(0, 10).map((quiz, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{quiz.topic}</p>
                      <Badge variant="outline" className="text-xs">{quiz.subject}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{quiz.score}/{quiz.numQuestions} correct</span>
                      <span>•</span>
                      <span>{formatTimeAgo(quiz.date)}</span>
                      <span>•</span>
                      <span>{Math.floor(quiz.duration / 60)}m {quiz.duration % 60}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={quiz.percentage >= 70 ? "default" : quiz.percentage >= 50 ? "secondary" : "destructive"}
                      className="text-sm"
                    >
                      {quiz.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
                  <p className="font-medium text-foreground">Quiz Champion</p>
                  <p className="text-sm text-muted-foreground">Completed {stats.totalQuizzes} quizzes</p>
                </div>
                <Badge>{stats.totalQuizzes}</Badge>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Accuracy Master</p>
                  <p className="text-sm text-muted-foreground">Average quiz score</p>
                </div>
                <Badge variant="secondary">{stats.averageQuizScore}%</Badge>
              </div>

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
                      <div className={`w-10 h-10 bg-${activity.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${activity.color}`} />
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
                          {activity.score}%
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
              <Zap className="w-5 h-5 text-purple-500" />
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

              {stats.averageQuizScore < 60 && stats.totalQuizzes > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Target className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Focus on Fundamentals</p>
                    <p className="text-sm text-muted-foreground">Your average score is {stats.averageQuizScore}%. Try reviewing flashcards before taking quizzes.</p>
                  </div>
                </div>
              )}

              {stats.totalFlashcardSets === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Try Flashcards!</p>
                    <p className="text-sm text-muted-foreground">Create flashcard sets to reinforce your learning and improve retention.</p>
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

              {stats.averageQuizScore >= 80 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Excellent Performance!</p>
                    <p className="text-sm text-muted-foreground">You're doing great! Keep up the momentum and challenge yourself with more advanced topics.</p>
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
                    <span className="text-sm text-muted-foreground">Total Questions Attempted</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.totalQuestions}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Correct Answers</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats.correctAnswers}</span>
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

          {/* Motivational Message */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Keep Up the Great Work!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {stats.activityScore >= 80 
                  ? "You're crushing it! Your dedication to learning is truly impressive. Keep this momentum going!"
                  : stats.activityScore >= 50
                  ? "You're making excellent progress! Stay consistent and you'll see even better results."
                  : "Every expert was once a beginner. Keep learning, stay curious, and celebrate small wins!"}
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
                  <div className="text-xs text-muted-foreground">Quizzes</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.averageQuizScore}%</div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}