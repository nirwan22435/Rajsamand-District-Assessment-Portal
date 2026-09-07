export type UserRole = 'ADMIN' | 'CANDIDATE';

export type DistrictBlock =
  | 'Nathdwara'
  | 'Kumbhalgarh'
  | 'Bhim'
  | 'Rajsamand'
  | 'Amet'
  | 'Deogarh'
  | 'Railmagra'
  | 'District-Wide';

export type TypingLanguage = 'ENGLISH' | 'HINDI_DEVLYS_010';

export interface Candidate {
  id: string;
  registrationId: string; // e.g. RJ-2026-101 or TYP-2026-001
  name: string;
  designation?: string; // e.g. LDC / Clerk Grade-II, Jr Assistant, IA, Stenographer, DEO
  officeName?: string; // e.g. District Collectorate Rajsamand, SDM Office, Tehsil Office
  typingMedium?: TypingLanguage; // Medium of typing: ENGLISH or HINDI_DEVLYS_010
  registeredModule?: 'ASSESSMENT' | 'TYPING'; // Target registration module
  email: string;
  phone: string;
  category?: string;
  block?: DistrictBlock;
  activeStatus: boolean;
  password: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  options: string[]; // exactly 4 choices
  correctOptionIndex: number; // 0, 1, 2, or 3
  explanation?: string;
  marks: number;
}

export interface TestPaper {
  id: string;
  title: string;
  subject: string;
  targetBlock?: DistrictBlock;
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
  block?: DistrictBlock;
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
  type: 'CREDENTIALS' | 'TEST_ASSIGNED' | 'TEST_RESULT_NOTIFICATION' | 'ADMIN_RESET_OTP';
  subject: string;
  sentAt: string;
  status: 'SENT' | 'SIMULATED';
  details?: Record<string, any>;
  previewUrl?: string;
}

export interface TypingTest {
  id: string;
  title: string;
  heading?: string;
  examDate?: string; // YYYY-MM-DD
  language: TypingLanguage;
  durationMinutes: number; // 10 minutes default
  passageText: string;
  targetBlock?: DistrictBlock;
  minPassingWpm: number; // Default 30 for English, 25 for Hindi
  minCorrectWords?: number; // Minimum correctly typed words in 10 mins for qualification
  assignedCandidateIds?: string[]; // Candidate IDs assigned to this test (or empty for all)
  instructions?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'REVOKED';
  createdBy: string;
  createdAt: string;
  totalWords: number;
}

export interface TypingAttempt {
  id: string;
  typingTestId: string;
  testTitle: string;
  language: TypingLanguage;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  registrationId?: string;
  block?: DistrictBlock;

  // Report Metrics (as requested)
  totalWordsInPara: number; // Total words in original paragraph
  correctWordsCount: number; // Number of correctly typed words
  incorrectWordsCount: number; // Number of incorrectly typed words
  untypedWordsCount: number; // Number of words not typed
  skippedWordsCount?: number; // Number of skipped / omitted words from reference paragraph
  correctWords?: string[]; // List of correctly typed words
  incorrectWords?: { refWord: string; typedWord?: string }[]; // List of incorrectly typed words
  skippedWords?: string[]; // List of skipped words from reference paragraph
  referencePassage?: string; // Full reference passage text
  netWpm: number; // Net typing speed per minute
  grossWpm: number; // Gross typing speed (total typed / minutes)
  accuracyPercentage: number; // Accuracy % = total correctly typed words / total words in reference paragraph
  timeTakenSeconds: number; // Total time taken in seconds (<= 600s for 10 min test)
  timeTakenMinutes: number;
  status: 'QUALIFIED' | 'DISQUALIFIED';
  typedText: string;
  submittedAt: string;
}

