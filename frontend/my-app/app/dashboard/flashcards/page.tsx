"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2, Search, RotateCw, ChevronLeft, ChevronRight, Trash2, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type Flashcard = {
  front: string
  back: string
  category: string
  difficulty: string
  tags: string[]
}

type FlashcardSet = {
  id: number
  topic: string
  subject: string
  cards: Flashcard[]
  createdAt: string
}

type ViewMode = "home" | "studying"

export default function FlashcardsDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("home")
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("All Subjects")
  const [numCards, setNumCards] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("flashcardSets")
    if (stored) {
      try {
        setFlashcardSets(JSON.parse(stored))
      } catch (err) {
        console.error("Error loading flashcard sets:", err)
        setFlashcardSets([])
      }
    }
  }, [])

  const generateFlashcards = async () => {
    if (!topic.trim()) return
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/flashcard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject: subject === "All Subjects" ? undefined : subject,
          num_cards: Number(numCards),
        }),
      })

      const data = await response.json()
      if (data.success) {
        const newSet: FlashcardSet = {
          id: Date.now(),
          topic,
          subject: subject === "All Subjects" ? "General" : subject,
          cards: data.flashcard_data,
          createdAt: new Date().toISOString(),
        }

        const updatedSets = [newSet, ...flashcardSets]
        setFlashcardSets(updatedSets)
        
        // Save to localStorage
        localStorage.setItem("flashcardSets", JSON.stringify(updatedSets))

        // Automatically open the newly generated set
        setSelectedSet(newSet)
        setCurrentCard(0)
        setIsFlipped(false)
        setViewMode("studying")

        // Reset form
        setTopic("")
        setSubject("All Subjects")
        setNumCards("10")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to generate flashcards. Make sure the backend is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSets = flashcardSets.filter(
    (set) =>
      set.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openSet = (set: FlashcardSet) => {
    setSelectedSet(set)
    setCurrentCard(0)
    setIsFlipped(false)
    setViewMode("studying")
  }

  const deleteSet = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedSets = flashcardSets.filter((set) => set.id !== id)
    setFlashcardSets(updatedSets)
    
    // Save to localStorage
    localStorage.setItem("flashcardSets", JSON.stringify(updatedSets))
    
    if (selectedSet?.id === id) {
      setSelectedSet(null)
      setViewMode("home")
    }
  }

  const nextCard = () => {
    if (selectedSet && currentCard < selectedSet.cards.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (selectedSet && currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const backToHome = () => {
    setViewMode("home")
    setSelectedSet(null)
    setCurrentCard(0)
    setIsFlipped(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Studying View
  if (viewMode === "studying" && selectedSet) {
    const card = selectedSet.cards[currentCard]

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={backToHome}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Sets
          </Button>
          <div className="text-sm text-muted-foreground">
            Card {currentCard + 1} of {selectedSet.cards.length}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">{selectedSet.topic}</h2>
          <p className="text-sm text-muted-foreground">{selectedSet.subject}</p>
        </div>

        <Card
          className="p-12 cursor-pointer flex items-center justify-center min-h-[400px] mb-6 transition-all hover:border-primary/50"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="text-center max-w-xl">
            <div className="mb-4 flex gap-2 justify-center">
              {!isFlipped && (
                <>
                  <Badge variant="secondary">{card.difficulty}</Badge>
                  <Badge variant="outline">{card.category}</Badge>
                </>
              )}
              {isFlipped && <Badge>Answer</Badge>}
            </div>

            <p className="text-2xl font-semibold mb-4">
              {isFlipped ? card.back : card.front}
            </p>

            {!isFlipped && (
              <p className="text-sm text-muted-foreground">Click to reveal answer</p>
            )}

            {isFlipped && card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {card.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4 mb-4">
          <Button onClick={prevCard} disabled={currentCard === 0} variant="outline" size="lg">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <Button onClick={() => setIsFlipped(!isFlipped)} variant="outline" size="icon">
            <RotateCw className="w-5 h-5" />
          </Button>

          <Button onClick={nextCard} disabled={currentCard === selectedSet.cards.length - 1} size="lg">
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-success h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCard + 1) / selectedSet.cards.length) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // Home View
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Flashcard Studio</h1>
        <p className="text-muted-foreground">Generate smart flashcards for effective studying</p>
      </div>

      {/* Flashcard Generator */}
      <Card className="p-8 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Create New Flashcard Set</h2>

        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Neural Networks, Routing Protocols"
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject (Optional)</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Subjects">All Subjects</SelectItem>
              <SelectItem value="DataMining">Data Mining</SelectItem>
              <SelectItem value="Network">Network Systems</SelectItem>
              <SelectItem value="Distributed">Distributed Computing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="numCards">Number of Cards</Label>
          <Select value={numCards} onValueChange={setNumCards}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Cards</SelectItem>
              <SelectItem value="10">10 Cards</SelectItem>
              <SelectItem value="15">15 Cards</SelectItem>
              <SelectItem value="20">20 Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateFlashcards} disabled={isLoading || !topic.trim()} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5 mr-2" />
              Generate Flashcards
            </>
          )}
        </Button>
      </Card>

      {/* Flashcard History */}
      {flashcardSets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Flashcard Sets</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredSets.length > 0 ? (
              filteredSets.map((set) => (
                <Card
                  key={set.id}
                  className="p-6 cursor-pointer hover:border-primary/50 transition-all group"
                  onClick={() => openSet(set)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {set.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground">{set.subject}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteSet(set.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary">{set.cards.length} cards</Badge>
                    <span className="text-muted-foreground text-xs">{formatDate(set.createdAt)}</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No flashcard sets found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {flashcardSets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Flashcard Sets Yet</h3>
          <p className="text-muted-foreground">Create your first flashcard set to get started!</p>
        </Card>
      )}
    </div>
  )
}