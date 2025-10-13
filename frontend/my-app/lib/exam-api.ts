// lib/exam-api.ts
// API utilities for Exam and Evaluate sections

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/exam';

export interface ExamGenerateRequest {
  topic: string;
  subject: string;
  num_hard?: number;
  num_medium?: number;
}

export interface ExamQuestion {
  question_number: number;
  question: string;
  question_type: string;
  difficulty: string;
  marks: number;
}

export interface ExamData {
  success: boolean;
  message: string;
  exam_id: string;
  exam_data: ExamQuestion[];
  topic: string;
  subject: string;
  total_marks: number;
  total_questions: number;
}

export interface ExamSession {
  session_id: string;
  exam_id: string;
  topic: string;
  subject: string;
  total_questions: number;
  total_marks: number;
  started_at: string;
}

export interface AnswerSubmission {
  question_number: number;
  answer: string;
}

export interface QuestionEvaluation {
  question_number: number;
  score: number;
  max_marks: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  key_points_covered: string[];
  key_points_missed: string[];
}

export interface EvaluationResult {
  success: boolean;
  exam_id: string;
  session_id: string;
  topic: string;
  subject: string;
  evaluations: QuestionEvaluation[];
  total_score: number;
  total_max_marks: number;
  percentage: number;
  overall_feedback: string;
  questions_evaluated: number;
  evaluated_at: string;
}

export interface ExamListItem {
  exam_id: string;
  topic: string;
  subject: string;
  total_questions: number;
  total_marks: number;
  created_at: string;
}

// API Functions
export const examAPI = {
  /**
   * Generate a new exam
   */
  generateExam: async (request: ExamGenerateRequest): Promise<ExamData> => {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: request.topic,
        subject: request.subject,
        num_hard: request.num_hard || 3,
        num_medium: request.num_medium || 9
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate exam');
    }

    return response.json();
  },

  /**
   * Get list of all exams
   */
  listExams: async (): Promise<ExamListItem[]> => {
    const response = await fetch(`${API_BASE}/list`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exams');
    }

    const data = await response.json();
    return data.exams || [];
  },

  /**
   * Get exam details by ID
   */
  getExam: async (examId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/${examId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exam details');
    }

    return response.json();
  },

  /**
   * Start a new exam session
   */
  startExamSession: async (examId: string): Promise<ExamSession> => {
    const response = await fetch(`${API_BASE}/session/${examId}/start`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start exam session');
    }

    return response.json();
  },

  /**
   * Submit exam for evaluation
   */
  submitExam: async (
    sessionId: string, 
    answers: AnswerSubmission[]
  ): Promise<EvaluationResult> => {
    const response = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        answers: answers
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit exam');
    }

    return response.json();
  },

  /**
   * Get session status
   */
  getSessionStatus: async (sessionId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/session/${sessionId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch session status');
    }

    return response.json();
  },

  /**
   * Get evaluation results for a session
   */
  getEvaluation: async (sessionId: string): Promise<EvaluationResult> => {
    const response = await fetch(`${API_BASE}/evaluation/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Evaluation not found');
    }

    return response.json();
  },

  /**
   * Delete an exam
   */
  deleteExam: async (examId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${examId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete exam');
    }
  },

  /**
   * Get available subjects
   */
  getSubjects: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE}/subjects/available`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }

    const data = await response.json();
    return data.subjects || [];
  },

  /**
   * Get exam statistics
   */
  getStatistics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/statistics`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  }
};

// Helper functions
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  return 'F';
};

export const getGradeColor = (percentage: number): string => {
  if (percentage >= 90) return 'green';
  if (percentage >= 80) return 'blue';
  if (percentage >= 70) return 'yellow';
  if (percentage >= 60) return 'orange';
  return 'red';
};

export const formatDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;

  if (diffHours > 0) {
    return `${diffHours}h ${remainingMins}m`;
  }
  return `${diffMins}m`;
};

export const validateAnswers = (
  answers: Record<number, string>,
  totalQuestions: number
): { isValid: boolean; missing: number[] } => {
  const answeredQuestions = Object.keys(answers).map(Number);
  const missing: number[] = [];

  for (let i = 1; i <= totalQuestions; i++) {
    if (!answeredQuestions.includes(i) || !answers[i]?.trim()) {
      missing.push(i);
    }
  }

  return {
    isValid: missing.length === 0,
    missing
  };
};