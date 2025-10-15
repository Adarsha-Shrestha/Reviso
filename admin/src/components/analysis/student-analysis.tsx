
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, FileText, BarChart2, BrainCircuit } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const allStudents = [
  { 
    name: 'Aarav Sharma', 
    gender: 'male',
    details: { phone: '9812345670', email: 'aarav.sharma@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 85}, {term: 'Mid', score: 88}, {term: 'Final', score: 90}],
        'Network Systems': [{term: 'First', score: 70}, {term: 'Mid', score: 75}, {term: 'Final', score: 78}],
    },
    aiSummary: "Aarav is showing consistent improvement in Data Mining. Network Systems scores are steady but could be improved, especially in practical application areas."
  },
  { 
    name: 'Priya Kaur', 
    gender: 'female',
    details: { phone: '9809876543', email: 'priya.kaur@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 92}, {term: 'Mid', score: 95}, {term: 'Final', score: 98}],
        'Distributed Computing': [{term: 'First', score: 88}, {term: 'Mid', score: 90}, {term: 'Final', score: 91}],
    },
    aiSummary: "Priya is an exceptional student, excelling in both Data Mining and Distributed Computing with a clear upward trend. She consistently achieves top marks."
  },
  { 
    name: 'Rohan Thapa', 
    gender: 'male',
    details: { phone: '9845678901', email: 'rohan.thapa@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 78}, {term: 'Mid', score: 82}, {term: 'Final', score: 80}],
    },
    aiSummary: "Rohan's performance in Network Systems is solid, peaking at the mid-term. There's a slight dip in the final term, which might warrant a review of his exam preparation strategy."
  },
  { 
    name: 'Sameer Acharya', 
    gender: 'male',
    details: { phone: '9865432109', email: 'sameer.acharya@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 64}, {term: 'Mid', score: 60}, {term: 'Final', score: 68}],
    },
    aiSummary: "Sameer's scores in Data Mining are below the class average. While there's a slight improvement in the final term, he may need additional support to grasp core concepts."
  },
  { 
    name: 'Anjali Gurung', 
    gender: 'female',
    details: { phone: '9811223344', email: 'anjali.gurung@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 88}, {term: 'Mid', score: 85}, {term: 'Final', score: 90}],
    },
    aiSummary: "Anjali shows strong and improving performance in Network Systems, finishing the year with an excellent score. Her mid-term dip was temporary."
  },
  { 
    name: 'Bikash Rai', 
    gender: 'male',
    details: { phone: '9855667788', email: 'bikash.rai@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 95}, {term: 'Mid', score: 92}, {term: 'Final', score: 96}],
    },
    aiSummary: "Bikash is a top performer in Distributed Computing, demonstrating a high level of understanding throughout all terms. His performance is consistently excellent."
  },
  { 
    name: 'Sita Lama', 
    gender: 'female',
    details: { phone: '9844332211', email: 'sita.lama@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 72}, {term: 'Mid', score: 78}, {term: 'Final', score: 75}],
    },
    aiSummary: "Sita maintains a stable, on-track performance in Distributed Computing. While not at the top, her scores are consistent and show a good grasp of the subject."
  },
  { 
    name: 'Nitesh Yadav', 
    gender: 'male',
    details: { phone: '9819283746', email: 'nitesh.yadav@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 79}, {term: 'Mid', score: 81}, {term: 'Final', score: 85}],
    },
    aiSummary: "Nitesh has a positive and steady growth trajectory in Data Mining. Each term shows a clear improvement, indicating strong effort and learning."
  },
  { 
    name: 'Sunita Shrestha', 
    gender: 'female',
    details: { phone: '9801928374', email: 'sunita.shrestha@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 81}, {term: 'Mid', score: 84}, {term: 'Final', score: 80}],
    },
    aiSummary: "Sunita's performance in Network Systems is good, with a peak during the mid-term. The slight drop in the final term could be an area to investigate."
  },
  { 
    name: 'Rajesh Magar', 
    gender: 'male',
    details: { phone: '9860192837', email: 'rajesh.magar@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 68}, {term: 'Mid', score: 65}, {term: 'Final', score: 71}],
    },
    aiSummary: "Rajesh shows potential for improvement. After a dip in the mid-term, he has improved his score in the final term, which is a positive sign."
  },
    { 
    name: 'Ravi Singh', 
    gender: 'male',
    details: { phone: '1111111111', email: 'ravi.singh@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 15}, {term: 'Mid', score: 25}, {term: 'Final', score: 20}],
    },
    aiSummary: "This student is struggling significantly with Data Mining. The scores are consistently low and urgent intervention is recommended to prevent falling further behind."
  },
  { 
    name: 'Mira Devi', 
    gender: 'female',
    details: { phone: '2222222222', email: 'mira.devi@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 35}, {term: 'Mid', score: 40}, {term: 'Final', score: 45}],
    },
    aiSummary: "There is a slow but steady upward trend for this student in Data Mining. However, the scores remain in the 'Needs Help' category. Continued support is crucial."
  },
  { 
    name: 'Arjun Patel', 
    gender: 'male',
    details: { phone: '3333333333', email: 'arjun.patel@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 55}, {term: 'Mid', score: 60}, {term: 'Final', score: 58}],
    },
    aiSummary: "This student's performance in Network Systems is hovering around the passing mark. There is no significant improvement trend, indicating a potential plateau in understanding."
  },
  { 
    name: 'Pooja Reddy', 
    gender: 'female',
    details: { phone: '4444444444', email: 'pooja.reddy@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 75}, {term: 'Mid', score: 78}, {term: 'Final', score: 80}],
    },
    aiSummary: "A solid and reliable student, showing consistent and positive growth in Distributed Computing. The performance is on a good track."
  },
  { 
    name: 'Vikram Kumar', 
    gender: 'male',
    details: { phone: '5555555555', email: 'vikram.kumar@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 89}, {term: 'Mid', score: 91}, {term: 'Final', score: 93}],
    },
    aiSummary: "An excellent student with a strong command of Data Mining. The scores are consistently high and show a slight upward trend, indicating mastery."
  },
  { 
    name: 'Kiran KC', 
    gender: 'male',
    details: { phone: '6666666666', email: 'kiran.kc@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 91}, {term: 'Mid', score: 93}, {term: 'Final', score: 95}],
    },
    aiSummary: "Kiran is a top-tier student in Network Systems. His scores are not only excellent but also show a consistent pattern of improvement each term."
  },
  { 
    name: 'Manish Gupta', 
    gender: 'male',
    details: { phone: '7777777777', email: 'manish.gupta@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 58}, {term: 'Mid', score: 62}, {term: 'Final', score: 60}],
    },
    aiSummary: "Manish's performance is inconsistent. While he shows he can score higher (as in the mid-term), his final score has dropped, suggesting a need for more consistent study habits."
  },
  { 
    name: 'Gita Joshi', 
    gender: 'female',
    details: { phone: '8888888888', email: 'gita.joshi@test.com' },
    performance: {
        'Data Mining': [{term: 'First', score: 98}, {term: 'Mid', score: 99}, {term: 'Final', score: 100}],
    },
    aiSummary: "Gita's performance in Data Mining is flawless, culminating in a perfect score. She has demonstrated complete mastery of the subject."
  },
  { 
    name: 'Hari Prasad', 
    gender: 'male',
    details: { phone: '9999999999', email: 'hari.prasad@test.com' },
    performance: {
        'Network Systems': [{term: 'First', score: 45}, {term: 'Mid', score: 50}, {term: 'Final', score: 48}],
    },
    aiSummary: "Hari is struggling with Network Systems. His scores are consistently below passing, and he would benefit from foundational review and extra help."
  },
  { 
    name: 'Srijana Tamang', 
    gender: 'female',
    details: { phone: '1010101010', email: 'srijana.tamang@test.com' },
    performance: {
        'Distributed Computing': [{term: 'First', score: 82}, {term: 'Mid', score: 85}, {term: 'Final', score: 88}],
    },
    aiSummary: "Srijana shows excellent and consistent improvement in Distributed Computing. Her dedication is evident from her steady score progression."
  },
];


export function StudentAnalysis({ selectedStudent }: { selectedStudent: string | null }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        if (selectedStudent) {
            const index = allStudents.findIndex(s => s.name === selectedStudent);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [selectedStudent]);

    const student = allStudents[currentIndex];

    const goToPrevious = () => {
        setCurrentIndex(prev => (prev === 0 ? allStudents.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev === allStudents.length - 1 ? 0 : prev + 1));
    };

    const handleStudentSelect = (index: number) => {
        setCurrentIndex(index);
        setSearchOpen(false);
        setSearchQuery("");
    }

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return [];
        return allStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const trendData = useMemo(() => {
      if (!student) return [];
      const terms = ['First', 'Mid', 'Final'];
      return terms.map((term, termIndex) => {
          const dataPoint: {term: string, [key: string]: number | string} = { term: ['First Term', 'Mid Term', 'Final Term'][termIndex]};
          Object.keys(student.performance).forEach(subject => {
              const performanceRecord = student.performance[subject as keyof typeof student.performance].find(p => p.term === term);
              if (performanceRecord) {
                  dataPoint[subject] = performanceRecord.score;
              }
          });
          return dataPoint;
      });
  }, [student]);


    if (!student) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Student Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select a student to view their analysis.</p>
          </CardContent>
        </Card>
      )
    }


    return (
        <div className="space-y-8">
            <Card className="overflow-hidden">
                <CardHeader className="p-0">
                    <div className="bg-muted/30 p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-20 h-20 border-2 border-primary">
                                    <AvatarImage src={`https://picsum.photos/seed/${student.name}${student.gender === 'male' ? 'boy' : 'girl'}/150/150`} />
                                    <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-3xl">{student.name}</CardTitle>
                                    <CardDescription>{student.details.email} | {student.details.phone}</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center">
                                <Popover open={isSearchOpen} onOpenChange={setSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline">
                                            <Search className="mr-2 h-4 w-4" />
                                            Search Student
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Type a name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <ScrollArea className="h-48">
                                            {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                                                <div
                                                    key={s.name}
                                                    onClick={() => handleStudentSelect(allStudents.indexOf(s))}
                                                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                                                >
                                                    {s.name}
                                                </div>
                                            )) : <p className="p-2 text-sm text-muted-foreground">No students found.</p>}
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex items-center rounded-md border">
                                    <Button variant="ghost" size="icon" className="rounded-r-none border-r" onClick={goToPrevious}><ChevronLeft /></Button>
                                    <span className="text-sm text-muted-foreground px-3">{currentIndex + 1} of {allStudents.length}</span>
                                    <Button variant="ghost" size="icon" className="rounded-l-none border-l" onClick={goToNext}><ChevronRight /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <Alert>
                      <BrainCircuit className="h-4 w-4" />
                      <AlertTitle>AI-Powered Performance Summary</AlertTitle>
                      <AlertDescription>
                        {student.aiSummary}
                      </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary"/>
                                Term-wise Scores
                            </CardTitle>
                            <CardDescription>Detailed scores in each subject per term.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-center">First Term</TableHead>
                                        <TableHead className="text-center">Mid Term</TableHead>
                                        <TableHead className="text-center">Final Term</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.keys(student.performance).map(subject => (
                                        <TableRow key={subject}>
                                            <TableCell className="font-medium">{subject}</TableCell>
                                            <TableCell className="text-center">{student.performance[subject as keyof typeof student.performance].find(p => p.term === 'First')?.score || 'N/A'}</TableCell>
                                            <TableCell className="text-center">{student.performance[subject as keyof typeof student.performance].find(p => p.term === 'Mid')?.score || 'N/A'}</TableCell>
                                            <TableCell className="text-center">{student.performance[subject as keyof typeof student.performance].find(p => p.term === 'Final')?.score || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-primary"/>
                                Performance Trend
                            </CardTitle>
                            <CardDescription>Score progression across different terms.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2 h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="term" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ 
                                            background: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                                    {Object.keys(student.performance).map((subject, i) => (
                                        <Line key={subject} type="monotone" dataKey={subject} stroke={`hsl(var(--chart-${(i % 5) + 1}))`} strokeWidth={2} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    )
}
