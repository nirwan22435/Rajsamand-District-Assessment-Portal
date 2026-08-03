import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TestAttempt, TestPaper, MCQQuestion, Candidate } from '../types';

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

      let explHeight = 0;
      let explLines: string[] = [];
      if (q.explanation) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        explLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, cardWidth - 16);
        explHeight = Math.max(explLines.length * 3.5, 4.5);
      }

      const totalCardHeight = 8 + qHeight + candHeight + corrHeight + (explHeight > 0 ? explHeight + 3 : 0) + 4;

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

      currentY += corrHeight + 2;

      // Explanation Box
      if (q.explanation) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(marginX + 4, currentY, cardWidth - 8, explHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(explLines, marginX + 7, currentY + 3.5);

        currentY += explHeight + 2;
      }

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
  doc.text(`Target Block: ${test.targetBlock}`, 16, y + 20);
  doc.text(`Total MCQs: ${test.questions.length}`, 16, y + 26);

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
    const blockName = att.block || matchedCandidate?.block || 'District-Wide';
    return [
      `#${idx + 1}`,
      att.candidateName,
      regId,
      blockName,
      `${att.scoreObtained} / ${att.totalMarks}`,
      `${att.scorePercentage}%`,
      `${att.timeTakenMinutes} Mins`,
      att.status === 'PASSED' ? 'PASSED' : 'NEEDS FOCUS',
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 12, right: 12 },
    head: [['Rank', 'Candidate Name', 'Registration ID', 'Block / Tehsil', 'Score', 'Percentage', 'Time Taken', 'Result']],
    body: rankedRows.length > 0 ? rankedRows : [['-', 'No submissions recorded yet', '-', '-', '-', '-', '-', '-']],
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
