"use client"

import React, { useState, useEffect } from 'react';
import { 
  Trophy, TrendingUp, TrendingDown, CheckCircle, XCircle, 
  FileText, Clock, Award, ChevronDown, ChevronUp, Loader2,
  BarChart3, MessageSquare, Lightbulb, Target, ArrowLeft, Calendar,
  Search, SlidersHorizontal, X
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const API_BASE = 'http://localhost:8000/api/exam';

interface QuestionEvaluation {
  question_number: number;
  score: number;
  max_marks: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  key_points_covered?: string[];
  key_points_missed?: string[];
}

interface EvaluationData {
  session_id: string;
  exam_id: string;
  topic: string;
  subject: string;
  total_score: number;
  total_max_marks: number;
  percentage: number;
  questions_evaluated: number;
  evaluated_at: string;
  overall_feedback: string;
  evaluations: QuestionEvaluation[];
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

  // List View - Shows all submitted exams
  const ListView = React.memo(({
  submittedExams,
  evaluations,
  searchQuery,
  setSearchQuery,
  filterScore,
  setFilterScore,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  viewEvaluation,
  getEvaluationForExam,
  getGradeColor,
  getGradeLabel,
  getFilteredAndSortedExams,
  clearFilters,
  hasActiveFilters
}: {
  submittedExams: SubmittedExam[];
  evaluations: EvaluationData[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterScore: 'all' | 'excellent' | 'good' | 'poor';
  setFilterScore: (filter: 'all' | 'excellent' | 'good' | 'poor') => void;
  sortBy: 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';
  setSortBy: (sort: 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewEvaluation: (sessionId: string) => void;
  getEvaluationForExam: (sessionId: string) => EvaluationData | null;
  getGradeColor: (percentage: number) => string;
  getGradeLabel: (percentage: number) => string;
  getFilteredAndSortedExams: () => SubmittedExam[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}) => {
    const filteredExams = getFilteredAndSortedExams();

    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exam Evaluations</h1>
          <p className="text-gray-500">View results and detailed feedback for your submitted exams</p>
        </div>

        {submittedExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Exams Submitted Yet</h2>
            <p className="text-gray-600 mb-6">
              Submit an exam from the Exam Section to see evaluation results here.
            </p>
            <a
              href="/dashboard/exam"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Go to Exams
            </a>
          </div>
        ) : (
          <div>
            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by topic or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showFilters 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {[searchQuery !== '', filterScore !== 'all', sortBy !== 'date-desc'].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}

                <div className="ml-auto text-sm text-gray-600">
                  {filteredExams.length} of {submittedExams.length} exam{submittedExams.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 animate-slideDown">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Score Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Filter by Score
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: 'All Scores', color: 'gray' },
                          { value: 'excellent', label: 'Excellent (80%+)', color: 'green' },
                          { value: 'good', label: 'Good (60-79%)', color: 'blue' },
                          { value: 'poor', label: 'Needs Improvement (<60%)', color: 'red' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFilterScore(option.value as typeof filterScore)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all ${
                              filterScore === option.value
                                ? option.color === 'gray'
                                  ? 'bg-gray-900 text-white'
                                  : option.color === 'green'
                                  ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                  : option.color === 'blue'
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                                  : 'bg-red-100 text-red-800 border-2 border-red-500'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Sort by
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'date-desc', label: 'Date (Newest First)', icon: Calendar },
                          { value: 'date-asc', label: 'Date (Oldest First)', icon: Calendar },
                          { value: 'score-desc', label: 'Score (Highest First)', icon: Trophy },
                          { value: 'score-asc', label: 'Score (Lowest First)', icon: Trophy },
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setSortBy(option.value as typeof sortBy)}
                              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                sortBy === option.value
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {filteredExams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Exams Found</h2>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredExams.map((exam) => {
                  const evalData = getEvaluationForExam(exam.session_id);
                  const isEvaluated = !!evalData;

                  return (
                    <div
                      key={exam.session_id}
                      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{exam.topic}</h3>
                            {isEvaluated ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                EVALUATED
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                PENDING
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {exam.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {exam.total_questions} questions • {exam.total_marks} marks
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(exam.submitted_at).toLocaleDateString()}
                            </span>
                          </div>

                          {isEvaluated && evalData && (
                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Score</div>
                                <div className={`text-2xl font-bold ${getGradeColor(evalData.percentage)}`}>
                                  {evalData.percentage.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Marks</div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {evalData.total_score}/{evalData.total_max_marks}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Grade</div>
                                <div className={`text-sm font-semibold ${getGradeColor(evalData.percentage)}`}>
                                  {getGradeLabel(evalData.percentage)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ml-6">
                          {isEvaluated ? (
                            <button
                              onClick={() => viewEvaluation(exam.session_id)}
                              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 font-medium transition-colors"
                            >
                              View Details
                              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed flex items-center gap-2 font-medium"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Evaluating...
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  // Detail View - Shows detailed evaluation
  const DetailView = React.memo(({
  evaluation,
  expandedQuestions,
  toggleQuestion,
  getGradeColor,
  getGradeBgColor,
  getScorePercentage,
  getGradeLabel,
  setSelectedView,
  setEvaluation,
  setExpandedQuestions
}: {
  evaluation: EvaluationData;
  expandedQuestions: Record<number, boolean>;
  toggleQuestion: (qn: number) => void;
  getGradeColor: (p: number) => string;
  getGradeBgColor: (p: number) => string;
  getScorePercentage: (score: number, max: number) => number;
  getGradeLabel: (p: number) => string;
  setSelectedView: (view: 'list' | 'detail') => void;
  setEvaluation: (evala: EvaluationData | null) => void;
  setExpandedQuestions: (expanded: Record<number, boolean>) => void;
}) => {
    if (!evaluation) return null;

    const percentage = evaluation.percentage;

    return (
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => {
            setSelectedView('list');
            setEvaluation(null);
            setExpandedQuestions({});
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Evaluations
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Results</h1>
          <p className="text-gray-600">{evaluation.topic} • {evaluation.subject}</p>
        </div>

        {/* Score Overview */}
        <div className={`rounded-xl border-2 p-8 mb-8 ${getGradeBgColor(percentage)}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-full">
                <Trophy className={`w-8 h-8 ${getGradeColor(percentage)}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
                <p className="text-gray-600">{evaluation.questions_evaluated} questions evaluated</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-5xl font-bold ${getGradeColor(percentage)}`}>
                {percentage.toFixed(1)}%
              </div>
              <div className="text-lg text-gray-700 mt-1">
                {evaluation.total_score} / {evaluation.total_max_marks} marks
              </div>
              <div className={`text-sm font-semibold mt-2 ${getGradeColor(percentage)}`}>
                {getGradeLabel(percentage)}
              </div>
            </div>
          </div>

          {evaluation.overall_feedback && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Feedback</h3>
                  <p className="text-gray-700 leading-relaxed">{evaluation.overall_feedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Individual Questions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question-wise Analysis</h2>
          
          {evaluation.evaluations.map((question) => {
            const questionPercentage = getScorePercentage(question.score, question.max_marks);
            const isExpanded = expandedQuestions[question.question_number];
            
            return (
              <div
                key={question.question_number}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleQuestion(question.question_number)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getGradeBgColor(questionPercentage)}`}>
                      <FileText className={`w-5 h-5 ${getGradeColor(questionPercentage)}`} />
                    </div>
                    
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        Question {question.question_number}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-lg font-bold ${getGradeColor(questionPercentage)}`}>
                          {question.score} / {question.max_marks} marks
                        </span>
                        <span className="text-sm text-gray-600">
                          ({questionPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {questionPercentage >= 70 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                    <div className="pt-6">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
                          <p className="text-gray-700 leading-relaxed">{question.feedback}</p>
                        </div>
                      </div>
                    </div>

                    {question.strengths && question.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                            <ul className="space-y-1">
                              {question.strengths.map((strength, idx) => (
                                <li key={idx} className="text-green-800 text-sm flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {question.improvements && question.improvements.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-start gap-3">
                          <TrendingDown className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-orange-900 mb-2">Areas for Improvement</h4>
                            <ul className="space-y-1">
                              {question.improvements.map((improvement, idx) => (
                                <li key={idx} className="text-orange-800 text-sm flex items-start gap-2">
                                  <span className="text-orange-600 mt-1">•</span>
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {question.key_points_covered && question.key_points_covered.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-2">Key Points Covered</h4>
                            <ul className="space-y-1">
                              {question.key_points_covered.map((point, idx) => (
                                <li key={idx} className="text-blue-800 text-sm flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">✓</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {question.key_points_missed && question.key_points_missed.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900 mb-2">Key Points Missed</h4>
                            <ul className="space-y-1">
                              {question.key_points_missed.map((point, idx) => (
                                <li key={idx} className="text-red-800 text-sm flex items-start gap-2">
                                  <span className="text-red-600 mt-1">✗</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Evaluated on {new Date(evaluation.evaluated_at).toLocaleString()}</span>
            </div>
            <div className="font-mono text-xs">
              Session: {evaluation.session_id.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>
    );
  });

const EvaluatePage = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [submittedExams, setSubmittedExams] = useState<SubmittedExam[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [selectedView, setSelectedView] = useState<'list' | 'detail'>('list');
  const [error, setError] = useState<string>('');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterScore, setFilterScore] = useState<'all' | 'excellent' | 'good' | 'poor'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSubmittedExams();
    loadEvaluations();
  }, []);

  // Auto-open evaluation if session parameter is present OR from localStorage
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    const sessionFromStorage = localStorage.getItem('latestSubmittedSession');
    
    const sessionId = sessionFromUrl || sessionFromStorage;
    
    if (sessionId && submittedExams.length > 0 && evaluations.length > 0) {
      // Clear the localStorage flag after using it
      if (sessionFromStorage) {
        localStorage.removeItem('latestSubmittedSession');
      }
      viewEvaluation(sessionId);
    }
  }, [searchParams, submittedExams, evaluations]);

  const loadSubmittedExams = () => {
    try {
      const stored = localStorage.getItem('submittedExams');
      if (stored) {
        const exams = JSON.parse(stored);
        setSubmittedExams(exams);
      }
    } catch (err) {
      console.error('Failed to load submitted exams:', err);
    }
  };

  const loadEvaluations = () => {
    try {
      const stored = localStorage.getItem('examEvaluations');
      if (stored) {
        const evals = JSON.parse(stored);
        setEvaluations(evals);
      }
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    }
  };

  const getEvaluationForExam = (sessionId: string): EvaluationData | null => {
    return evaluations.find(e => e.session_id === sessionId) || null;
  };

  const viewEvaluation = (sessionId: string) => {
    const evalData = getEvaluationForExam(sessionId);
    if (evalData) {
      setEvaluation(evalData);
      setSelectedView('detail');
      setError('');
    } else {
      setError('Evaluation not found for this exam');
    }
  };

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionNumber]: !prev[questionNumber]
    }));
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 80) return 'bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScorePercentage = (score: number, maxMarks: number): number => {
    return parseFloat(((score / maxMarks) * 100).toFixed(1));
  };

  const getGradeLabel = (percentage: number): string => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  // Filter and sort exams
  const getFilteredAndSortedExams = () => {
    let filtered = submittedExams.filter(exam => {
      // Search filter
      const matchesSearch = 
        exam.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Score filter
      if (filterScore !== 'all') {
        const evalData = getEvaluationForExam(exam.session_id);
        if (!evalData) return false;
        
        const percentage = evalData.percentage;
        if (filterScore === 'excellent' && percentage < 80) return false;
        if (filterScore === 'good' && (percentage < 60 || percentage >= 80)) return false;
        if (filterScore === 'poor' && percentage >= 60) return false;
      }

      return true;
    });

    // Sort exams
    filtered.sort((a, b) => {
      const evalA = getEvaluationForExam(a.session_id);
      const evalB = getEvaluationForExam(b.session_id);

      switch (sortBy) {
        case 'date-desc':
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        case 'date-asc':
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        case 'score-desc':
          if (!evalA) return 1;
          if (!evalB) return -1;
          return evalB.percentage - evalA.percentage;
        case 'score-asc':
          if (!evalA) return 1;
          if (!evalB) return -1;
          return evalA.percentage - evalB.percentage;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterScore('all');
    setSortBy('date-desc');
  };

  const hasActiveFilters = searchQuery !== '' || filterScore !== 'all' || sortBy !== 'date-desc';



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading evaluation results...</p>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          {selectedView === 'list' ? (
          <ListView
            submittedExams={submittedExams}
            evaluations={evaluations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterScore={filterScore}
            setFilterScore={setFilterScore}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            viewEvaluation={viewEvaluation}
            getEvaluationForExam={getEvaluationForExam}
            getGradeColor={getGradeColor}
            getGradeLabel={getGradeLabel}
            getFilteredAndSortedExams={getFilteredAndSortedExams}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        ) : evaluation ? (
          <DetailView
            evaluation={evaluation}
            expandedQuestions={expandedQuestions}
            toggleQuestion={toggleQuestion}
            getGradeColor={getGradeColor}
            getGradeBgColor={getGradeBgColor}
            getScorePercentage={getScorePercentage}
            getGradeLabel={getGradeLabel}
            setSelectedView={setSelectedView}
            setEvaluation={setEvaluation}
            setExpandedQuestions={setExpandedQuestions}
          />
        ) : null}
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 right-8 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EvaluatePage;