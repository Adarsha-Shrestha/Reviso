"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState("")
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSuccess(false)
      setError("")
    }
  }

  const handleUpload = async () => {
    if (!file || !subject) {
      setError("Please select a file and subject")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Simulate upload - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccess(true)
      setFile(null)
      setSubject("")
    } catch (err) {
      setError("Failed to upload document. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">Add new course materials to your knowledge base</p>
        </div>

        <Card className="p-8 bg-card border-border">
          {success && (
            <Alert className="mb-6 border-success bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <AlertDescription className="text-foreground">Document uploaded successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-destructive bg-destructive/10">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-foreground">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="subject">Subject</Label>
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
              <Label htmlFor="file">Document File</Label>
              <div className="mt-2">
                <label
                  htmlFor="file"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT (Max 10MB)</p>
                    </div>
                  )}
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                  />
                </label>
              </div>
            </div>

            <Button onClick={handleUpload} disabled={uploading || !file || !subject} className="w-full" size="lg">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Supported Formats</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• PDF documents (.pdf)</li>
            <li>• Word documents (.docx)</li>
            <li>• Text files (.txt)</li>
            <li>• Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
