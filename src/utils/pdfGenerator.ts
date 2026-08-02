import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TestAttempt, TestPaper, MCQQuestion } from '../types';

export interface SubmissionPdfData {
  candidateName: string;
  candidateEmail: string;
  registrationId?: string;
  block?: string;
  testTitle: string;
  subject?: string;
  scoreObtained: number;
  totalMarks: number;
  scorePercentage: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  timeTakenMinutes: number;
  submittedAt?: string;
  questions?: MCQQuestion[];
  answers?: TestAttempt['answers'];
}

export function createSubmissionPdfDocument(data: SubmissionPdfData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isPassed = data.scorePercentage >= 40;

  // Header Banner
  doc.setFillColor(15, 118, 110); // Emerald/Teal #0f766e
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RAJSAMAND DISTRICT ADMINISTRATION', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL CANDIDATE ASSESSMENT SUBMISSION REPORT', pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Government of Rajasthan • District Administration, Rajsamand', pageWidth / 2, 23, { align: 'center' });

  // Status Badge below banner
  const submittedDateStr = data.submittedAt
    ? new Date(data.submittedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  let y = 36;

  // Candidate Information Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, 90, 42, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CANDIDATE DETAILS', 16, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Name: ${data.candidateName}`, 16, y + 14);
  doc.text(`Email: ${data.candidateEmail}`, 16, y + 20);
  doc.text(`Reg. ID: ${data.registrationId || 'RJ-CAND-2026'}`, 16, y + 26);
  doc.text(`Tehsil / Block: ${data.block || 'Rajsamand'}`, 16, y + 32);
  doc.text(`Submitted On: ${submittedDateStr}`, 16, y + 38);

  // Performance Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(isPassed ? 240 : 254, isPassed ? 253 : 242, isPassed ? 244 : 242);
  doc.roundedRect(108, y, 90, 42, 3, 3, 'FD');

  doc.setTextColor(isPassed ? 21 : 153, isPassed ? 128 : 27, isPassed ? 61 : 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ASSESSMENT SCORECARD', 112, y + 7);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Test Paper: ${data.testTitle}`, 112, y + 14);
  if (data.subject) {
    doc.text(`Subject: ${data.subject}`, 112, y + 20);
  }
  doc.text(`Score Obtained: ${data.scoreObtained} / ${data.totalMarks} Marks`, 112, y + 26);
  doc.text(`Percentage Score: ${data.scorePercentage}%`, 112, y + 32);

  // Qualification Badge
  doc.setFont('helvetica', 'bold');
  if (isPassed) {
    doc.setTextColor(22, 101, 52);
    doc.text('Result Status: QUALIFIED (PASSED)', 112, y + 38);
  } else {
    doc.setTextColor(153, 27, 27);
    doc.text('Result Status: NEEDS IMPROVEMENT', 112, y + 38);
  }

  y += 48;

  // Scorecard Metrics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EVALUATION METRICS BREAKDOWN', 12, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Total Questions', 'Correct Answers', 'Incorrect Answers', 'Unattempted', 'Time Spent', 'Final Score']],
    body: [
      [
        `${data.correctCount + data.wrongCount + data.unattemptedCount}`,
        `${data.correctCount}`,
        `${data.wrongCount}`,
        `${data.unattemptedCount}`,
        `${data.timeTakenMinutes} Mins`,
        `${data.scoreObtained}/${data.totalMarks} (${data.scorePercentage}%)`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8.5,
      halign: 'center',
    },
  });

  // @ts-ignore - autoTable attaches lastAutoTable
  y = doc.lastAutoTable.finalY + 10;

  // Question-by-Question Solution Table if available
  if (data.questions && data.questions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('QUESTION-BY-QUESTION RESPONSE ANALYSIS', 12, y);

    y += 3;

    const tableRows = data.questions.map((q, idx) => {
      const userAns = data.answers?.find((a) => a.questionId === q.id);
      let selectedText = 'Unattempted';
      let statusText = 'Skipped';
      let marksText = '0';

      if (userAns) {
        if (userAns.selectedOptionIndex !== null && userAns.selectedOptionIndex !== undefined) {
          selectedText = `Opt ${String.fromCharCode(65 + userAns.selectedOptionIndex)}: ${
            q.options[userAns.selectedOptionIndex] || ''
          }`;
          statusText = userAns.isCorrect ? 'Correct (+)' : 'Incorrect (-)';
          marksText = `${userAns.marksObtained}`;
        }
      }

      const correctOptText = `Opt ${String.fromCharCode(65 + q.correctOptionIndex)}: ${
        q.options[q.correctOptionIndex] || ''
      }`;

      return [
        `Q${idx + 1}`,
        q.questionText.length > 55 ? q.questionText.slice(0, 52) + '...' : q.questionText,
        selectedText.length > 30 ? selectedText.slice(0, 28) + '...' : selectedText,
        correctOptText.length > 30 ? correctOptText.slice(0, 28) + '...' : correctOptText,
        statusText,
        marksText,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: 12, right: 12 },
      head: [['#', 'Question Stem', 'Your Selected Answer', 'Correct Answer', 'Status', 'Marks']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        textColor: [51, 65, 85],
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 42 },
        3: { cellWidth: 42 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
      },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 12;
  } else {
    y += 10;
  }

  // Footer & Official Seal
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.max(y, pageHeight - 25);

  doc.setDrawColor(226, 232, 240);
  doc.line(12, footerY - 5, pageWidth - 12, footerY - 5);

  return doc;
}

export function generateAndDownloadSubmissionPdf(data: SubmissionPdfData) {
  const doc = createSubmissionPdfDocument(data);
  const cleanTitle = (data.testTitle || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanName = (data.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Test_Submission_Report_${cleanName}_${cleanTitle}.pdf`);
}
