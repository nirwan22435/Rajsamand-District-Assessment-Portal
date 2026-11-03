import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

describe('Integration Tests: Express API Endpoints & Server Integration', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK with district metadata and operational status', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.district).toBe('Rajsamand');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.hasGeminiKey).toBe('boolean');
    });
  });

  describe('GET /api/download/rajsamand-desktop-setup.exe', () => {
    it('should return the Windows Desktop Setup binary with correct headers and MZ signature', async () => {
      const res = await fetch(`${BASE_URL}/api/download/rajsamand-desktop-setup.exe`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/vnd.microsoft.portable-executable');
      expect(res.headers.get('content-disposition')).toContain('Rajsamand_Assessment_Portal_Setup.exe');

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      expect(buffer.length).toBeGreaterThan(100);

      // Verify DOS header magic bytes: 'M' (0x4D), 'Z' (0x5A)
      expect(buffer[0]).toBe(0x4D);
      expect(buffer[1]).toBe(0x5A);
    });
  });

  describe('GET & HEAD /api/download/RDAA.apk', () => {
    it('should respond to APK download route with appropriate response or 404 handler', async () => {
      const res = await fetch(`${BASE_URL}/api/download/RDAA.apk`);
      // In dev environment without pre-generated binary file, 404 JSON is returned; if present, 200 is returned
      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.headers.get('content-type')).toBe('application/vnd.android.package-archive');
      } else {
        const data = await res.json();
        expect(data.error).toBeDefined();
      }
    });
  });

  describe('POST /api/send-email', () => {
    it('should reject request with 400 Bad Request when candidateEmail is missing', async () => {
      const res = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CREDENTIALS' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Candidate email address is required');
    });

    it('should successfully process CREDENTIALS email notification payload', async () => {
      const res = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CREDENTIALS',
          simulateOnly: true,
          candidateEmail: 'candidate.test@rajsamand.gov.in',
          candidateName: 'Test Candidate',
          details: {
            registrationId: 'RJ-TEST-2026',
            password: 'Pass@Test123',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('should successfully process TEST_ASSIGNED notification payload', async () => {
      const res = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_ASSIGNED',
          simulateOnly: true,
          candidateEmail: 'candidate.assigned@rajsamand.gov.in',
          candidateName: 'Candidate Assigned',
          details: {
            testTitle: 'Computer Proficiency Assessment 2026',
            subject: 'IT & Office Automation',
            duration: 30,
            totalQuestions: 25,
            totalMarks: 50,
            accessCode: 'TEST2026',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should successfully process TEST_RESULT_NOTIFICATION with scorecard report', async () => {
      const res = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_RESULT_NOTIFICATION',
          simulateOnly: true,
          candidateEmail: 'candidate.result@rajsamand.gov.in',
          candidateName: 'Candidate Result',
          details: {
            testTitle: 'Typing Test Evaluation',
            scoreObtained: 45,
            totalMarks: 50,
            scorePercentage: 90,
            correctCount: 45,
            wrongCount: 5,
            unattemptedCount: 0,
            timeTakenMinutes: 10,
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should successfully process ADMIN_RESET_OTP verification payload', async () => {
      const res = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADMIN_RESET_OTP',
          simulateOnly: true,
          candidateEmail: 'devkarannirwan01@gmail.com',
          details: {
            otpCode: '582910',
          },
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/parse-test-paper', () => {
    it('should reject request with 400 Bad Request when both fileData and rawText are missing', async () => {
      const res = await fetch(`${BASE_URL}/api/parse-test-paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Mathematics' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Please provide either file data or text content');
    });
  });

  describe('Catch-All API 404 Route Handler', () => {
    it('should return JSON 404 error instead of index.html for undefined API endpoints', async () => {
      const res = await fetch(`${BASE_URL}/api/nonexistent-route-for-testing`);
      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/json');

      const data = await res.json();
      expect(data.error).toContain('API endpoint GET /api/nonexistent-route-for-testing not found');
    });
  });
});
