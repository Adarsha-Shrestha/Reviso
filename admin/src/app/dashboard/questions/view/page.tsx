
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "../new/page";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialExams: Exam[] = [
    {
        topic: "Mid-Term: Data Structures",
        subject: "Data Mining",
        date: "2024-04-15",
        type: "exam",
        gradingType: "auto",
        questions: [
            { question: "Explain the difference between an array and a linked list, highlighting their respective strengths and weaknesses.", marks: 10 },
            { question: "Describe the process of a binary search on a sorted array. What is its time complexity?", marks: 10 },
            { question: "What is a hash table? Explain how collisions are handled using chaining.", marks: 10 },
            { question: "Differentiate between a stack and a queue. Provide one real-world example for each.", marks: 10 },
            { question: "What are the key properties of a Binary Search Tree (BST)?", marks: 10 },
            { question: "Explain the bubble sort algorithm and its time complexity. Why is it not suitable for large datasets?", marks: 10 },
            { question: "What is recursion? Provide a simple example of a recursive function.", marks: 10 },
            { question: "Compare and contrast Breadth-First Search (BFS) and Depth-First Search (DFS) for graph traversal.", marks: 10 },
            { question: "What is Big O notation, and why is it important in algorithm analysis?", marks: 10 },
            { question: "Describe what a min-heap is and its primary properties.", marks: 10 },
        ]
    },
    {
        topic: "Chapter 3 Quiz: OSI Model",
        subject: "Network Systems",
        date: "2024-05-02",
        type: "quiz",
        gradingType: "auto",
        questions: [
            { question: "Which layer of the OSI model is responsible for data encryption and compression?", options: [{value: "Application Layer"}, {value: "Presentation Layer"}, {value: "Session Layer"}, {value: "Transport Layer"}], correctAnswer: "2", marks: 5 },
            { question: "What is the primary function of a subnet mask in an IP network?", options: [{value: "To identify the host portion of an IP address"}, {value: "To identify the network portion of an IP address"}, {value: "To provide a default gateway"}, {value: "To resolve domain names"}], correctAnswer: "2", marks: 5 },
            { question: "The Physical Layer of the OSI model deals with which of the following?", options: [{value: "IP addressing"}, {value: "Error detection"}, {value: "Bit transmission"}, {value: "Flow control"}], correctAnswer: "3", marks: 5 },
            { question: "Which device operates primarily at the Data Link layer (Layer 2)?", options: [{value: "Router"}, {value: "Hub"}, {value: "Switch"}, {value: "Repeater"}], correctAnswer: "3", marks: 5 },
            { question: "TCP is a connection-oriented protocol that operates at which layer?", options: [{value: "Network Layer"}, {value: "Transport Layer"}, {value: "Session Layer"}, {value: "Application Layer"}], correctAnswer: "2", marks: 5 },
            { question: "Which layer is responsible for logical addressing and routing?", options: [{value: "Physical Layer"}, {value: "Data Link Layer"}, {value: "Network Layer"}, {value: "Transport Layer"}], correctAnswer: "3", marks: 5 },
            { question: "What does 'MAC' stand for in the context of networking?", options: [{value: "Media Access Control"}, {value: "Machine Address Code"}, {value: "Mobile Access Carrier"}, {value: "Master Access Control"}], correctAnswer: "1", marks: 5 },
            { question: "A hub operates at which layer of the OSI model?", options: [{value: "Physical Layer"}, {value: "Data Link Layer"}, {value: "Network Layer"}, {value: "Session Layer"}], correctAnswer: "1", marks: 5 },
            { question: "The process of adding headers at each layer is known as what?", options: [{value: "Encapsulation"}, {value: "Decapsulation"}, {value: "Fragmentation"}, {value: "Segmentation"}], correctAnswer: "1", marks: 5 },
            { question: "HTTP operates at which layer of the OSI model?", options: [{value: "Transport Layer"}, {value: "Session Layer"}, {value: "Presentation Layer"}, {value: "Application Layer"}], correctAnswer: "4", marks: 5 },
        ]
    },
    {
        topic: "Final Exam Prep: Distributed Systems",
        subject: "Distributed Computing",
        date: "2024-05-20",
        type: "exam",
        gradingType: "self-check",
        questions: [
            { question: "What is the CAP theorem and what are its implications for distributed database design?", marks: 15 },
            { question: "Compare and contrast monoliths and microservices. List three advantages of a microservices architecture.", marks: 15 },
            { question: "Explain the concept of 'eventual consistency' in distributed systems.", marks: 10 },
            { question: "Describe the role of a load balancer in a distributed architecture.", marks: 10 },
            { question: "What is idempotency in the context of distributed systems and why is it important?", marks: 10 },
            { question: "Explain the 'Leader Election' pattern in distributed systems.", marks: 10 },
            { question: "What is the difference between synchronous and asynchronous communication in microservices?", marks: 10 },
            { question: "Describe how a message queue, like RabbitMQ or Kafka, works.", marks: 10 },
            { question: "What is a 'service mesh' (e.g., Istio) and what problems does it solve?", marks: 10 },
            { question: "Explain the concept of 'sharding' in the context of databases.", marks: 10 },
        ]
    },
     {
        topic: "Quiz: Core Java Concepts",
        subject: "Data Mining",
        date: "2024-05-25",
        type: "quiz",
        gradingType: "auto",
        questions: [
            { question: "Which of these keywords is used to make a class abstract?", options: [{value: "abstract"}, {value: "final"}, {value: "static"}, {value: "native"}], correctAnswer: "1", marks: 5 },
            { question: "What is the default value of a boolean variable in Java?", options: [{value: "true"}, {value: "false"}, {value: "null"}, {value: "0"}], correctAnswer: "2", marks: 5 },
            { question: "Which collection class allows unique elements only?", options: [{value: "ArrayList"}, {value: "HashMap"}, {value: "HashSet"}, {value: "LinkedList"}], correctAnswer: "3", marks: 5 },
            { question: "What is the purpose of the `super` keyword in Java?", options: [{value: "To access the superclass members"}, {value: "To define a superclass"}, {value: "To create a new instance"}, {value: "To declare a static method"}], correctAnswer: "1", marks: 5 },
            { question: "Which of these is not a feature of Java?", options: [{value: "Object-oriented"}, {value: "Platform independent"}, {value: "Use of pointers"}, {value: "Robust"}], correctAnswer: "3", marks: 5 },
            { question: "What is the root class of all classes in Java?", options: [{value: "Object"}, {value: "Class"}, {value: "System"}, {value: "Main"}], correctAnswer: "1", marks: 5 },
            { question: "Which keyword is used to prevent a method from being overridden?", options: [{value: "static"}, {value: "private"}, {value: "final"}, {value: "abstract"}], correctAnswer: "3", marks: 5 },
            { question: "What is an interface in Java?", options: [{value: "A class that can have instances"}, {value: "A blueprint of a class with static constants and abstract methods"}, {value: "A concrete class"}, {value: "A way to achieve multiple inheritance of state"}], correctAnswer: "2", marks: 5 },
            { question: "Which exception is thrown when an arithmetic operation results in an error?", options: [{value: "IOException"}, {value: "ArithmeticException"}, {value: "NumberFormatException"}, {value: "ArrayIndexOutOfBoundsException"}], correctAnswer: "2", marks: 5 },
            { question: "What does the `finally` block do in a try-catch-finally statement?", options: [{value: "It executes only when an exception occurs"}, {value: "It is optional and rarely used"}, {value: "It always executes, regardless of whether an exception occurred"}, {value: "It executes only if no exception occurs"}], correctAnswer: "3", marks: 5 },
        ]
    }
];

export default function ViewExamsPage() {
  const [allExams, setAllExams] = useState<Exam[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch this from a database.
    // For now, we use localStorage to persist across reloads.
    let storedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    if (storedExams.length === 0) {
        storedExams = initialExams;
        localStorage.setItem('allExams', JSON.stringify(initialExams));
    }
    setAllExams(storedExams);
  }, []);

  const getGradingLabel = (gradingType: string | undefined) => {
    if (gradingType === 'auto') return 'Auto Grade';
    if (gradingType === 'self-check') return 'Self Grade';
    return 'N/A';
  }

  const getSubjectValue = (subjectLabel: string | undefined) => {
    if (!subjectLabel) return "all-subjects";
    return subjectLabel.toLowerCase().replace(/\s+/g, '-');
  }

  return (
    <div className="container mx-auto py-12 px-6 md:px-12 lg:px-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Added Exams</h1>
        <p className="text-muted-foreground">
          Review previously created exams and quizzes. Click on an exam to see a detailed performance analysis.
        </p>
      </header>

      <Card>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {allExams.length > 0 ? (
              allExams.map((exam, examIndex) => (
                <AccordionItem value={`exam-${examIndex}`} key={examIndex}>
                    <AccordionTrigger>
                      <div className="flex flex-1 justify-between w-full items-center pr-4 text-left">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold">{exam.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{exam.subject}</span>
                             <span className="text-xs text-muted-foreground hidden sm:inline-block">&bull;</span>
                            <span className="text-sm text-muted-foreground hidden sm:inline-block">Conducted on: {exam.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                           <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                              <Link href={{ pathname: '/dashboard/analysis/exam', query: { exam: JSON.stringify(exam) } }}>
                                <BarChart2 className="mr-2 h-4 w-4" />
                                View Analysis
                              </Link>
                           </Button>
                          <Badge
                            variant={exam.type === "quiz" ? "secondary" : "outline"}
                          >
                            {exam.type}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-4 mb-4 items-start justify-between">
                       <div className="flex-1 min-w-[200px]">
                         {exam.description && (
                            <div className="p-4 bg-muted/20 rounded-md border-l-4 border-primary mb-4">
                                <p className="font-medium">Exam Description:</p>
                                <p className="text-sm text-muted-foreground">{exam.description}</p>
                            </div>
                        )}
                         <div className="p-4 bg-muted/20 rounded-md border-l-4 border-primary sm:flex-none">
                              <p className="font-medium">Grading:</p>
                              <p className="text-sm text-muted-foreground">{getGradingLabel(exam.gradingType)}</p>
                          </div>
                       </div>
                    </div>

                    {exam.questions.map((q, qIndex) => (
                      <div
                        className="p-4 bg-muted/50 rounded-md mb-2"
                        key={qIndex}
                      >
                        <div className="flex justify-between items-start">
                          <p>
                            <strong>Question {qIndex + 1}:</strong> {q.question}
                          </p>
                          <Badge variant="outline">Marks: {q.marks}</Badge>
                        </div>
                        {exam.type === "quiz" &&
                          q.options &&
                          q.options.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Options:</p>
                              <ul className="list-disc pl-5 mt-1">
                                {q.options.map((opt, optIndex) => (
                                  <li
                                    key={optIndex}
                                    className={
                                      q.correctAnswer === `${optIndex + 1}`
                                        ? "font-bold"
                                        : ""
                                    }
                                  >
                                    {opt.value}
                                    {q.correctAnswer ===
                                      `${optIndex + 1}` && (
                                      <span className="text-primary ml-2">
                                        (Correct)
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        {q.suggestion && (
                          <div className="mt-2">
                            <p className="font-medium">Suggestion:</p>
                            <p className="text-sm text-muted-foreground">
                              {q.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No exams created yet. Go to 'New Exam/Quiz' to add one.
              </p>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
