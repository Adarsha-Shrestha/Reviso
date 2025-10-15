
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash2, PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"


const documentFormSchema = z.object({
  subject: z.string({ required_error: "Please select a subject." }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  file: z.any().refine((files) => files?.length == 1, "File is required."),
})

const initialDocuments = [
    { title: "Data Mining Concepts", subject: "Data Mining", date: "2024-05-10" },
    { title: "OSI Model", subject: "Network Systems", date: "2024-05-08" },
    { title: "Intro to Distributed Systems", subject: "Distributed Computing", date: "2024-05-05" },
];

const initialSubjects = [
  { value: "data-mining", label: "Data Mining" },
  { value: "network-systems", label: "Network Systems" },
  { value: "distributed-computing", label: "Distributed Computing" },
];

export default function DocumentsPage() {
  const { toast } = useToast()
  const [fileName, setFileName] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState(initialDocuments);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [newSubject, setNewSubject] = useState("");
  const [isAddSubjectOpen, setAddSubjectOpen] = useState(false);

  const form = useForm<z.infer<typeof documentFormSchema>>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
    },
  })
  const fileRef = form.register("file");

  function onSubmit(data: z.infer<typeof documentFormSchema>) {
    const subjectLabel = subjects.find(s => s.value === data.subject)?.label || data.subject;
    const newDocument = {
      title: data.title,
      subject: subjectLabel,
      date: new Date().toISOString().split('T')[0],
    };

    setUploadedDocuments(prev => [newDocument, ...prev]);
    
    toast({
      title: "Document Uploaded",
      description: `${data.file[0].name} has been successfully uploaded.`,
    })
    form.reset()
    setFileName("");
  }
  
  const handleAddSubject = () => {
    if (newSubject.trim()) {
      const newSubjectValue = newSubject.toLowerCase().replace(/\s+/g, '-');
      if (!subjects.some(s => s.value === newSubjectValue)) {
        setSubjects(prev => [...prev, { value: newSubjectValue, label: newSubject.trim() }]);
        setNewSubject("");
        setAddSubjectOpen(false);
        toast({
          title: "Subject Added",
          description: `"${newSubject.trim()}" has been added to the list.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Subject Exists",
          description: "This subject is already in the list.",
        });
      }
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 lg:px-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Documents</h1>
        <p className="text-muted-foreground">Upload and manage study materials.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Document</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                         <div className="flex justify-between items-center">
                          <FormLabel>Subject</FormLabel>
                          <Dialog open={isAddSubjectOpen} onOpenChange={setAddSubjectOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Subject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Subject</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Input
                                  placeholder="New subject title"
                                  value={newSubject}
                                  onChange={(e) => setNewSubject(e.target.value)}
                                />
                              </div>
                              <DialogFooter>
                                <Button onClick={handleAddSubject}>Add Subject</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.value} value={subject.value}>{subject.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Chapter 1 Notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File</FormLabel>
                        <FormControl>
                          <Input type="file" {...fileRef} onChange={(e) => {
                            field.onChange(e.target.files);
                            if (e.target.files && e.target.files.length > 0) {
                              setFileName(e.target.files[0].name);
                            } else {
                              setFileName("");
                            }
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   {fileName && <p className="text-sm text-muted-foreground">Selected file: {fileName}</p>}
                  <Button type="submit" className="w-full">Upload Document</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                    <CardDescription>List of available study materials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Uploaded On</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uploadedDocuments.map((doc, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{doc.title}</TableCell>
                                    <TableCell>{doc.subject}</TableCell>
                                    <TableCell>{doc.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
