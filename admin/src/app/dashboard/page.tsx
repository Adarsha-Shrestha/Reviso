
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Target, BookOpen, ArrowRight, FileText } from "lucide-react";
import type { Exam } from "./questions/new/page";


const studentData = [
  { name: 'Aarav Sharma', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'first-term', score: 85, status: 'On Track', details: { phone: '9812345670', email: 'aarav.sharma@test.com' }, gender: 'male' },
  { name: 'Priya Kaur', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'first-term', score: 92, status: 'Excelling', details: { phone: '9809876543', email: 'priya.kaur@test.com' }, gender: 'female' },
  { name: 'Rohan Thapa', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'mid-term', score: 78, status: 'On Track', details: { phone: '9845678901', email: 'rohan.thapa@test.com' }, gender: 'male' },
  { name: 'Sameer Acharya', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'mid-term', score: 64, status: 'Needs Help', details: { phone: '9865432109', email: 'sameer.acharya@test.com' }, gender: 'male' },
  { name: 'Anjali Gurung', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'final-term', score: 88, status: 'Excelling', details: { phone: '9811223344', email: 'anjali.gurung@test.com' }, gender: 'female' },
  { name: 'Bikash Rai', subject: 'Distributed Computing', subjectValue: 'distributed-computing', examType: 'first-term', score: 95, status: 'Excelling', details: { phone: '9855667788', email: 'bikash.rai@test.com' }, gender: 'male' },
  { name: 'Sita Lama', subject: 'Distributed Computing', subjectValue: 'distributed-computing', examType: 'mid-term', score: 72, status: 'On Track', details: { phone: '9844332211', email: 'sita.lama@test.com' }, gender: 'female' },
  { name: 'Nitesh Yadav', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'final-term', score: 79, status: 'On Track', details: { phone: '9819283746', email: 'nitesh.yadav@test.com' }, gender: 'male' },
  { name: 'Sunita Shrestha', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'first-term', score: 81, status: 'On Track', details: { phone: '9801928374', email: 'sunita.shrestha@test.com' }, gender: 'female' },
  { name: 'Rajesh Magar', subject: 'Distributed Computing', subjectValue: 'distributed-computing', examType: 'final-term', score: 68, status: 'Needs Help', details: { phone: '9860192837', email: 'rajesh.magar@test.com' }, gender: 'male' },
  { name: 'Ravi Singh', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'first-term', score: 15, status: 'Needs Help', details: { phone: '1111111111', email: 'ravi.singh@test.com' }, gender: 'male' },
  { name: 'Mira Devi', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'mid-term', score: 35, status: 'Needs Help', details: { phone: '2222222222', email: 'mira.devi@test.com' }, gender: 'female' },
  { name: 'Arjun Patel', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'first-term', score: 55, status: 'On Track', details: { phone: '3333333333', email: 'arjun.patel@test.com' }, gender: 'male' },
  { name: 'Pooja Reddy', subject: 'Distributed Computing', subjectValue: 'distributed-computing', examType: 'final-term', score: 75, status: 'On Track', details: { phone: '4444444444', email: 'pooja.reddy@test.com' }, gender: 'female' },
  { name: 'Vikram Kumar', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'final-term', score: 91, status: 'Excelling', details: { phone: '9812345678', email: 'vikram.kumar@test.com' }, gender: 'male' },
  { name: 'Kiran KC', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'final-term', score: 93, status: 'Excelling', details: { phone: '9823456789', email: 'kiran.kc@test.com' }, gender: 'male' },
  { name: 'Manish Gupta', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'mid-term', score: 62, status: 'On Track', details: { phone: '9834567890', email: 'manish.gupta@test.com' }, gender: 'male' },
  { name: 'Gita Joshi', subject: 'Distributed Computing', subjectValue: 'distributed-computing', examType: 'first-term', score: 99, status: 'Excelling', details: { phone: '9845678901', email: 'gita.joshi@test.com' }, gender: 'female' },
  { name: 'Hari Prasad', subject: 'Data Mining', subjectValue: 'data-mining', examType: 'mid-term', score: 50, status: 'Needs Help', details: { phone: '9856789012', email: 'hari.prasad@test.com' }, gender: 'male' },
  { name: 'Srijana Tamang', subject: 'Network Systems', subjectValue: 'network-systems', examType: 'final-term', score: 85, status: 'Excelling', details: { phone: '9867890123', email: 'srijana.tamang@test.com' }, gender: 'female' },
];

const performanceDistributionData = [
  { status: "Excelling", value: studentData.filter(s => s.status === 'Excelling').length, fill: "hsl(var(--chart-2))" },
  { status: "On Track", value: studentData.filter(s => s.status === 'On Track').length, fill: "hsl(var(--chart-1))" },
  { status: "Needs Help", value: studentData.filter(s => s.status === 'Needs Help').length, fill: "hsl(var(--chart-5))" },
];

const subjectAverageData = [
  { subject: "Data Mining", average: 82.1 },
  { subject: "Network Systems", average: 75.4 },
  { subject: "Distributed Comp.", average: 79.8 },
  { subject: "Java", average: 88.2 },
  { subject: "Algorithms", average: 72.5 },
];


export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all-subjects");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    // In a real app, these would be fetched from a database.
    const storedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    setAllExams(storedExams.slice(0, 3)); // Get recent 3 exams
    
    // Mock recent documents for now
    const docs = [
      { title: "Data Mining Concepts", subject: "Data Mining", date: "2024-05-10" },
      { title: "OSI Model", subject: "Network Systems", date: "2024-05-08" },
      { title: "Intro to Distributed Systems", subject: "Distributed Computing", date: "2024-05-05" },
    ];
    setRecentDocuments(docs as any);

  }, []);

  const filteredStudents = studentData.filter((student) => {
    const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const subjectMatch = subjectFilter === "all-subjects" || student.subjectValue === subjectFilter;
    const statusMatch = statusFilter === "all-status" || student.status === statusFilter;
    return nameMatch && subjectMatch && statusMatch;
  });

  const getStatusVariant = (status: string) => {
    if (status === 'Excelling') return 'default';
    if (status === 'On Track') return 'secondary';
    if (status === 'Needs Help') return 'destructive';
    return 'outline';
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 lg:px-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Welcome back, Admin!</h1>
        <p className="text-muted-foreground">
          Here's a quick overview of your students' performance and activities.
        </p>
      </header>

      <div className="grid gap-8 mb-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>
                A visual representation of how the students are grouped based on their performance status.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={performanceDistributionData} layout="vertical" margin={{ left: 10, right: 20}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" width={80} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Status
                                </span>
                                <span className="font-bold text-foreground">
                                  {payload[0].payload.status}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Students
                                </span>
                                <span className="font-bold">
                                  {payload[0].value}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Students" layout="vertical" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
               <Button asChild className="w-full">
                <Link href="/dashboard/analysis?view=performance">
                  View Detailed Report <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Subject Averages</CardTitle>
              <CardDescription>Average student scores across different subjects.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0,100]} hide />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <span className="font-bold text-foreground">
                                {payload[0].payload.subject}: {payload[0].value}%
                              </span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Link href="/dashboard/analysis?view=performance">
                    Compare Subjects <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 mb-8 md:grid-cols-3">
          <Card>
              <CardHeader>
                  <CardTitle>Recent Exams</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {allExams.map((exam, index) => (
                          <div key={index} className="flex justify-between items-center">
                              <div>
                                  <p className="font-medium">{exam.topic}</p>
                                  <p className="text-sm text-muted-foreground">{exam.subject}</p>
                              </div>
                              <Button asChild variant="secondary" size="sm">
                                  <Link href={{ pathname: '/dashboard/analysis/exam', query: { exam: JSON.stringify(exam) } }}>View</Link>
                              </Button>
                          </div>
                      ))}
                  </div>
              </CardContent>
              <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/questions/view">View All Exams</Link>
                  </Button>
              </CardFooter>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {recentDocuments.map((doc: any, index) => (
                          <div key={index} className="flex justify-between items-center">
                              <div>
                                  <p className="font-medium">{doc.title}</p>
                                  <p className="text-sm text-muted-foreground">{doc.subject}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{doc.date}</p>
                          </div>
                      ))}
                  </div>
              </CardContent>
              <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/documents">Manage Documents</Link>
                  </Button>
              </CardFooter>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/questions/new"><FileText className="mr-2"/>New Exam</Link>
                  </Button>
                   <Button asChild variant="outline">
                    <Link href="/dashboard/documents"><BookOpen className="mr-2"/>Upload Doc</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/analysis?view=students"><Users className="mr-2"/>Student Report</Link>
                  </Button>
                   <Button asChild variant="outline">
                    <Link href="/dashboard/analysis?view=performance"><Target className="mr-2"/>Perf. Report</Link>
                  </Button>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Overview</CardTitle>
          <CardDescription>
            A sortable and filterable list of all students in your class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-subjects">All Subjects</SelectItem>
                <SelectItem value="data-mining">Data Mining</SelectItem>
                <SelectItem value="network-systems">Network Systems</SelectItem>
                <SelectItem value="distributed-computing">Distributed Computing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Statuses</SelectItem>
                <SelectItem value="Excelling">Excelling</SelectItem>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="Needs Help">Needs Help</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Latest Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${student.name}${student.gender === 'male' ? 'boy' : 'girl'}/100/100`} />
                        <AvatarFallback>{student.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground hidden md:block">{student.details.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.subject}</TableCell>
                  <TableCell>{student.score}%</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(student.status)}>{student.status}</Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                       <Link href={`/dashboard/analysis?view=students&student=${encodeURIComponent(student.name)}`}>
                        View Profile
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
