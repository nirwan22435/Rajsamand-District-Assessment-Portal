import { describe, it, expect } from 'vitest';
import { createSubmissionPdfDocument } from '../../src/utils/pdfGenerator';

describe('Unit Tests: PDF Assessment Scorecard Generator (pdfGenerator.ts)', () => {
  it('should generate a valid PDF document object without errors', () => {
    const sampleSubmission = {
      candidateName: 'Ramesh Sharma',
      candidateEmail: 'ramesh@rajsamand.gov.in',
      registrationId: 'RJ-2026-001',
      block: 'Rajsamand',
      testTitle: 'District General Assessment 2026',
      subject: 'General Studies & Reasoning',
      scoreObtained: 85,
      totalMarks: 100,
      scorePercentage: 85,
      correctCount: 17,
      wrongCount: 3,
      unattemptedCount: 0,
      timeTakenMinutes: 24,
      submittedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          questionText: 'What is the headquarters of Rajsamand district?',
          options: ['Rajsamand', 'Udaipur', 'Kumbhalgarh', 'Nathdwara'],
          correctOptionIndex: 0,
          marks: 5,
        },
      ],
      answers: [
        {
          questionId: 'q1',
          selectedOptionIndex: 0,
          isCorrect: true,
          marksObtained: 5,
        },
      ],
    };

    const doc = createSubmissionPdfDocument(sampleSubmission);
    expect(doc).toBeDefined();

    // Verify it exports arraybuffer or base64 without throwing
    const arrayBuffer = doc.output('arraybuffer');
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
  });
});
