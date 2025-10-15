
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Exam, Question } from '../../questions/new/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Mock student performance data for a given exam
const studentExamPerformance = [
  { name: 'Aarav Sharma', gender: 'male', score: 88, status: 'Excelling', answers: [{ qIndex: 0, answer: "An array is a static data structure with a fixed size, while a linked list is a dynamic data structure that can grow or shrink." }, { qIndex: 1, answer: "Binary search works on a sorted array by repeatedly dividing the search interval in half." }, { qIndex: 2, answer: "Chaining involves placing elements that hash to the same bucket into a linked list." }, { qIndex: 3, answer: "Stack is LIFO, like a stack of plates. Queue is FIFO, like a checkout line." }, { qIndex: 4, answer: "All left children are less than the root, all right children are greater." }, { qIndex: 5, answer: "Bubble sort is simple but inefficient for large lists, with a time complexity of O(n^2)." }, { qIndex: 6, answer: "Recursion is when a function calls itself. It needs a base case to stop." }, { qIndex: 7, answer: "BFS explores neighbors first (level by level), using a queue. DFS explores as far as possible along each branch, using a stack." }, { qIndex: 8, answer: "Big O notation describes the upper bound of an algorithm's complexity." }, { qIndex: 9, answer: "A min-heap is a complete binary tree where the value of each node is less than or equal to the value of its children." }] },
  { name: 'Priya Kaur', gender: 'female', score: 95, status: 'Excelling', answers: [{ qIndex: 0, answer: "Array stores elements in contiguous memory locations. A linked list stores elements randomly with each element pointing to the next." }, { qIndex: 1, answer: "It compares the target value to the middle element of the array. If they are not equal, the half in which the target cannot lie is eliminated." }, { qIndex: 2, answer: "A hash table uses a hash function to map keys to indices. Collisions are handled by creating a list of elements for each index." }, { qIndex: 3, answer: "Stack: function call stack. Queue: print job queue." }, { qIndex: 4, answer: "The left subtree of a node contains only nodes with keys lesser than the node's key." }, { qIndex: 5, answer: "Bubble sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order." }, { qIndex: 6, answer: "A recursive function must have a base case to terminate." }, { qIndex: 7, answer: "BFS uses a queue, while DFS uses a stack for traversal." }, { qIndex: 8, answer: "It classifies algorithms according to their running time or space requirements as the input size grows." }, { qIndex: 9, answer: "The root of a min-heap is the smallest element in the heap." }] },
  { name: 'Rohan Thapa', gender: 'male', score: 82, status: 'On Track', answers: [{ qIndex: 0, answer: "Arrays have better cache locality. Linked lists are more flexible for insertions and deletions." }, { qIndex: 1, answer: "The search continues on the remaining half until the value is found or the interval is empty." }, { qIndex: 2, answer: "When two keys hash to the same index, the key-value pairs are stored in a linked list at that index." }, { qIndex: 3, answer: "Stack is Last-In-First-Out. Queue is First-In-First-Out." }, { qIndex: 4, answer: "The right subtree of a node contains only nodes with keys greater than the node's key." }, { qIndex: 5, answer: "It's a comparison-based algorithm. The pass through the list is repeated until the list is sorted." }, { qIndex: 6, answer: "Recursion is solving a problem by solving smaller instances of the same problem." }, { qIndex: 7, answer: "BFS is better for finding the shortest path between two nodes. DFS is better for exploring all paths." }, { qIndex: 8, answer: "It's used to analyze the performance of an algorithm." }, { qIndex: 9, answer: "In a min-heap, the parent node is always smaller than its children." }] },
  { name: 'Sameer Acharya', gender: 'male', score: 65, status: 'Needs Help', answers: [{ qIndex: 0, answer: "Array is a collection of items." }, { qIndex: 1, answer: "It is a searching algorithm." }, { qIndex: 2, answer: "It's a way to handle hash collisions." }, { qIndex: 3, answer: "One is LIFO one is FIFO" }, { qIndex: 4, answer: "It's a type of tree." }, { qIndex: 5, answer: "A type of sort." }, { qIndex: 6, answer: "A function that repeats." }, { qIndex: 7, answer: "Two ways to search a graph." }, { qIndex: 8, answer: "Complexity." }, { qIndex: 9, answer: "It's a heap." }] },
  { name: 'Anjali Gurung', gender: 'female', score: 90, status: 'Excelling', answers: [{ qIndex: 0, answer: "An array's size is determined at compile time, whereas a linked list's size can change at runtime." }, { qIndex: 1, answer: "It is an efficient algorithm with a time complexity of O(log n)." }, { qIndex: 2, answer: "Each slot of the hash table is a pointer to a linked list that contains the key-value pairs that hashed to the same location." }, { qIndex: 3, answer: "Stack follows LIFO. Queue follows FIFO." }, { qIndex: 4, answer: "Both the left and right subtrees must also be binary search trees." }, { qIndex: 5, answer: "Its main advantage is its simplicity. However, it is too slow for most practical uses." }, { qIndex: 6, answer: "The process in which a function calls itself directly or indirectly is called recursion." }, { qIndex: 7, answer: "BFS finds the shortest path, while DFS can get trapped in long branches." }, { qIndex: 8, answer: "It describes the worst-case scenario for an algorithm's performance." }, { qIndex: 9, answer: "A min-heap is a binary heap where the parent nodes are less than or equal to their children." }] },
  { name: 'Bikash Rai', gender: 'male', score: 92, status: 'Excelling', answers: [{ qIndex: 0, answer: "An array is a collection of homogeneous data types." }, { qIndex: 1, answer: "The prerequisite for binary search is that the array must be sorted." }, { qIndex: 2, answer: "In chaining, each hash table slot contains a linked list of colliding entries." }, { qIndex: 3, answer: "A stack is like a pez dispenser. A queue is like a line for a roller coaster." }, { qIndex: 4, answer: "For any given node, all values in the left subtree are smaller, and all values in the right are larger." }, { qIndex: 5, answer: "It's not practical for large datasets due to its average and worst-case complexity of O(n^2)." }, { qIndex: 6, answer: "Every recursive solution can be converted to an iterative one." }, { qIndex: 7, answer: "BFS explores level by level. DFS explores branch by branch." }, { qIndex: 8, answer: "It's a mathematical notation to describe the limiting behavior of a function when the argument tends towards a particular value or infinity." }, { qIndex: 9, answer: "The min-heap property states that the key of a node is less than or equal to the keys of its children." }] },
  { name: 'Sita Lama', gender: 'female', score: 78, status: 'On Track', answers: [{ qIndex: 0, answer: "A linked list is made of nodes, where each node contains data and a pointer to the next node." }, { qIndex: 1, answer: "You compare the key with the middle element." }, { qIndex: 2, answer: "You use a linked list for entries that have the same hash." }, { qIndex: 3, answer: "Stack is for reversing things. Queue is for ordering things." }, { qIndex: 4, answer: "It allows for fast lookup, addition and removal of items." }, { qIndex: 5, answer: "It's a simple sorting algorithm." }, { qIndex: 6, answer: "A function calling itself." }, { qIndex: 7, answer: "Graph traversal algorithms. One uses a queue, the other a stack." }, { qIndex: 8, answer: "A way to measure how fast an algorithm is." }, { qIndex: 9, answer: "A heap where the smallest value is at the top." }] },
  { name: 'Nitesh Yadav', gender: 'male', score: 81, status: 'On Track', answers: [{ qIndex: 0, answer: "Accessing an element in an array is faster (O(1)), while it is slower in a linked list (O(n))." }, { qIndex: 1, answer: "If the key is smaller than the middle element, you search the left half." }, { qIndex: 2, answer: "If a hash function produces the same index for multiple keys, the records are stored in a list." }, { qIndex: 3, answer: "Stack: undo/redo feature. Queue: CPU scheduling." }, { qIndex: 4, answer: "A node's left child must have a key less than the parent; the right child must have a key greater than the parent." }, { qIndex: 5, answer: "It is named for the way smaller or larger elements 'bubble' to the top of the list." }, { qIndex: 6, answer: "A function that solves a problem by breaking it into smaller, self-similar problems." }, { qIndex: 7, answer: "BFS guarantees finding the shortest path in an unweighted graph. DFS does not." }, { qIndex: 8, answer: "It measures the growth rate of an algorithm's resource usage." }, { qIndex: 9, answer: "It's a type of binary heap. The value of any node is smaller than or equal to the value of its children." }] },
  { name: 'Sunita Shrestha', gender: 'female', score: 84, status: 'On Track', answers: [{ qIndex: 0, answer: "Linked lists require more memory due to the storage of pointers." }, { qIndex: 1, answer: "If the key is larger, you search the right half." }, { qIndex: 2, answer: "It resolves collisions by storing all colliding keys in a linked list." }, { qIndex: 3, answer: "Stack: LIFO. Example is a browser's back button. Queue: FIFO. Example is a message queue." }, { qIndex: 4, answer: "No duplicate keys are allowed." }, { qIndex: 5, answer: "The bubble sort algorithm is stable." }, { qIndex: 6, answer: "A base case is crucial to prevent infinite recursion." }, { qIndex: 7, answer: "BFS is complete, meaning it will find a solution if one exists. DFS is not always complete." }, { qIndex: 8, answer: "It helps in comparing the efficiency of different algorithms." }, { qIndex: 9, answer: "In a min-heap, the root node contains the minimum value." }] },
  { name: 'Rajesh Magar', gender: 'male', score: 71, status: 'On Track', answers: [{ qIndex: 0, answer: "An array holds data of the same type." }, { qIndex: 1, answer: "It's a divide and conquer algorithm." }, { qIndex: 2, answer: "Collisions are when you get the same hash." }, { qIndex: 3, answer: "Stack is like a pile of books. Queue is a line of people." }, { qIndex: 4, answer: "It is a node-based binary tree data structure." }, { qIndex: 5, answer: "It compares each pair of adjacent items." }, { qIndex: 6, answer: "A function can call itself." }, { qIndex: 7, answer: "BFS explores wide, DFS explores deep." }, { qIndex: 8, answer: "Big O." }, { qIndex: 9, answer: "The smallest is at the root." }] },
  { name: 'Ravi Singh', gender: 'male', score: 25, status: 'Needs Help', answers: [{ qIndex: 0, answer: "idk" }, { qIndex: 1, answer: "fast search" }, { qIndex: 2, answer: "hashing" }, { qIndex: 3, answer: "types of lists" }, { qIndex: 4, answer: "a tree" }, { qIndex: 5, answer: "sorting" }, { qIndex: 6, answer: "repeating" }, { qIndex: 7, answer: "graph search" }, { qIndex: 8, answer: "complexity" }, { qIndex: 9, answer: "heap" }] },
  { name: 'Mira Devi', gender: 'female', score: 40, status: 'Needs Help', answers: [{ qIndex: 0, answer: "one is a list" }, { qIndex: 1, answer: "It divides the array" }, { qIndex: 2, answer: "Not sure" }, { qIndex: 3, answer: "Stack and queue" }, { qIndex: 4, answer: "A BST" }, { qIndex: 5, answer: "Sorts numbers." }, { qIndex: 6, answer: "A function call." }, { qIndex: 7, answer: "idk" }, { qIndex: 8, answer: "how fast" }, { qIndex: 9, answer: "heap thing" }] },
  { name: 'Arjun Patel', gender: 'male', score: 60, status: 'On Track', answers: [{ qIndex: 0, answer: "You can access array elements with an index." }, { qIndex: 1, answer: "It looks for an item in a sorted list." }, { qIndex: 2, answer: "What to do when hash is same" }, { qIndex: 3, answer: "LIFO vs FIFO" }, { qIndex: 4, answer: "Binary tree" }, { qIndex: 5, answer: "A way to sort." }, { qIndex: 6, answer: "A function can call itself to solve problem." }, { qIndex: 7, answer: "They are for graphs." }, { qIndex: 8, answer: "Algorithm speed." }, { qIndex: 9, answer: "Heap with small top." }] },
  { name: 'Pooja Reddy', gender: 'female', score: 79, status: 'On Track', answers: [{ qIndex: 0, answer: "Linked lists are better for frequent insertions." }, { qIndex: 1, answer: "Binary search is faster than linear search." }, { qIndex: 2, answer: "Chaining avoids collisions." }, { qIndex: 3, answer: "Stack is for function calls, queue for tasks." }, { qIndex: 4, answer: "The tree is sorted." }, { qIndex: 5, answer: "Bubble sort is a basic sorting algorithm." }, { qIndex: 6, answer: "A function that calls itself is recursive." }, { qIndex: 7, answer: "BFS explores level by level. DFS goes deep." }, { qIndex: 8, answer: "A measure of efficiency." }, { qIndex: 9, answer: "A heap that keeps the minimum at the top." }] },
  { name: 'Vikram Kumar', gender: 'male', score: 91, status: 'Excelling', answers: [{ qIndex: 0, answer: "Arrays are indexed, linked lists are not." }, { qIndex: 1, answer: "The list is divided in two." }, { qIndex: 2, answer: "Use a linked list for hash collisions." }, { qIndex: 3, answer: "A stack pushes and pops, a queue enqueues and dequeues." }, { qIndex: 4, answer: "The values on the left are smaller." }, { qIndex: 5, answer: "It's easy to implement but not efficient." }, { qIndex: 6, answer: "It's a way to solve problems by dividing them into smaller versions of the same problem." }, { qIndex: 7, answer: "BFS is often used for shortest path problems, while DFS is used for topological sorting." }, { qIndex: 8, answer: "It's a way to classify how an algorithm scales." }, { qIndex: 9, answer: "A min-heap is a complete binary tree where each node is smaller than its children." }] },
  { name: 'Kiran KC', gender: 'male', score: 93, status: 'Excelling', answers: [{ qIndex: 0, answer: "A list of elements is an array." }, { qIndex: 1, answer: "It repeatedly halves the search interval." }, { qIndex: 2, answer: "Chaining is a method for handling hash collisions." }, { qIndex: 3, answer: "Stack is like a deck of cards. Queue is like people waiting for a bus." }, { qIndex: 4, answer: "A special type of binary tree." }, { qIndex: 5, answer: "It compares adjacent items and swaps them if they are in the wrong order. This process is repeated until the list is sorted." }, { qIndex: 6, answer: "A function that calls itself during its execution." }, { qIndex: 7, answer: "BFS uses a queue data structure, and DFS uses a stack data structure." }, { qIndex: 8, answer: "It provides an upper bound on the time taken by an algorithm." }, { qIndex: 9, answer: "The root node of a min-heap is the smallest element in the entire heap." }] },
  { name: 'Manish Gupta', gender: 'male', score: 62, status: 'On Track', answers: [{ qIndex: 0, answer: "Array is static." }, { qIndex: 1, answer: "A way to find things." }, { qIndex: 2, answer: "About hash tables" }, { qIndex: 3, answer: "Two data structures" }, { qIndex: 4, answer: "A tree with two children per node." }, { qIndex: 5, answer: "Sorting." }, { qIndex: 6, answer: "Function calls." }, { qIndex: 7, answer: "Graph traversal." }, { qIndex: 8, answer: "Speed." }, { qIndex: 9, answer: "A heap." }] },
  { name: 'Gita Joshi', gender: 'female', score: 99, status: 'Excelling', answers: [{ qIndex: 0, answer: "An array is a container object that holds a fixed number of values of a single type. A linked list is a linear data structure where elements are not stored at contiguous memory locations." }, { qIndex: 1, answer: "Binary Search is a searching algorithm for finding an element's position in a sorted array." }, { qIndex: 2, answer: "In hash chaining, each cell of the hash table points to a linked list of records that have the same hash function value." }, { qIndex: 3, answer: "Stack is LIFO (e.g., call stack). Queue is FIFO (e.g., printer queue)." }, { qIndex: 4, answer: "The left child is less than the parent, and the right child is greater than the parent." }, { qIndex: 5, answer: "It's a simple, comparison-based sorting algorithm where adjacent elements are swapped if they are in the wrong order." }, { qIndex: 6, answer: "It's a programming technique where a function calls itself to solve a problem." }, { qIndex: 7, answer: "BFS explores the graph layer by layer, while DFS explores the graph branch by branch." }, { qIndex: 8, answer: "Big O notation is used to describe the asymptotic behavior of a function's growth rate." }, { qIndex: 9, answer: "A min-heap is a complete binary tree where the value of a node is less than or equal to the values of its children." }] },
  { name: 'Hari Prasad', gender: 'male', score: 50, status: 'Needs Help', answers: [{ qIndex: 0, answer: "array = easy, list = hard" }, { qIndex: 1, answer: "search for number" }, { qIndex: 2, answer: "hashing" }, { qIndex: 3, answer: "different lists" }, { qIndex: 4, answer: "It is a tree." }, { qIndex: 5, answer: "sorting numbers" }, { qIndex: 6, answer: "calling a function" }, { qIndex: 7, answer: "searching" }, { qIndex: 8, answer: "idk" }, { qIndex: 9, answer: "a special heap" }] },
  { name: 'Srijana Tamang', gender: 'female', score: 85, status: 'Excelling', answers: [{ qIndex: 0, answer: "An array is a data structure consisting of a collection of elements, each identified by at least one array index or key." }, { qIndex: 1, answer: "Binary search is a search algorithm that finds the position of a target value within a sorted array." }, { qIndex: 2, answer: "Chaining is a collision resolution technique where colliding items are stored in a list." }, { qIndex: 3, answer: "Stack uses one end for operations, queue uses both ends." }, { qIndex: 4, answer: "All nodes in left subtree are less than root, all in right are greater." }, { qIndex: 5, answer: "Bubble sort has a worst-case and average complexity of O(n^2), where n is the number of items being sorted." }, { qIndex: 6, answer: "It's a method where the solution to a problem depends on solutions to smaller instances of the same problem." }, { qIndex: 7, answer: "BFS is suitable for finding the shortest path on unweighted graphs. DFS is more suitable for game simulations." }, { qIndex: 8, answer: "It's a standard way to measure the complexity of an algorithm." }, { qIndex: 9, answer: "A min-heap is a heap where the root is the minimum element." }] },
];

function ExamAnalysisContent() {
  const searchParams = useSearchParams();
  const examString = searchParams.get('exam');
  
  if (!examString) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No exam data provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please return to the previous page and select an exam to view its analysis.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exam: Exam = JSON.parse(examString);
  const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);

  const getStudentAnswer = (studentAnswers: {qIndex: number; answer: string}[], questionIndex: number) => {
    const studentAns = studentAnswers.find(a => a.qIndex === questionIndex);
    return studentAns ? studentAns.answer : 'Not Answered';
  }
  
  const getCorrectAnswerText = (question: Question) => {
    if (!question.options || !question.correctAnswer) return 'N/A';
    const correctOptionIndex = parseInt(question.correctAnswer, 10) - 1;
    return question.options[correctOptionIndex]?.value || 'N/A';
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Exam Analysis: {exam.topic}</h1>
        <p className="text-muted-foreground">
          A detailed look at student performance for this specific exam.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{exam.subject}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{exam.questions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{totalMarks}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
          <CardDescription>Individual scores and status for each student who took the exam.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {studentExamPerformance.map((student, index) => (
                <AccordionItem value={`student-${index}`} key={index}>
                  <AccordionTrigger className="hover:no-underline">
                     <div className="flex items-center gap-3 w-full">
                      <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${student.name}${student.gender === 'male' ? 'boy' : 'girl'}/100/100`} />
                        <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{student.name}</p>
                      </div>
                      <div className="flex items-center gap-4 pr-4">
                        <span className="font-medium">{student.score}%</span>
                        <Badge variant={student.status === 'Needs Help' ? 'destructive' : student.status === 'Excelling' ? 'default' : 'secondary'}>{student.status}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                      <div className="p-4 bg-muted/50 rounded-md space-y-4">
                        <h4 className="font-semibold">Submitted Answers:</h4>
                        {exam.questions.map((q, qIndex) => (
                          <div key={qIndex} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <p className="font-medium">Q{qIndex + 1}: {q.question}</p>
                            <div className="mt-2 pl-4">
                              <p><span className="font-semibold">Student's Answer: </span>
                                {exam.type === 'quiz' ? getCorrectAnswerText({ ...q, correctAnswer: getStudentAnswer(student.answers, qIndex) }) : getStudentAnswer(student.answers, qIndex)}
                              </p>
                              {exam.type === 'quiz' && (
                                <p className="text-green-600"><span className="font-semibold">Correct Answer: </span>{getCorrectAnswerText(q)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}


export default function ExamAnalysisPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 md:p-8 max-w-4xl"><Skeleton className="w-full h-96" /></div>}>
      <ExamAnalysisContent />
    </Suspense>
  );
}
