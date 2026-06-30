export type UserRole = 'admin' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  lastLogin?: string;
}

export type QuestionType = 'single' | 'complex';

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: number[]; // Array of indices (single choice stores one index in the array)
  points: number;
  category?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  passingScore: number;
  isActive: boolean;
  createdAt: string;
}

export type ResultStatus = 'started' | 'completed';

export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  answers: Record<string, number[]>; // questionId -> selectedIndices
  status: ResultStatus;
  startTime: string;
  endTime?: string;
}
