import { MCQQuestion, QuestionAnswer } from '../types';

export interface ParseTestPaperParams {
  fileData?: string; // base64 string
  mimeType?: string; // e.g. 'image/png', 'application/pdf'
  rawText?: string;
  subject?: string;
  targetBlock?: string;
  defaultTimeLimit?: number;
}

export interface SendEmailParams {
  type: 'CREDENTIALS' | 'TEST_ASSIGNED' | 'TEST_RESULT_NOTIFICATION';
  candidateEmail: string;
  candidateName: string;
  details?: {
    password?: string;
    block?: string;
    registrationId?: string;
    testTitle?: string;
    subject?: string;
    duration?: number;
    totalQuestions?: number;
    totalMarks?: number;
    scoreObtained?: number;
    scorePercentage?: number;
    correctCount?: number;
    wrongCount?: number;
    unattemptedCount?: number;
    timeTakenMinutes?: number;
    submittedAt?: string;
    questions?: MCQQuestion[];
    answers?: QuestionAnswer[];
  };
}

export async function parseTestPaperAPI(params: ParseTestPaperParams) {
  const response = await fetch('/api/parse-test-paper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse test paper.');
  }
  return data;
}

export async function sendEmailAPI(params: SendEmailParams) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to dispatch email.');
  }
  return data;
}

export async function checkServerHealthAPI() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { status: 'offline' };
  }
}
