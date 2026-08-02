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

async function handleJsonResponse(response: Response, defaultErrorMsg: string) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `${defaultErrorMsg} (HTTP ${response.status})`);
      }
      return data;
    } catch (err: any) {
      if (!response.ok) {
        throw new Error(`${defaultErrorMsg} (HTTP ${response.status})`);
      }
      throw err;
    }
  } else {
    // Response is HTML or plain text (e.g. 502 Bad Gateway, 404 HTML, or 500 HTML)
    const rawText = await response.text();
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 150);
    if (!response.ok) {
      throw new Error(`Server Error (HTTP ${response.status}): ${cleanSnippet || defaultErrorMsg}`);
    }
    throw new Error(`Unexpected non-JSON response format from server.`);
  }
}

export async function parseTestPaperAPI(params: ParseTestPaperParams) {
  const response = await fetch('/api/parse-test-paper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return handleJsonResponse(response, 'Failed to parse test paper.');
}

export async function sendEmailAPI(params: SendEmailParams) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return handleJsonResponse(response, 'Failed to dispatch email.');
}

export async function checkServerHealthAPI() {
  try {
    const res = await fetch('/api/health');
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return { status: 'offline' };
  } catch (err) {
    return { status: 'offline' };
  }
}
