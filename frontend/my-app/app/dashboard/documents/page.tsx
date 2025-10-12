"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Calendar, 
  FileType, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Plus
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showUploadForm, setShowUploadForm] = useState(false)
  
  const [documents, setDocuments] = useState([
    {
      id: "1",
      name: "Classification Algorithms.pdf",
      title: "Classification Algorithms",
      description: "Comprehensive guide to decision trees, SVM, and ensemble methods",
      subject: "Data Mining",
      uploadDate: "2025-01-08",
      size: "2.4 MB",
      pages: 45,
    },
    {
      id: "2",
      name: "TCP IP Protocol Stack.pdf",
      title: "TCP/IP Protocol Stack",
      description: "Deep dive into network protocols and layer architecture",
      subject: "Network Systems",
      uploadDate: "2025-01-07",
      size: "1.8 MB",
      pages: 32,
    },
    {
      id: "3",
      name: "Distributed Consensus.docx",
      title: "Distributed Consensus",
      description: "Paxos, Raft, and Byzantine fault tolerance algorithms",
      subject: "Distributed Computing",
      uploadDate: "2025-01-06",
      size: "3.2 MB",
      pages: 58,
    },
    {
      id: "4",
      name: "Data Preprocessing Techniques.pdf",
      title: "Data Preprocessing Techniques",
      description: "Data cleaning, normalization, and feature engineering methods",
      subject: "Data Mining",
      uploadDate: "2025-01-05",
      size: "1.5 MB",
      pages: 28,
    },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSuccess(false)
      setError("")
    }
  }

  const handleUpload = async () => {
    if (!file || !subject || !title.trim()) {
      setError("Please fill in all required fields (file, subject, and title)")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Simulate upload and processing
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Add new document to the list
      const newDocument = {
        id: String(documents.length + 1),
        name: file.name,
        title: title.trim(),
        description: description.trim() || "No description provided",
        subject: subject === "DataMining" ? "Data Mining" : subject === "Network" ? "Network Systems" : "Distributed Computing",
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        pages: Math.floor(Math.random() * 50) + 10,
      }
      
      setDocuments([newDocument, ...documents])
      setSuccess(true)
      setFile(null)
      setSubject("")
      setTitle("")
      setDescription("")
      
      // Hide upload form and scroll to top after a delay
      setTimeout(() => {
        setShowUploadForm(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError("Failed to upload document. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  const filteredDocuments = documents.filter((doc) => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Library</h1>
        <p className="text-muted-foreground">Upload and manage your course materials</p>
      </div>

      {/* Upload Section */}
      {!showUploadForm ? (
        <div className="mb-8">
          <Button 
            onClick={() => setShowUploadForm(true)} 
            size="lg"
            className="w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload New Document
          </Button>
        </div>
      ) : (
        <Card className="p-6 mb-8 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Upload Document</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setShowUploadForm(false)
                setFile(null)
                setSubject("")
                setTitle("")
                setDescription("")
                setError("")
              }}
            >
              Cancel
            </Button>
          </div>

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <AlertDescription className="text-foreground">Document uploaded successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 border-destructive bg-destructive/10">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-foreground">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">
                Document Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Machine Learning Fundamentals"
                className="mt-2"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A clear, descriptive title for your document
              </p>
            </div>

            <div>
              <Label htmlFor="description">
                Description or Comment <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document content, key topics covered, or any notes..."
                className="mt-2 w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500 characters
              </p>
            </div>

            <div>
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="mt-2">
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
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-10 h-10 text-primary mb-2" />
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-muted-foreground mb-2" />
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

            <Button 
              onClick={handleUpload} 
              disabled={uploading || !file || !subject || !title.trim()} 
              className="w-full"
            >
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
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="secondary">{doc.subject}</Badge>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">{doc.title}</h3>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{doc.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{doc.uploadDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileType className="w-4 h-4" />
                <span>
                  {doc.size} • {doc.pages} pages
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search query" : "Upload your first document to get started"}
          </p>
        </div>
      )}
    </div>
  )
}