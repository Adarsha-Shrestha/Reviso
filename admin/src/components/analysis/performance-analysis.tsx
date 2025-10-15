
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { User, TrendingUp, TrendingDown, HelpCircle, Target, Award, ShieldAlert, Percent } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

// Mock data, in a real app this would be fetched or calculated
const performanceDataBySubject: any = {
    "all-subjects": {
        label: "All Subjects",
        averageScore: 78.5,
        passRate: 85,
        topPerformer: { name: "Bikash Rai", score: 95 },
        lowestPerformer: { name: "Ravi Singh", score: 15 },
        mostDifficultQuestion: { id: "Q5", topic: "Advanced Memory Management", attempts: 20, correct: 4 },
        questionStats: [
            { id: "Q1", topic: "Intro to Pointers", difficulty: "Easy", attempts: 20, correct: 19, correctRate: 95 },
            { id: "Q2", topic: "Async/Await", difficulty: "Medium", attempts: 20, correct: 16, correctRate: 82 },
            { id: "Q3", topic: "Data Structures", difficulty: "Medium", attempts: 20, correct: 15, correctRate: 75 },
            { id: "Q4", topic: "Closures", difficulty: "Hard", attempts: 20, correct: 12, correctRate: 60 },
            { id: "Q5", topic: "Advanced Memory Management", difficulty: "Hard", attempts: 20, correct: 4, correctRate: 20 },
        ]
    },
    "data-mining": {
        label: "Data Mining",
        averageScore: 82.1,
        passRate: 90,
        topPerformer: { name: "Gita Joshi", score: 99 },
        lowestPerformer: { name: "Ravi Singh", score: 20 },
        mostDifficultQuestion: { id: "DM3", topic: "Clustering Algorithms", attempts: 8, correct: 3 },
        questionStats: [
            { id: "DM1", topic: "Intro to Data Mining", difficulty: "Easy", attempts: 8, correct: 8, correctRate: 98 },
            { id: "DM2", topic: "Decision Trees", difficulty: "Medium", attempts: 8, correct: 7, correctRate: 85 },
            { id: "DM3", topic: "Clustering Algorithms", difficulty: "Hard", attempts: 8, correct: 3, correctRate: 38 },
        ]
    },
    "network-systems": {
        label: "Network Systems",
        averageScore: 75.4,
        passRate: 82,
        topPerformer: { name: "Kiran KC", score: 93 },
        lowestPerformer: { name: "Hari Prasad", score: 48 },
        mostDifficultQuestion: { id: "NS2", topic: "Subnetting", attempts: 7, correct: 2 },
         questionStats: [
            { id: "NS1", topic: "OSI Model", difficulty: "Easy", attempts: 7, correct: 6, correctRate: 92 },
            { id: "NS2", topic: "Subnetting", difficulty: "Hard", attempts: 7, correct: 2, correctRate: 29 },
            { id: "NS3", topic: "Routing Protocols", difficulty: "Medium", attempts: 7, correct: 5, correctRate: 78 },
        ]
    },
    "distributed-computing": {
        label: "Distributed Computing",
        averageScore: 79.8,
        passRate: 88,
        topPerformer: { name: "Bikash Rai", score: 96 },
        lowestPerformer: { name: "Manish Gupta", score: 60 },
        mostDifficultQuestion: { id: "DC3", topic: "Consensus Algorithms", attempts: 5, correct: 1 },
        questionStats: [
            { id: "DC1", topic: "CAP Theorem", difficulty: "Medium", attempts: 5, correct: 4, correctRate: 88 },
            { id: "DC2", topic: "MapReduce", difficulty: "Medium", attempts: 5, correct: 4, correctRate: 81 },
            { id: "DC3", topic: "Consensus Algorithms", difficulty: "Hard", attempts: 5, correct: 1, correctRate: 20 },
        ]
    }
};

export function PerformanceAnalysis({ initialSubject }: { initialSubject: string | null }) {
    const [selectedSubject, setSelectedSubject] = useState(initialSubject || "all-subjects");
    const performanceData = performanceDataBySubject[selectedSubject];

    return (
        <div className="grid gap-8">
            <div className="flex justify-end">
                 <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all-subjects">All Subjects</SelectItem>
                    <SelectItem value="data-mining">Data Mining</SelectItem>
                    <SelectItem value="network-systems">Network Systems</SelectItem>
                    <SelectItem value="distributed-computing">Distributed Computing</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.averageScore}%</div>
                        <p className="text-xs text-muted-foreground">in {performanceData.label}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.passRate}%</div>
                        <p className="text-xs text-muted-foreground">Students meeting passing criteria</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.topPerformer.name}</div>
                        <p className="text-xs text-muted-foreground">Score: {performanceData.topPerformer.score}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.lowestPerformer.name}</div>
                        <p className="text-xs text-muted-foreground">Score: {performanceData.lowestPerformer.score}%</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid md:grid-cols-5 gap-8">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Question Performance Breakdown</CardTitle>
                        <CardDescription>Analysis of student performance on each question for the selected subject.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Difficulty</TableHead>
                                    <TableHead>Attempts</TableHead>
                                    <TableHead className="text-right">Correct Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performanceData.questionStats.map((q: any) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-medium">{q.topic}</TableCell>
                                        <TableCell>
                                            <Badge variant={q.difficulty === 'Hard' ? 'destructive' : q.difficulty === 'Easy' ? 'secondary' : 'outline'}>
                                                {q.difficulty}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{q.attempts}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>{q.correctRate}%</span>
                                                <Progress value={q.correctRate} className="w-20" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HelpCircle /> Most Difficult Question</CardTitle>
                        <CardDescription>The question with the lowest correct answer rate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <div>
                                <p className="text-sm font-medium">Question Topic</p>
                                <p className="font-semibold">{performanceData.mostDifficultQuestion.topic}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Attempts</p>
                                    <p className="font-semibold">{performanceData.mostDifficultQuestion.attempts}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Correct Answers</p>
                                    <p className="font-semibold">{performanceData.mostDifficultQuestion.correct}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Success Rate</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-semibold text-destructive">{((performanceData.mostDifficultQuestion.correct / performanceData.mostDifficultQuestion.attempts) * 100).toFixed(0)}%</p>
                                    <Progress value={((performanceData.mostDifficultQuestion.correct / performanceData.mostDifficultQuestion.attempts) * 100)} variant="destructive" className="flex-1"/>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
