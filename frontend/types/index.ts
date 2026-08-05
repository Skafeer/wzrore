export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone: string;
  province: string;
  avatar?: string;
  studyStreak: number;
  bestStreak: number;
  streakFreeze: number;
  lastStudyDate?: string;
  fcmToken?: string | null;
  subscription?: Subscription | null;
}

export interface Subscription {
  id: string;
  plan: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
}

export interface Subject {
  id: string;
  name: string;
  order: number;
}

export interface Chapter {
  id: string;
  name: string;
  order: number;
}

export interface Topic {
  id: string;
  name: string;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  type: 'WIZARI' | 'CHAPTER';
  year?: number;
  round?: number;
  duration: number;
  _count: { questions: number };
}

export interface RichBlock {
  id: string;
  type: 'text' | 'latex';
  content: string;
}

export interface Question {
  id: string;
  text: string;
  degree: number;
  order: number;
  modelImages: string[];
  richContent?: RichBlock[];
  richModelAnswer?: RichBlock[];
}

export interface ExamSession {
  sessionId: string;
  exam: {
    id: string;
    title: string;
    duration: number;
    questions: Question[];
  };
}

export interface StudentAnswer {
  questionId: string;
  answerText: string;
  answerImages: string[];
}

export interface ExamResult {
  sessionId: string;
  examTitle: string;
  subject: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
  questions: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  modelAnswer: string;
  modelImages: string[];
  degree: number;
  studentAnswer: string;
  studentImages: string[];
  aiScore: number;
  aiFeedback: string;
  richContent?: RichBlock[];
  richModelAnswer?: RichBlock[];
}

export interface PerformanceSummary {
  totalExams: number;
  avgScore: number;
}

export interface LastExam {
  sessionId: string;
  subject: string;
  chapter?: string;
  examTitle: string;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
}

export interface SubmitExamResponse {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  gradingResults: GradingResult[];
  streak: {
    current: number;
    best: number;
    isNewBest: boolean;
    alreadyCompletedToday: boolean;
  };
}

export interface GradingResult {
  questionId: string;
  score: number;
  feedback: string;
}