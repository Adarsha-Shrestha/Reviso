"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const PROGRAMS = [
  "Engineering",
  "CSIT (Computer Science and Information Technology)",
  "BCA (Bachelor of Computer Application)",
  "BBA (Bachelor of Business Administration)",
  "BBM (Bachelor of Business Management)",
  "BHM (Bachelor of Hotel Management)",
  "Other"
]

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"]

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    program: "",
    semester: ""
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { saveProfile, hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Redirect if already completed onboarding
  useEffect(() => {
    if (!isLoading && hasCompletedOnboarding) {
      router.push("/dashboard/chat")
    }
  }, [hasCompletedOnboarding, isLoading, router])

  const handleSubmit = async () => {
    setError("")

    // Validate
    if (!formData.name || !formData.college || !formData.program || !formData.semester) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Save profile using auth context
    saveProfile(formData)

    // Router will automatically redirect to dashboard via useEffect in auth context
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or already completed
  if (!isAuthenticated || hasCompletedOnboarding) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 bg-card border-border">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground text-center mb-8">Tell us about yourself to personalize your experience</p>

          {error && (
            <Alert className="mb-6 border-destructive bg-destructive/10">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-foreground">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="college">College/University</Label>
              <Input
                id="college"
                type="text"
                value={formData.college}
                onChange={(e) => handleChange("college", e.target.value)}
                placeholder="Enter your college or university name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                value={formData.program}
                onChange={(e) => handleChange("program", e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select your program</option>
                {PROGRAMS.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="semester">Current Semester</Label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) => handleChange("semester", e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select your semester</option>
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}