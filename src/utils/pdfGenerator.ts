import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TestAttempt, TestPaper, MCQQuestion, Candidate, TypingAttempt } from '../types';
import { getDetailedWordAnalysis } from './typingUtils';
import { DEVLYS_010_FONT_BASE64 } from './devlysFontBase64';
import { convertUnicodeToDevlys } from './devlysConverter';

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

export interface TestSummaryPdfData {
  test: TestPaper;
  attempts: TestAttempt[];
  candidates: Candidate[];
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
  doc.text(`Submitted On: ${submittedDateStr}`, 16, y + 32);

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

  // Question-by-Question Solution Cards if available
  if (data.questions && data.questions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('QUESTION-BY-QUESTION RESPONSE ANALYSIS', 12, y);

    y += 5;

    const marginX = 12;
    const cardWidth = pageWidth - 24; // 186mm

    data.questions.forEach((q, idx) => {
      const userAns = data.answers?.find((a) => a.questionId === q.id);
      const isAttempted =
        userAns !== undefined && userAns.selectedOptionIndex !== null && userAns.selectedOptionIndex !== undefined;
      const isCorrect = isAttempted && !!userAns?.isCorrect;

      // Candidate response text
      let candidateOptionText = 'Not Attempted / Skipped';
      if (isAttempted && userAns && userAns.selectedOptionIndex !== undefined && userAns.selectedOptionIndex !== null) {
        const letter = String.fromCharCode(65 + userAns.selectedOptionIndex);
        candidateOptionText = `Option (${letter}): ${q.options[userAns.selectedOptionIndex] || ''}`;
      }

      // Correct response text
      const correctLetter = String.fromCharCode(65 + q.correctOptionIndex);
      const correctOptionText = `Option (${correctLetter}): ${q.options[q.correctOptionIndex] || ''}`;

      // Calculate line wrapping and height
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q.questionText}`, cardWidth - 50);
      const qHeight = Math.max(qLines.length * 4, 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const candLines = doc.splitTextToSize(`Candidate Response: ${candidateOptionText}`, cardWidth - 16);
      const candHeight = Math.max(candLines.length * 3.8, 5.5);

      const corrLines = doc.splitTextToSize(`Correct Response:   ${correctOptionText}`, cardWidth - 16);
      const corrHeight = Math.max(corrLines.length * 3.8, 5.5);

      const totalCardHeight = 8 + qHeight + candHeight + corrHeight + 4;

      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + totalCardHeight > pageHeight - 18) {
        doc.addPage();
        y = 16;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`RAJSAMAND DISTRICT ADMINISTRATION • ASSESSMENT RESPONSE REPORT (Contd.)`, 12, 10);
        doc.setDrawColor(226, 232, 240);
        doc.line(12, 12, pageWidth - 12, 12);
      }

      // Outer Card Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(252, 253, 255);
      doc.roundedRect(marginX, y, cardWidth, totalCardHeight, 2, 2, 'FD');

      let currentY = y + 6;

      // Status Badge top right
      let badgeBg = [254, 243, 199]; // Amber
      let badgeTextClr = [180, 83, 9];
      let badgeBorderClr = [253, 230, 138];
      let badgeLabel = 'SKIPPED (0 Marks)';

      if (isAttempted) {
        if (isCorrect) {
          badgeBg = [220, 252, 231]; // Green
          badgeTextClr = [21, 128, 61];
          badgeBorderClr = [134, 239, 172];
          badgeLabel = `CORRECT (+${userAns?.marksObtained ?? 4} Marks)`;
        } else {
          badgeBg = [254, 226, 226]; // Red
          badgeTextClr = [185, 28, 28];
          badgeBorderClr = [252, 165, 165];
          badgeLabel = `INCORRECT (${userAns?.marksObtained ?? 0} Marks)`;
        }
      }

      const badgeWidth = 44;
      const badgeX = marginX + cardWidth - badgeWidth - 4;
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.setDrawColor(badgeBorderClr[0], badgeBorderClr[1], badgeBorderClr[2]);
      doc.roundedRect(badgeX, currentY - 2, badgeWidth, 6, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(badgeTextClr[0], badgeTextClr[1], badgeTextClr[2]);
      doc.text(badgeLabel, badgeX + badgeWidth / 2, currentY + 2, { align: 'center' });

      // Question Stem
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, marginX + 4, currentY + 1);

      currentY += qHeight + 3;

      // Candidate Response Box
      let candBoxBg = [248, 250, 252];
      let candBoxBorder = [226, 232, 240];
      let candBoxTxt = [51, 65, 85];

      if (isAttempted) {
        if (isCorrect) {
          candBoxBg = [240, 253, 244];
          candBoxBorder = [187, 247, 208];
          candBoxTxt = [22, 101, 52];
        } else {
          candBoxBg = [254, 242, 242];
          candBoxBorder = [254, 202, 202];
          candBoxTxt = [153, 27, 27];
        }
      }

      doc.setFillColor(candBoxBg[0], candBoxBg[1], candBoxBg[2]);
      doc.setDrawColor(candBoxBorder[0], candBoxBorder[1], candBoxBorder[2]);
      doc.roundedRect(marginX + 4, currentY, cardWidth - 8, candHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(candBoxTxt[0], candBoxTxt[1], candBoxTxt[2]);
      doc.text(candLines, marginX + 7, currentY + 3.8);

      currentY += candHeight + 2;

      // Correct Response Box (Always Emerald/Green)
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(marginX + 4, currentY, cardWidth - 8, corrHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text(corrLines, marginX + 7, currentY + 3.8);

      y += totalCardHeight + 4;
    });
  } else {
    y += 10;
  }

  // Footer & Page Numbers
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Rajsamand District Administration • Official Candidate Scorecard • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function generateAndDownloadSubmissionPdf(data: SubmissionPdfData) {
  const doc = createSubmissionPdfDocument(data);
  const cleanTitle = (data.testTitle || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanName = (data.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Test_Submission_Report_${cleanName}_${cleanTitle}.pdf`);
}

export function createTestSummaryPdfDocument(data: TestSummaryPdfData): jsPDF {
  const { test, attempts, candidates } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const testAttempts = attempts.filter((a) => a.testId === test.id);
  const totalAttempts = testAttempts.length;

  const passedCount = testAttempts.filter((a) => a.status === 'PASSED').length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  const avgScore =
    totalAttempts > 0
      ? Math.round(testAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / totalAttempts)
      : 0;

  const avgTimeTaken =
    totalAttempts > 0
      ? Math.round((testAttempts.reduce((sum, a) => sum + a.timeTakenMinutes, 0) / totalAttempts) * 10) / 10
      : 0;

  // Header Banner
  doc.setFillColor(15, 118, 110); // Emerald/Teal #0f766e
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RAJSAMAND DISTRICT ADMINISTRATION', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL TEST PAPER SUMMARY & ANALYTICS REPORT', pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.text('District Evaluation Authority • Government of Rajasthan', pageWidth / 2, 23, { align: 'center' });

  let y = 34;

  // Test Details Summary Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, y, 186, 28, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Test Title: ${test.title}`, 16, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Subject: ${test.subject}`, 16, y + 14);
  doc.text(`Total MCQs: ${test.questions.length}`, 16, y + 20);

  doc.text(`Total Marks: ${test.totalMarks}`, 108, y + 14);
  doc.text(`Passing Marks: ${test.passingMarks}`, 108, y + 20);
  doc.text(`Access Code: ${test.accessCode || 'N/A'}`, 108, y + 26);

  y += 34;

  // Overview Metrics Box Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('OVERALL TEST PERFORMANCE METRICS', 12, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Total Submissions', 'Average Score %', 'Qualification Pass %', 'Average Time Spent']],
    body: [[`${totalAttempts}`, `${avgScore}%`, `${passRate}%`, `${avgTimeTaken} Mins`]],
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
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;

  // Ranked Candidates Merit List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('CANDIDATE MERIT RANKINGS & EVALUATION RESULTS', 12, y);

  y += 3;

  const rankedAttempts = [...testAttempts].sort((a, b) => {
    if (b.scorePercentage !== a.scorePercentage) return b.scorePercentage - a.scorePercentage;
    if (a.timeTakenMinutes !== b.timeTakenMinutes) return a.timeTakenMinutes - b.timeTakenMinutes;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  const rankedRows = rankedAttempts.map((att, idx) => {
    const matchedCandidate = candidates.find((c) => c.id === att.candidateId);
    const regId = matchedCandidate?.registrationId || 'RJ-2026';
    return [
      `#${idx + 1}`,
      att.candidateName,
      regId,
      `${att.scoreObtained} / ${att.totalMarks}`,
      `${att.scorePercentage}%`,
      `${att.timeTakenMinutes} Mins`,
      att.status === 'PASSED' ? 'PASSED' : 'NEEDS FOCUS',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Rank', 'Candidate Name', 'Registration ID', 'Score', 'Percentage', 'Time Taken', 'Result']],
    body: rankedRows.length > 0 ? rankedRows : [['-', 'No submissions recorded yet', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      halign: 'center',
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;

  // Question-Wise Accuracy Analysis Table
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('QUESTION-WISE ACCURACY BREAKDOWN & ANSWER KEY', 12, y);

  y += 3;

  const questionRows = test.questions.map((q, idx) => {
    let correctAttempts = 0;
    testAttempts.forEach((att) => {
      const userAns = att.answers?.find((ans) => ans.questionId === q.id);
      if (userAns && userAns.selectedOptionIndex === q.correctOptionIndex) {
        correctAttempts++;
      }
    });
    const accuracyRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const correctOptionText = q.options[q.correctOptionIndex] || 'N/A';

    return [
      `Q${idx + 1}`,
      q.questionText,
      `Option (${String.fromCharCode(65 + q.correctOptionIndex)}): ${correctOptionText}`,
      `${accuracyRate}%`,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['#', 'Question Text', 'Correct Choice', 'Accuracy Rate']],
    body: questionRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 60 },
      3: { cellWidth: 24, halign: 'center' },
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
    },
  });

  // Footer & Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Rajsamand District Administration • Official Test Paper Summary Report • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function generateAndDownloadTestPaperSummaryPdf(data: TestSummaryPdfData) {
  const doc = createTestSummaryPdfDocument(data);
  const cleanTitle = (data.test.title || 'Test_Paper').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Test_Summary_Report_${cleanTitle}.pdf`);
}

export interface CandidateAnalyticsPdfData {
  tests: TestPaper[];
  attempts: TestAttempt[];
  candidates: Candidate[];
}

export function createCandidateAnalyticsPdfDocument(data: CandidateAnalyticsPdfData): jsPDF {
  const { tests, attempts, candidates } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 118, 110); // Emerald/Teal #0f766e
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RAJSAMAND DISTRICT ADMINISTRATION', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL CANDIDATE PERFORMANCE & DISTRICT TEST ANALYTICS REPORT', pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.text('District Evaluation Authority • Government of Rajasthan', pageWidth / 2, 23, { align: 'center' });

  let y = 34;

  const totalCandidates = candidates.length;
  const validCandidateIds = new Set(candidates.map((c) => c.id));
  const validCandidateEmails = new Set(candidates.map((c) => c.email?.toLowerCase().trim()));

  const validAttempts = attempts.filter(
    (a) =>
      (a.candidateId && validCandidateIds.has(a.candidateId)) ||
      (a.candidateEmail && validCandidateEmails.has(a.candidateEmail.toLowerCase().trim()))
  );

  const totalSubmissions = validAttempts.length;
  const passedAttempts = validAttempts.filter((a) => a.status === 'PASSED').length;
  const overallPassRate = totalSubmissions > 0 ? Math.round((passedAttempts / totalSubmissions) * 100) : 0;
  const avgDistrictScore =
    totalSubmissions > 0
      ? Math.round(validAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / totalSubmissions)
      : 0;

  // District Overview Metrics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DISTRICT-WIDE ASSESSMENT PERFORMANCE OVERVIEW', 12, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Total Candidates', 'Tests Published', 'Total Submissions', 'District Average Score', 'Overall Qualification %']],
    body: [[
      `${totalCandidates}`,
      `${tests.length}`,
      `${totalSubmissions}`,
      `${avgDistrictScore}%`,
      `${overallPassRate}%`,
    ]],
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
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // Test Papers Analytics Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TEST PAPERS ANALYTICS SUMMARY', 12, y);

  y += 3;

  const testPaperRows = tests.map((t, idx) => {
    const tAttempts = validAttempts.filter((a) => a.testId === t.id);
    const tCount = tAttempts.length;
    const tPassed = tAttempts.filter((a) => a.status === 'PASSED').length;
    const tPassRate = tCount > 0 ? `${Math.round((tPassed / tCount) * 100)}%` : 'N/A';
    const tAvg = tCount > 0 ? `${Math.round(tAttempts.reduce((s, a) => s + a.scorePercentage, 0) / tCount)}%` : 'N/A';

    return [
      `#${idx + 1}`,
      t.title,
      t.subject || 'General',
      `${t.questions?.length || 0}`,
      `${t.totalMarks}`,
      `${tCount}`,
      tAvg,
      tPassRate,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['#', 'Test Paper Title', 'Subject', 'MCQs', 'Marks', 'Submissions', 'Avg Score', 'Pass %']],
    body: testPaperRows.length > 0 ? testPaperRows : [['-', 'No tests published yet', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      halign: 'center',
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // Candidate Performance Merit & Score Table
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('CANDIDATE PERFORMANCE & EVALUATION SUMMARY', 12, y);

  y += 3;

  const candidateRows = candidates.map((c, idx) => {
    const cAttempts = validAttempts.filter(
      (a) => a.candidateId === c.id || (c.email && a.candidateEmail?.toLowerCase() === c.email.toLowerCase())
    );
    const count = cAttempts.length;
    const highest = count > 0 ? Math.max(...cAttempts.map((a) => a.scorePercentage)) : 0;
    const avg = count > 0 ? Math.round(cAttempts.reduce((s, a) => s + a.scorePercentage, 0) / count) : 0;
    const passed = cAttempts.some((a) => a.status === 'PASSED');
    const status = count === 0 ? 'UNASSESSED' : passed ? 'PASSED' : 'NEEDS FOCUS';

    return [
      `#${idx + 1}`,
      c.name,
      c.registrationId,
      c.block || 'District',
      `${count}`,
      count > 0 ? `${highest}%` : '-',
      count > 0 ? `${avg}%` : '-',
      status,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['#', 'Candidate Name', 'Registration ID', 'Block', 'Tests Taken', 'Highest %', 'Average %', 'Status']],
    body: candidateRows.length > 0 ? candidateRows : [['-', 'No candidates registered yet', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
      halign: 'center',
    },
  });

  // Footer & Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Rajsamand District Administration • Candidate Performance Analytics Report • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function generateAndDownloadCandidateAnalyticsPdf(data: CandidateAnalyticsPdfData) {
  const doc = createCandidateAnalyticsPdfDocument(data);
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rajsamand_Candidate_Performance_Analytics_${dateStr}.pdf`);
}

// -------------------------------------------------------------
// Official Typing Test Merit List & Scorecard PDF Generation
// -------------------------------------------------------------

export interface TypingMeritReportPdfData {
  attempts: TypingAttempt[];
  testTitle?: string;
  examDateStr?: string;
  filterBlock?: string;
  filterLanguage?: string;
}

export function downloadTypingMeritReportPdf(data: TypingMeritReportPdfData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const formattedExamDate = data.examDateStr
    ? data.examDateStr
    : data.attempts.length > 0 && data.attempts[0].submittedAt
    ? new Date(data.attempts[0].submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  // Top National Header Ribbon
  doc.setFillColor(255, 153, 51); // Saffron
  doc.rect(0, 0, pageWidth / 3, 2.5, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 0, pageWidth / 3, 2.5, 'F');
  doc.setFillColor(19, 136, 8); // Green
  doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, 2.5, 'F');

  // Main Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 2.5, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GOVERNMENT OF RAJASTHAN • DISTRICT ADMINISTRATION RAJSAMAND', pageWidth / 2, 10, {
    align: 'center',
  });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('TYPING SPEED ASSESSMENT & MERIT EVALUATION REPORT', pageWidth / 2, 17, {
    align: 'center',
  });

  // EXAM DATE IN HEADING
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 224, 71); // Yellow-300
  doc.text(`EXAM DATE: ${formattedExamDate} • EVALUATION CELL, RAJSAMAND`, pageWidth / 2, 24, {
    align: 'center',
  });

  // Sub-header stats row
  let y = 35;
  const totalAttempts = data.attempts.length;
  const qualifiedCount = data.attempts.filter((a) => a.status === 'QUALIFIED').length;
  const avgSpeed =
    totalAttempts > 0
      ? Math.round((data.attempts.reduce((sum, a) => sum + (a.netWpm || 0), 0) / totalAttempts) * 10) / 10
      : 0;
  const topSpeed = totalAttempts > 0 ? Math.max(...data.attempts.map((a) => a.netWpm || 0)) : 0;

  // Stats Card in PDF
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, y, pageWidth - 24, 13, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Assessment Title: ${data.testTitle || 'All Typing Tests'}   |   Total Candidates: ${totalAttempts}   |   Qualified: ${qualifiedCount} (${totalAttempts > 0 ? Math.round((qualifiedCount / totalAttempts) * 100) : 0}%)   |   Avg Net Speed: ${avgSpeed} WPM   |   Highest Speed: ${topSpeed} WPM`,
    16,
    y + 8
  );

  y += 18;

  // Candidate Data Table
  const tableRows = data.attempts.map((att, idx) => {
    const isQual = att.status === 'QUALIFIED';
    const langLabel = att.language === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English';
    const analysis = getDetailedWordAnalysis(att);
    const dateStr = att.submittedAt
      ? new Date(att.submittedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : formattedExamDate;

    return [
      idx + 1,
      att.registrationId || att.candidateId || '-',
      att.candidateName || 'Candidate',
      langLabel,
      dateStr,
      analysis.totalWordsInPara,
      analysis.correctWordsCount,
      analysis.incorrectWordsCount,
      analysis.skippedWordsCount,
      `${att.netWpm || 0} WPM`,
      `${analysis.accuracyPercentage}%`,
      isQual ? 'QUALIFIED' : 'DISQUALIFIED',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [
      [
        'S.No.',
        'Roll No.',
        'Candidate Name',
        'Medium',
        'Exam Date',
        'Total Words',
        'Correct',
        'Incorrect',
        'Skipped',
        'Net Speed',
        'Accuracy',
        'Merit Status',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 48 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 20, halign: 'center' },
      11: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
    },
    didParseCell: function (data) {
      if (data.column.index === 11 && data.cell.section === 'body') {
        if (data.cell.raw === 'QUALIFIED') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald green
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // Rose red
        }
      }
    },
  });

  // Footer & Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `District Administration Rajsamand, Rajasthan • Official Typing Speed Assessment Evaluation Report (Exam Date: ${formattedExamDate}) • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanFileDate = formattedExamDate.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Rajsamand_Typing_Merit_Report_ExamDate_${cleanFileDate}.pdf`);
}

export function downloadCandidateTypingScorecardPdf(attempt: TypingAttempt, referencePassage?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isQualified = attempt.status === 'QUALIFIED';
  const isHindi = attempt.language === 'HINDI_DEVLYS_010';

  // Embed and register DevLys 010 font for Hindi Typing Assessments
  if (isHindi) {
    doc.addFileToVFS('DevLys010.ttf', DEVLYS_010_FONT_BASE64);
    doc.addFont('DevLys010.ttf', 'DevLys010', 'normal');
    doc.addFont('DevLys010.ttf', 'DevLys010', 'bold');
  }

  const examDateFormatted = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const examTimeFormatted = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Top National Header Ribbon
  doc.setFillColor(255, 153, 51); // Saffron
  doc.rect(0, 0, pageWidth / 3, 2, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 0, pageWidth / 3, 2, 'F');
  doc.setFillColor(19, 136, 8); // Green
  doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, 2, 'F');

  // Main Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 2, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('GOVERNMENT OF RAJASTHAN • DISTRICT ADMINISTRATION RAJSAMAND', pageWidth / 2, 10, {
    align: 'center',
  });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text('OFFICIAL TYPING SPEED ASSESSMENT SCORECARD', pageWidth / 2, 17, {
    align: 'center',
  });

  // Prominent Exam Date in Heading
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 224, 71);
  doc.text(`EXAM DATE: ${examDateFormatted} ${examTimeFormatted ? `at ${examTimeFormatted}` : ''} • EVALUATION CELL`, pageWidth / 2, 23, {
    align: 'center',
  });

  let y = 35;

  // Candidate Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, y, 90, 44, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('CANDIDATE CREDENTIALS', 16, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Name: ${attempt.candidateName || 'Candidate'}`, 16, y + 14);
  doc.text(`Roll / Reg No: ${attempt.registrationId || attempt.candidateId || 'N/A'}`, 16, y + 20);
  doc.text(`Email: ${attempt.candidateEmail || 'N/A'}`, 16, y + 26);
  doc.text(`Exam Date: ${examDateFormatted}`, 16, y + 32);

  const analysis = getDetailedWordAnalysis(attempt, referencePassage);

  const formatWordForPdf = (word: string): string => {
    if (!word) return '';
    if (isHindi && /[\u0900-\u097F]/.test(word)) {
      return convertUnicodeToDevlys(word);
    }
    return word;
  };

  const testPaperLabel = isHindi
    ? 'Hindi Typing Assessment (DevLys 010)'
    : (attempt.testTitle || 'Typing Assessment');

  // Performance Box (Right)
  doc.setFillColor(isQualified ? 240 : 254, isQualified ? 253 : 242, isQualified ? 244 : 242);
  doc.setDrawColor(isQualified ? 187 : 254, isQualified ? 247 : 202, isQualified ? 208 : 202);
  doc.roundedRect(108, y, 90, 48, 3, 3, 'FD');

  doc.setTextColor(isQualified ? 21 : 225, isQualified ? 128 : 29, isQualified ? 61 : 72);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`RESULT: ${attempt.status || 'EVALUATED'}`, 112, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Test Paper: ${testPaperLabel}`, 112, y + 13);
  doc.text(`Medium: ${isHindi ? 'Hindi (DevLys 010)' : 'English'}`, 112, y + 19);
  doc.text(`Net Speed: ${attempt.netWpm || 0} WPM (Gross: ${attempt.grossWpm || 0} WPM)`, 112, y + 25);
  doc.text(`Accuracy Rate: ${analysis.accuracyPercentage}%  •  Duration: ${Math.floor((attempt.timeTakenSeconds || 0) / 60)}m ${(attempt.timeTakenSeconds || 0) % 60}s / 10m`, 112, y + 31);
  doc.text(`Correct: ${analysis.correctWordsCount}  •  Incorrect: ${analysis.incorrectWordsCount}  •  Skipped: ${analysis.skippedWordsCount}`, 112, y + 37);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isQualified ? 21 : 180, isQualified ? 128 : 20, isQualified ? 61 : 50);
  doc.text(`Skipped Word Count: ${analysis.skippedWordsCount} Words (Omitted From Para)`, 112, y + 43);

  y += 54;

  // Breakdown Table
  const breakdownRows = [
    ['Total Words in Reference Paragraph', `${analysis.totalWordsInPara} words`],
    ['Correctly Typed Words', `${analysis.correctWordsCount} words`],
    ['Incorrectly Typed Words', `${analysis.incorrectWordsCount} words`],
    ['Skipped Words (Omitted from Paragraph)', `${analysis.skippedWordsCount} words`],
    ['Gross Typing Speed', `${attempt.grossWpm || 0} Words Per Minute (WPM)`],
    ['Net Typing Speed', `${attempt.netWpm || 0} Words Per Minute (WPM)`],
    ['Calculated Accuracy Percentage', `${analysis.accuracyPercentage}% (Total Correctly Typed / Reference Words)`],
    ['Qualifying Criteria', 'Based on No. of correctly typed words in 10 mins only'],
    ['Official Assessment Result', attempt.status || 'EVALUATED'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Evaluation Parameter', 'Candidate Performance Metric']],
    body: breakdownRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'helvetica',
    },
    columnStyles: {
      0: { cellWidth: 96, fontStyle: 'bold' },
      1: { cellWidth: 90, halign: 'center' },
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      font: 'helvetica',
    },
  });

  const passageToDisplay = formatWordForPdf(analysis.referencePassage || 'Reference test passage recorded for assessment.');
  const formattedCorrectWords = analysis.correctWords.map(formatWordForPdf);
  const formattedIncorrectWords = analysis.incorrectWords.map((item) => ({
    refWord: item.refWord === '(Extra Word)' ? '(Extra Word)' : formatWordForPdf(item.refWord),
    typedWord: item.typedWord ? formatWordForPdf(item.typedWord) : '',
  }));
  const formattedSkippedWords = analysis.skippedWords.map(formatWordForPdf);

  // Section 1: Reference Test Paragraph (Rendered in DevLys 010 for Hindi)
  const refParaY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : y + 60;
  autoTable(doc, {
    startY: refParaY,
    margin: { left: 12, right: 12 },
    head: [[`1. REFERENCE TEST PARAGRAPH (${analysis.totalWordsInPara} Total Words)`]],
    body: [[passageToDisplay]],
    theme: 'plain',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'helvetica',
    },
    bodyStyles: {
      fillColor: [248, 250, 252],
      textColor: [30, 41, 59],
      font: isHindi ? 'DevLys010' : 'helvetica',
      fontSize: isHindi ? 10.5 : 7.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 4,
    },
  });

  // Section 2: Correctly Typed Words (Rendered in DevLys 010 for Hindi)
  const correctY = (doc as any).lastAutoTable.finalY + 6;
  const correctWordsText =
    formattedCorrectWords.length > 0
      ? formattedCorrectWords.join('   ')
      : 'No words correctly typed.';

  autoTable(doc, {
    startY: correctY,
    margin: { left: 12, right: 12 },
    head: [[`2. CORRECTLY TYPED WORDS (${analysis.correctWordsCount} Words)`]],
    body: [
      [
        {
          content: correctWordsText,
          styles: {
            font: isHindi && formattedCorrectWords.length > 0 ? 'DevLys010' : 'helvetica',
            fontSize: isHindi && formattedCorrectWords.length > 0 ? 10.5 : 7.5,
          },
        },
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'helvetica',
    },
    bodyStyles: {
      fillColor: [240, 253, 244],
      textColor: [22, 101, 52],
      lineColor: [187, 247, 208],
      lineWidth: 0.2,
      cellPadding: 4,
    },
  });

  // Section 3: Incorrectly Typed Words (Rendered in DevLys 010 for Hindi)
  const incorrectY = (doc as any).lastAutoTable.finalY + 6;

  // Prominent Section 3 Heading Banner
  autoTable(doc, {
    startY: incorrectY,
    margin: { left: 12, right: 12 },
    head: [[`3. INCORRECTLY TYPED WORDS (${analysis.incorrectWordsCount} Words)`]],
    body: [],
    theme: 'plain',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'helvetica',
    },
  });

  const incorrectTableY = (doc as any).lastAutoTable.finalY;

  if (formattedIncorrectWords.length > 0) {
    const incorrectTableRows = formattedIncorrectWords.map((item, idx) => [
      `#${idx + 1}`,
      {
        content: item.refWord,
        styles: {
          font: isHindi && item.refWord !== '(Extra Word)' ? 'DevLys010' : 'helvetica',
          fontSize: isHindi && item.refWord !== '(Extra Word)' ? 10.5 : 7.5,
          fontStyle: (item.refWord === '(Extra Word)' ? 'italic' : 'bold') as 'italic' | 'bold',
          textColor: (item.refWord === '(Extra Word)' ? [100, 116, 139] : [30, 41, 59]) as [number, number, number],
        },
      },
      {
        content: item.typedWord || '(Missing/Unfinished)',
        styles: {
          font: isHindi && item.typedWord ? 'DevLys010' : 'helvetica',
          fontSize: isHindi && item.typedWord ? 10.5 : 7.5,
          fontStyle: (!item.typedWord ? 'italic' : 'bold') as 'italic' | 'bold',
          textColor: [225, 29, 72] as [number, number, number],
        },
      },
      item.refWord === '(Extra Word)' ? 'Unsolicited Extra Word' : 'Spelling Mismatch',
    ]);

    autoTable(doc, {
      startY: incorrectTableY,
      margin: { left: 12, right: 12 },
      head: [['#', 'Expected Reference Word', 'Candidate Typed Token', 'Discrepancy Category']],
      body: incorrectTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [244, 63, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        font: 'helvetica',
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center', font: 'helvetica' },
        1: { cellWidth: 62 },
        2: { cellWidth: 62 },
        3: { cellWidth: 48, halign: 'center', font: 'helvetica' },
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 7.5,
        font: 'helvetica',
      },
    });
  } else {
    autoTable(doc, {
      startY: incorrectTableY,
      margin: { left: 12, right: 12 },
      head: [],
      body: [['Zero incorrect or mistyped words recorded during the assessment (100% precision).']],
      theme: 'plain',
      bodyStyles: {
        fillColor: [255, 241, 242],
        textColor: [159, 18, 57],
        fontSize: 7.5,
        font: 'helvetica',
        lineColor: [254, 205, 211],
        lineWidth: 0.2,
      },
    });
  }

  // Section 4: Skipped Words (Rendered in DevLys 010 for Hindi)
  const skippedY = (doc as any).lastAutoTable.finalY + 6;
  const skippedWordsText =
    formattedSkippedWords.length > 0
      ? formattedSkippedWords.join('   ')
      : 'No words skipped in the reference paragraph (All words attempted).';

  autoTable(doc, {
    startY: skippedY,
    margin: { left: 12, right: 12 },
    head: [[`4. SKIPPED WORDS (TOTAL SKIPPED WORDS COUNT: ${analysis.skippedWordsCount} WORDS)`]],
    body: [
      [
        {
          content: skippedWordsText,
          styles: {
            font: isHindi && formattedSkippedWords.length > 0 ? 'DevLys010' : 'helvetica',
            fontSize: isHindi && formattedSkippedWords.length > 0 ? 10.5 : 7.5,
          },
        },
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      font: 'helvetica',
    },
    bodyStyles: {
      fillColor: [255, 251, 235],
      textColor: [146, 64, 14],
      fontSize: 7.5,
      lineColor: [253, 230, 138],
      lineWidth: 0.2,
      cellPadding: 4,
    },
  });

  // Footer & Official Signatures
  let sigY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 14 : pageHeight - 35;
  if (sigY > pageHeight - 32) {
    doc.addPage();
    sigY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(130, sigY + 10, 195, sigY + 10);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory / Evaluation Officer', 132, sigY + 14);
  doc.text('District Administration, Rajsamand', 132, sigY + 18);

  // Footer & Page Numbers across all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `District Administration Rajsamand • Official Candidate Typing Assessment Scorecard (Exam Date: ${examDateFormatted}) • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const cleanCandidateName = (attempt.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Typing_Scorecard_${cleanCandidateName}_ExamDate_${examDateFormatted.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

