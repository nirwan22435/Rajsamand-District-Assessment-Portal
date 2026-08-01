export type UserRole = 'ADMIN' | 'CANDIDATE';

export interface Candidate {
  id: string;
  registrationId: string; // e.g. RJ-2026-101
  name: string;
  email: string;
  phone: string;
  block: DistrictBlock; // e.g., Nathdwara, Kumbhalgarh, Bhim, Rajsamand, Amet, Deogarh, Railmagra
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  activeStatus: boolean;
  password: string;
  createdAt: string;
  avatarUrl?: string;
}

export type DistrictBlock =
  | 'Nathdwara'
  | 'Kumbhalgarh'
  | 'Bhim'
  | 'Rajsamand'
  | 'Amet'
  | 'Deogarh'
  | 'Railmagra'
  | 'District-Wide';

export interface MCQQuestion {
  id: string;
  questionText: string;
  options: string[]; // exactly 4 choices
  correctOptionIndex: number; // 0, 1, 2, or 3
  explanation: string;
  marks: number;
}

export interface TestPaper {
  id: string;
  title: string;
  subject: string;
  targetBlock: DistrictBlock;
  timeLimitMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  accessCode?: string; // e.g. RJ-8829 or custom test key
  createdBy: string;
  createdAt: string;
  status: 'DRAFT' | 'PUBLISHED';
  assignedCandidateIds?: string[]; // Candidate IDs assigned to this test (or ['ALL'] / undefined for all)
  questions: MCQQuestion[];
}

export interface QuestionAnswer {
  questionId: string;
  selectedOptionIndex: number | null; // null if unattempted
  isCorrect: boolean;
  marksObtained: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  block: DistrictBlock;
  scoreObtained: number;
  totalMarks: number;
  scorePercentage: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  status: 'PASSED' | 'FAILED';
  timeTakenMinutes: number;
  submittedAt: string;
  answers: QuestionAnswer[];
  emailSent?: boolean;
}

export interface AuthSession {
  role: UserRole;
  candidate?: Candidate;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  toName: string;
  type: 'CREDENTIALS' | 'TEST_ASSIGNED' | 'TEST_RESULT_NOTIFICATION';
  subject: string;
  sentAt: string;
  status: 'SENT' | 'SIMULATED';
  details?: Record<string, any>;
  previewUrl?: string;
}
