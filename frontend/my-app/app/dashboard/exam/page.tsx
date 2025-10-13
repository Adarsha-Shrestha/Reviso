"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { FileText, Clock, BookOpen, ChevronRight, AlertCircle, CheckCircle, Loader2, Plus, Search, Calendar, Award, X, ArrowLeft, Link, Camera, Video, Shield, Eye, Pause, Play } from 'lucide-react';
import { useRouter } from "next/navigation";

const API_BASE = 'http://localhost:8000/api/exam';
const PROCTORING_API = 'http://localhost:8000/api/proctoring';

// Type definitions
interface ExamQuestion {
  question_number: number;
  question: string;
  difficulty: 'hard' | 'medium';
  marks: number;
  question_type: string;
}

interface Exam {
  exam_id: string;
  topic: string;
  subject: string;
  total_questions: number;
  total_marks: number;
  created_at: string;
  questions?: ExamQuestion[];
}

interface ExamSession {
  session_id: string;
  exam_id: string;
  started_at: string;
}

interface ExamForm {
  topic: string;
  subject: string;
  num_hard: number;
  num_medium: number;
}

interface SubmittedExam {
  session_id: string;
  exam_id: string;
  topic: string;
  subject: string;
  total_questions: number;
  total_marks: number;
  submitted_at: string;
  answers: Array<{
    question_number: number;
    answer: string;
  }>;
}

interface MockExam {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  marks: number;
  questions: number;
  createdBy: string;
  uploadDate: string;
}

interface ProctoringStatus {
  active: boolean;
  time_remaining: number;
}

const ExamSection = () => {
  const router = useRouter();
  const [mainView, setMainView] = useState<'browse' | 'create' | 'history' | 'taking' | 'proctoring-setup'>('browse');
  const [loading, setLoading] = useState(false);
  const [examHistory, setExamHistory] = useState<Exam[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedExams, setSubmittedExams] = useState<SubmittedExam[]>([]);
  const [username, setUsername] = useState('');
  
  // Proctoring states
  const [proctoringActive, setProctoringActive] = useState(false);
  const [status, setStatus] = useState<ProctoringStatus | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [proctoringError, setProctoringError] = useState('');
  const [videoFeedUrl, setVideoFeedUrl] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const videoRef = useRef<HTMLImageElement>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Single dummy exam
  const [mockExams] = useState<MockExam[]>([
    {
      id: 'exam-1',
      title: 'Mid-term: Data Mining Fundamentals',
      subject: 'Data Mining',
      description: 'Covers classification, clustering, and association rules',
      dueDate: '2025-10-20',
      marks: 75,
      questions: 12,
      createdBy: 'Prof. Smith',
      uploadDate: '2025-10-01'
    }
  ]);

  // Dummy exam with questions
  const dummyExamWithQuestions: Exam = {
    exam_id: 'dummy-exam-1',
    topic: 'Data Mining Fundamentals',
    subject: 'Data Mining',
    total_questions: 5,
    total_marks: 35,
    created_at: new Date().toISOString(),
    questions: [
      {
        question_number: 1,
        question: 'Explain the difference between classification and clustering in data mining. Provide examples of real-world applications for each.',
        difficulty: 'hard',
        marks: 10,
        question_type: 'Descriptive'
      },
      {
        question_number: 2,
        question: 'What is the Apriori algorithm? Describe its main steps and explain how it generates frequent itemsets.',
        difficulty: 'medium',
        marks: 5,
        question_type: 'Analytical'
      },
      {
        question_number: 3,
        question: 'Define support, confidence, and lift in association rule mining. How are these metrics used to evaluate rules?',
        difficulty: 'medium',
        marks: 5,
        question_type: 'Conceptual'
      },
      {
        question_number: 4,
        question: 'Compare and contrast decision trees and neural networks as classification techniques. What are the advantages and disadvantages of each?',
        difficulty: 'hard',
        marks: 10,
        question_type: 'Comparative'
      },
      {
        question_number: 5,
        question: 'What is overfitting in machine learning models? Explain how cross-validation helps prevent overfitting.',
        difficulty: 'medium',
        marks: 5,
        question_type: 'Analytical'
      }
    ]
  };

  useEffect(() => {
    loadExamHistory();
    loadSubmittedExams();
  }, []);

  // Poll proctoring status with better error handling
  useEffect(() => {
    if (!proctoringActive || mainView !== 'taking') {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`${PROCTORING_API}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStatus(data);
        setProctoringError('');
        setConnectionAttempts(0);

        if (!data.active) {
          setProctoringActive(false);
          setError('Proctoring has stopped. Please contact the administrator.');
        }
      } catch (err) {
        console.error('Error fetching proctoring status:', err);
        setConnectionAttempts(prev => prev + 1);
        
        if (connectionAttempts > 5) {
          setProctoringError('Lost connection to proctoring system');
          setProctoringActive(false);
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval
    statusIntervalRef.current = setInterval(pollStatus, 1000);

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [proctoringActive, mainView, connectionAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const loadSubmittedExams = () => {
    try {
      const stored = localStorage.getItem('submittedExams');
      if (stored) {
        setSubmittedExams(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load submitted exams:', err);
    }
  };

  const saveSubmittedExam = (submittedExam: SubmittedExam) => {
    try {
      const stored = localStorage.getItem('submittedExams');
      const exams = stored ? JSON.parse(stored) : [];
      exams.push(submittedExam);
      localStorage.setItem('submittedExams', JSON.stringify(exams));
      setSubmittedExams(exams);
    } catch (err) {
      console.error('Failed to save submitted exam:', err);
    }
  };

  const loadExamHistory = async () => {
    try {
      const storedExams = localStorage.getItem('generatedExams');
      if (storedExams) {
        const localExams = JSON.parse(storedExams);
        setExamHistory(localExams);
      }

      const response = await fetch(`${API_BASE}/list`);
      const data = await response.json();
      if (data.exams && data.exams.length > 0) {
        const localExams = storedExams ? JSON.parse(storedExams) : [];
        const mergedExams = [...data.exams, ...localExams];
        const uniqueExams = mergedExams.filter((exam, index, self) =>
          index === self.findIndex((e) => e.exam_id === exam.exam_id)
        );
        setExamHistory(uniqueExams);
        localStorage.setItem('generatedExams', JSON.stringify(uniqueExams));
      }
    } catch (err) {
      console.error('Failed to load exam history:', err);
    }
  };

  const saveExamToLocalStorage = (exam: Exam) => {
    try {
      const stored = localStorage.getItem('generatedExams');
      const exams = stored ? JSON.parse(stored) : [];
      exams.push(exam);
      localStorage.setItem('generatedExams', JSON.stringify(exams));
    } catch (err) {
      console.error('Failed to save exam to localStorage:', err);
    }
  };

  const generateExam = async (examForm: ExamForm) => {
    if (!examForm.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm)
      });

      if (!response.ok) throw new Error('Failed to generate exam');

      const data = await response.json();
      setCurrentExam(data);
      
      saveExamToLocalStorage(data);
      
      await loadExamHistory();
      setMainView('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startProctoredExam = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!rulesAccepted) {
      setError('Please accept the exam rules to continue');
      return;
    }

    setLoading(true);
    setError('');
    setProctoringError('');

    try {
      // Start proctoring via API
      const response = await fetch(`${PROCTORING_API}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          exam_duration: 3600 // 1 hour in seconds
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to start proctoring');
      }

      const result = await response.json();
      console.log('Proctoring started:', result);

      // Set video feed URL with cache buster
      const feedUrl = `${PROCTORING_API}/video_feed/${encodeURIComponent(username.trim())}?t=${Date.now()}`;
      setVideoFeedUrl(feedUrl);

      setProctoringActive(true);
      
      // Start the exam
      const dummySession: ExamSession = {
        session_id: `session-${Date.now()}`,
        exam_id: 'dummy-exam-1',
        started_at: new Date().toISOString()
      };
      
      setCurrentSession(dummySession);
      setCurrentExam(dummyExamWithQuestions);
      setAnswers({});
      
      // Small delay to ensure backend is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMainView('taking');
    } catch (err) {
      console.error('Proctoring start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start proctoring');
      setProctoringActive(false);
      setVideoFeedUrl('');
    } finally {
      setLoading(false);
    }
  };

  const stopProctoring = async () => {
    try {
      const response = await fetch(`${PROCTORING_API}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to stop proctoring:', response.statusText);
      }

      setProctoringActive(false);
      setStatus(null);
      setVideoFeedUrl('');
      setProctoringError('');
      setConnectionAttempts(0);
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop proctoring:', err);
    }
  };

  const startExam = async (examId: string) => {
    setLoading(true);
    setError('');

    try {
      // Check if it's the dummy exam (proctored)
      if (examId === 'dummy-exam-1') {
        // Go to proctoring setup
        setMainView('proctoring-setup');
        setLoading(false);
        return;
      }

      // For generated exams, start normally without proctoring
      const response = await fetch(`${API_BASE}/session/${examId}/start`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to start exam');

      const sessionData = await response.json();
      
      const examResponse = await fetch(`${API_BASE}/${examId}`);
      const examData = await examResponse.json();

      setCurrentSession(sessionData);
      setCurrentExam(examData);
      setAnswers({});
      setMainView('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionNumber: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
  };

  const submitExam = async () => {
    if (!currentExam || !currentSession) return;

    const totalQuestions = currentExam.total_questions;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions) {
      setError(`Please answer all questions. ${answeredCount}/${totalQuestions} answered.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const answersArray = Object.entries(answers).map(([qNum, answer]) => ({
        question_number: parseInt(qNum),
        answer: answer
      }));

      const submissionData = {
        session_id: currentSession.session_id,
        answers: answersArray
      };

      const submittedExam: SubmittedExam = {
        session_id: currentSession.session_id,
        exam_id: currentExam.exam_id,
        topic: currentExam.topic,
        subject: currentExam.subject,
        total_questions: currentExam.total_questions,
        total_marks: currentExam.total_marks,
        submitted_at: new Date().toISOString(),
        answers: answersArray
      };
      
      saveSubmittedExam(submittedExam);

      // Stop proctoring if it was active
      if (proctoringActive) {
        await stopProctoring();
      }

      if (currentExam.exam_id !== 'dummy-exam-1') {
        try {
          const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
          });

          if (response.ok) {
            const results = await response.json();
            const storedEvaluations = JSON.parse(localStorage.getItem('examEvaluations') || '[]');
            storedEvaluations.push(results);
            localStorage.setItem('examEvaluations', JSON.stringify(storedEvaluations));
            localStorage.setItem('latestEvaluation', JSON.stringify(results));
          }
        } catch (apiErr) {
          console.error('API submission failed, but exam saved locally:', apiErr);
        }
      }
      
      const sessionId = currentSession.session_id;
      localStorage.setItem('latestSubmittedSession', sessionId);
      
      router.push('/dashboard/evaluate');
      
      setMainView('browse');
      setCurrentExam(null);
      setCurrentSession(null);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredExams = mockExams.filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProctoringSetupView = () => (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => {
          setMainView('browse');
          setError('');
          setRulesAccepted(false);
          setUsername('');
        }}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Exams
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Proctored Exam Setup</h2>
          <p className="text-gray-500">Please complete the setup to begin your proctored exam</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name / Student ID *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name or student ID"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Exam Rules */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Exam Rules & Requirements</h3>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-gray-700">Your camera feed will be monitored continuously throughout the exam</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-gray-700">Do not switch tabs, windows, or leave the exam page</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-gray-700">Suspicious activity will be recorded and flagged for review</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Video className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-gray-700">Ensure you are in a well-lit, quiet environment with your face clearly visible</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to abide by all exam rules and understand that my session will be monitored continuously.
              </span>
            </label>
          </div>

          {/* Start Button */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setMainView('browse');
                setError('');
                setRulesAccepted(false);
                setUsername('');
              }}
              className="flex-1 bg-white text-gray-900 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startProctoredExam}
              disabled={loading || !rulesAccepted || !username.trim()}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Proctoring...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Start Proctored Exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const BrowseView = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Exam Section</h1>
        <p className="text-gray-500">Take exams and generate mock tests for practice</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setMainView('create')}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Generate a Mock Exam
        </button>
        <button 
          onClick={() => setMainView('history')}
          className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
        >
          <FileText className="w-5 h-5" />
          Mock Exam Centre
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Exams</h2>
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No exams found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const daysUntil = getDaysUntilDue(exam.dueDate);
              const isOverdue = daysUntil < 0;
              const isUrgent = daysUntil >= 0 && daysUntil <= 3;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      PROCTORED
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{exam.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{exam.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{exam.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>{exam.marks} marks • {exam.questions} questions</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      isOverdue ? 'text-gray-900' : isUrgent ? 'text-gray-700' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due: {new Date(exam.dueDate).toLocaleDateString()} 
                        {isOverdue ? ' (Overdue)' : isUrgent ? ` (${daysUntil} days left)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3">
                      Created by {exam.createdBy} • {new Date(exam.uploadDate).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => startExam('dummy-exam-1')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      Start Proctored Exam
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const CreateExamView = () => {
    const [examForm, setExamForm] = useState<ExamForm>({
      topic: '',
      subject: 'DataMining',
      num_hard: 3,
      num_medium: 9
    });

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => {
            setMainView('browse');
            setError('');
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Exams
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-700" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Exam</h2>
            <p className="text-gray-500">Generate a comprehensive exam with AI-powered questions</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Topic *
              </label>
              <input
                type="text"
                value={examForm.topic}
                onChange={(e) => setExamForm({ ...examForm, topic: e.target.value })}
                placeholder="e.g., Classification Algorithms in Data Mining"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={examForm.subject}
                onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              >
                <option value="DataMining">Data Mining</option>
                <option value="Network">Computer Networks</option>
                <option value="Distributed">Distributed Systems</option>
                <option value="Energy">Energy Systems</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hard Questions (10 marks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={examForm.num_hard}
                  onChange={(e) => setExamForm({ ...examForm, num_hard: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium Questions (5 marks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={examForm.num_medium}
                  onChange={(e) => setExamForm({ ...examForm, num_medium: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>Total: {examForm.num_hard + examForm.num_medium} questions</strong>
                <br />
                Marks: {(examForm.num_hard * 10) + (examForm.num_medium * 5)} points
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setMainView('browse')}
                className="flex-1 bg-white text-gray-900 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => generateExam(examForm)}
                disabled={loading}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Generate Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HistoryView = () => (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => setMainView('browse')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Exams
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Mock Exam Centre</h2>
        <button
          onClick={() => setMainView('create')}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Exam
        </button>
      </div>

      {examHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No exams created yet</p>
          <button
            onClick={() => setMainView('create')}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {examHistory.map((exam) => (
            <div
              key={exam.exam_id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.topic}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {exam.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {exam.total_questions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {exam.total_marks} marks
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(exam.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => startExam(exam.exam_id)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  Start Exam
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TakingExamView = () => {
    if (!currentExam) return null;

    const isProctoredExam = currentExam.exam_id === 'dummy-exam-1';

    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => {
            setMainView('browse');
            setCurrentExam(null);
            setCurrentSession(null);
            setAnswers({});
            if (proctoringActive) {
              stopProctoring();
            }
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Exit Exam
        </button>

        {/* Proctoring Status Header - Only for proctored exams */}
        {isProctoredExam && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {proctoringActive && status?.active ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-900">Proctoring Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Proctoring Inactive</span>
                  </div>
                )}
                {status && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{formatTime(status.time_remaining)}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Progress: {Object.keys(answers).length}/{currentExam.total_questions}
              </div>
            </div>
            {proctoringError && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">{proctoringError}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Exam Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentExam.topic}</h2>
                  <p className="text-gray-500 mt-1">
                    {currentExam.subject} • {currentExam.total_questions} questions • {currentExam.total_marks} marks
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6 mb-6">
              {currentExam.questions?.map((q) => (
                <div key={q.question_number} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      q.difficulty === 'hard' ? 'bg-gray-900' : 'bg-gray-600'
                    }`}>
                      {q.question_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          q.difficulty === 'hard' 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {q.difficulty.toUpperCase()} • {q.marks} marks
                        </span>
                        <span className="text-xs text-gray-400">{q.question_type}</span>
                      </div>
                      <p className="text-gray-900 font-medium">{q.question}</p>
                    </div>
                  </div>
                  <textarea
                    value={answers[q.question_number] || ''}
                    onChange={(e) => handleAnswerChange(q.question_number, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none bg-gray-50"
                  />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {Object.keys(answers).length} of {currentExam.total_questions} questions answered
                  </p>
                  {Object.keys(answers).length < currentExam.total_questions && (
                    <p className="text-xs text-gray-500 mt-1">Please answer all questions before submitting</p>
                  )}
                </div>
                <button
                  onClick={submitExam}
                  disabled={loading || Object.keys(answers).length < currentExam.total_questions}
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Exam
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Proctoring Sidebar - Only for proctored exams */}
          {isProctoredExam && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-red-600" />
                  Live Proctoring
                </h3>

                <div className="aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden relative">
                  {proctoringActive && videoFeedUrl ? (
                    <>
                      <img
                        ref={videoRef}
                        src={videoFeedUrl}
                        alt="Proctoring feed"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Video feed error');
                          setProctoringError('Video feed connection lost');
                        }}
                      />
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Camera Inactive</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Eye Tracking
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      proctoringActive && status?.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {proctoringActive && status?.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Camera className="w-3 h-3" />
                      Camera Monitor
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      proctoringActive && status?.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {proctoringActive && status?.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Anti-Spoofing
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      proctoringActive && status?.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {proctoringActive && status?.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-800">
                    <strong>⚠️ Important:</strong><br/>
                    Stay focused on the screen. Any suspicious activity will be recorded and reported.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="animate-fadeIn">
        {mainView === 'browse' && <BrowseView />}
        {mainView === 'create' && <CreateExamView />}
        {mainView === 'history' && <HistoryView />}
        {mainView === 'proctoring-setup' && <ProctoringSetupView />}
        {mainView === 'taking' && <TakingExamView />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExamSection;