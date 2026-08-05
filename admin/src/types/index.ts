export interface Admin {
  id: string;
  name: string;
  username: string;
  email: string;
  adminRole: 'SUPER_ADMIN' | 'ADMIN';
  permissions: Record<string, boolean>;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  province: string;
  avatar?: string;
  studyStreak: number;
  subscription?: Subscription | null;
  examCount?: number;
  createdAt: string;
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
  isActive: boolean;
  _count?: { chapters: number; exams: number };
}

export interface Chapter {
  id: string;
  name: string;
  order: number;
  subjectId: string;
  _count?: { topics: number; exams: number };
}

export interface Topic {
  id: string;
  name: string;
  order: number;
  chapterId: string;
}

export interface Exam {
  id: string;
  title: string;
  type: 'WIZARI' | 'CHAPTER';
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  year?: number;
  round?: number;
  duration: number;
  isActive: boolean;
  subject?: { name: string };
  chapter?: { name: string };
  topic?: { name: string };
  _count?: { questions: number; sessions: number };
}

export interface RichBlock {
  id: string;
  type: 'text' | 'latex';
  content: string;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  modelAnswer: string;
  modelImages: string[];
  degree: number;
  aiNotes?: string;
  order: number;
  richContent?: RichBlock[];
  richModelAnswer?: RichBlock[];
}

export interface SubscriptionCode {
  id: string;
  code: string;
  plan: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Report {
  id: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
  user: { name: string; username: string };
  question: { text: string; exam: { title: string } };
}

export interface Stats {
  totalUsers: number;
  totalExams: number;
  totalSessions: number;
  completedSessions: number;
  activeSubscriptions: number;
  totalReports: number;
  pendingReports: number;
  recentSessions: any[];
}