import React, { useState, useRef } from 'react';
import { TestPaper, MCQQuestion, DistrictBlock, Candidate } from '../types';
import { parseTestPaperAPI, sendEmailAPI } from '../services/api';
import { PublishSuccessModal } from './PublishSuccessModal';
import mammoth from 'mammoth';
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Send,
  Clock,
  BookOpen,
  Layers,
  Users,
  Globe,
  UserCheck,
  Search,
  Mail,
  Award,
  Download,
  Copy,
  Check,
  FileUp,
  FileCheck,
  HelpCircle,
  Info,
} from 'lucide-react';

const RECOMMENDED_MCQ_FORMAT_SAMPLE = `Q1. Which famous lake built by Maharana Raj Singh I in 1660 AD is located in Rajsamand?
A) Rajsamand Lake (Rajsamudra)
B) Pichola Lake
C) Ana Sagar Lake
D) Fateh Sagar Lake
Correct Answer: A
Marks: 4

Q2. Haldighati mountain pass is located near which historic town in Rajsamand district?
A) Khamnore / Nathdwara
B) Bhim
C) Amet
D) Deogarh
Correct Answer: A
Marks: 4

Q3. What is the primary dimensional stone processed and exported from Rajsamand on a large scale?
A) White Marble & Granite
B) Red Sandstone
C) Limestone
D) Slate Stone
Correct Answer: A
Marks: 4`;

interface TestUploadSectionProps {
  onPublishTest: (test: TestPaper) => void;
  candidateCount: number;
  candidates?: Candidate[];
  editingTest?: TestPaper | null;
  onCancelEdit?: () => void;
  onDeleteTest?: (testId: string) => void;
}

export const TestUploadSection: React.FC<TestUploadSectionProps> = ({
  onPublishTest,
  candidateCount,
  candidates = [],
  editingTest,
  onCancelEdit,
  onDeleteTest,
}) => {
  const [creationMode, setCreationMode] = useState<'AI' | 'MANUAL'>(editingTest ? 'MANUAL' : 'AI');
  const [uploadMethod, setUploadMethod] = useState<'FILE' | 'TEXT'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(true);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Assessment Metadata
  const [testTitle, setTestTitle] = useState<string>(editingTest?.title || 'General Knowledge & District History Assessment');
  const [subject, setSubject] = useState<string>(editingTest?.subject || 'General Knowledge & District History');
  const [targetBlock, setTargetBlock] = useState<DistrictBlock>(editingTest?.targetBlock || 'District-Wide');
  const [timeLimit, setTimeLimit] = useState<number>(editingTest?.timeLimitMinutes || 30);
  const [totalMarks, setTotalMarks] = useState<number>(editingTest?.totalMarks || 100);
  const [passingMarks, setPassingMarks] = useState<number>(editingTest?.passingMarks || 40);
  const [instructions, setInstructions] = useState<string>(editingTest?.instructions || 'Select the correct choice for each MCQ question.');
  const [accessCode, setAccessCode] = useState<string>(
    editingTest?.accessCode || `RJ-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Candidate Assignment Scope State
  const initialAssignmentScope =
    editingTest?.assignedCandidateIds &&
    editingTest.assignedCandidateIds.length > 0 &&
    !editingTest.assignedCandidateIds.includes('ALL')
      ? 'SELECTED'
      : 'ALL';

  const [assignmentScope, setAssignmentScope] = useState<'ALL' | 'SELECTED'>(initialAssignmentScope);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    editingTest?.assignedCandidateIds && !editingTest.assignedCandidateIds.includes('ALL')
      ? editingTest.assignedCandidateIds
      : []
  );
  const [assignSearchTerm, setAssignSearchTerm] = useState<string>('');

  // Candidate assignment helpers
  const handleToggleCandidateAssignment = (candId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleSelectAllFilteredCandidates = (filteredList: Candidate[]) => {
    const ids = filteredList.map((c) => c.id);
    setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearCandidateAssignments = () => {
    setSelectedCandidateIds([]);
  };

  const assignFilteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(assignSearchTerm.toLowerCase());
    return matchesSearch;
  });
  
  // Parsing State
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // MCQ Questions List State
  const [parsedTest, setParsedTest] = useState<{
    testTitle: string;
    subject: string;
    timeLimitMinutes: number;
    totalMarks: number;
    passingMarks: number;
    instructions: string;
    questions: MCQQuestion[];
  } | null>(() => {
    if (editingTest) {
      return {
        testTitle: editingTest.title,
        subject: editingTest.subject,
        timeLimitMinutes: editingTest.timeLimitMinutes,
        totalMarks: editingTest.totalMarks,
        passingMarks: editingTest.passingMarks,
        instructions: editingTest.instructions,
        questions: editingTest.questions || [],
      };
    }
    return null;
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [publishedModalData, setPublishedModalData] = useState<{
    isOpen: boolean;
    test: TestPaper | null;
    notifiedCount: number | string;
    isEdit: boolean;
  }>({
    isOpen: false,
    test: null,
    notifiedCount: 'All',
    isEdit: false,
  });

  // Initialize manual mode with a sample blank question if user clicks Manual Mode and no test yet
  const handleSwitchToManual = () => {
    setCreationMode('MANUAL');
    if (!parsedTest) {
      const initialQ: MCQQuestion = {
        id: `q-${Date.now()}-0`,
        questionText: 'Which famous lake commissioned by Maharana Raj Singh I is located in Rajsamand?',
        options: [
          'Rajsamand Lake (Rajsamudra)',
          'Pichola Lake',
          'Ana Sagar Lake',
          'Fateh Sagar Lake',
        ],
        correctOptionIndex: 0,
        explanation: 'Rajsamand Lake was commissioned by Maharana Raj Singh I of Mewar in 1660 AD.',
        marks: 4,
      };
      setParsedTest({
        testTitle: testTitle || `${subject} District Assessment 2026`,
        subject: subject,
        timeLimitMinutes: timeLimit,
        totalMarks: 4,
        passingMarks: 2,
        instructions: instructions,
        questions: [initialQ],
      });
    }
  };

  // Template Format Utilities for Zero-Error Parsing
  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_MCQ_FORMAT_SAMPLE);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    } catch (err) {
      console.warn('Copy format failed:', err);
    }
  };

  const handleDownloadSampleFormat = () => {
    const docContent = `Rajsamand District Assessment Portal - Recommended MCQ Paper Format Template
================================================================================
FOR 100% ERROR-FREE CONVERSION, FOLLOW THIS SPECIFIC STRUCTURE IN YOUR PDF / DOCX:
1. Label each question with Q1., Q2., etc., or 1., 2.
2. Provide exactly 4 distinct options labeled A), B), C), D) or (A), (B), (C), (D)
3. Clearly specify the answer on its own line: Correct Answer: A (or B / C / D)
4. Optional: Marks: 4
================================================================================

${RECOMMENDED_MCQ_FORMAT_SAMPLE}
`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Rajsamand_MCQ_Paper_Format_Template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Process and convert uploaded file (PDF / DOCX / TXT) directly into editable MCQs
  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    setNotificationMsg(null);

    try {
      let textContent = '';
      let fileDataUri: string | null = null;

      // 1. DOCX Extraction via Mammoth
      if (
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.type.includes('wordprocessingml') ||
        file.type.includes('msword')
      ) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const mammothResult = await mammoth.extractRawText({ arrayBuffer });
          if (mammothResult && mammothResult.value) {
            textContent = mammothResult.value;
            setPastedText(textContent);
          }
        } catch (mErr: any) {
          console.warn('Mammoth DOCX parsing note:', mErr);
        }
      } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        textContent = await file.text();
        setPastedText(textContent);
      }

      // Read as Data URL (for PDF or Images)
      fileDataUri = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setFilePreview(fileDataUri);

      // 2. Send to parse API (which supports both Gemini and local deterministic parser)
      const payload: any = {
        subject,
        targetBlock,
        defaultTimeLimit: timeLimit,
      };

      let resolvedMime = file.type || '';
      const lowerName = file.name.toLowerCase();
      if (!resolvedMime || resolvedMime === 'application/octet-stream') {
        if (lowerName.endsWith('.pdf')) resolvedMime = 'application/pdf';
        else if (lowerName.endsWith('.docx')) resolvedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (lowerName.endsWith('.doc')) resolvedMime = 'application/msword';
        else if (lowerName.endsWith('.png')) resolvedMime = 'image/png';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) resolvedMime = 'image/jpeg';
        else if (lowerName.endsWith('.txt')) resolvedMime = 'text/plain';
      }

      if (textContent) {
        payload.rawText = textContent;
      }
      if (fileDataUri) {
        payload.fileData = fileDataUri;
        payload.mimeType = resolvedMime || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
      }

      const response = await parseTestPaperAPI(payload);

      if (response.success && response.data) {
        const data = response.data;
        const formattedQuestions: MCQQuestion[] = (data.questions || []).map((q: any, idx: number) => ({
          id: `q-${Date.now()}-${idx}`,
          questionText: q.questionText || `Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : [q.options?.[0] || 'Option A', q.options?.[1] || 'Option B', q.options?.[2] || 'Option C', q.options?.[3] || 'Option D'],
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          marks: q.marks || 4,
        }));

        const totalQMarks = formattedQuestions.reduce((acc, q) => acc + q.marks, 0);
        setParsedTest({
          testTitle: data.testTitle || `${file.name.replace(/\.[^/.]+$/, '')} Assessment`,
          subject: data.subject || subject,
          timeLimitMinutes: data.timeLimitMinutes || timeLimit,
          totalMarks: data.totalMarks || totalQMarks || 20,
          passingMarks: data.passingMarks || Math.round((data.totalMarks || totalQMarks || 20) * 0.4),
          instructions: data.instructions || 'Select the correct choice for each MCQ question.',
          questions: formattedQuestions,
        });

        setNotificationMsg(`File "${file.name}" uploaded and converted into ${formattedQuestions.length} editable MCQs! Review and adjust questions below.`);
      } else {
        throw new Error(response.error || 'Failed to extract questions.');
      }
    } catch (err: any) {
      console.error('File conversion error:', err);
      setParseError(err.message || 'Error converting test paper. Please check the suggested format below.');
    } finally {
      setIsParsing(false);
    }
  };

  // File Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleProcessFile(file);
    }
  };

  // Preset Sample Test Loader
  const handleLoadSamplePaper = (sampleType: 'GK' | 'SCIENCE' | 'MATH') => {
    setUploadMethod('TEXT');
    if (sampleType === 'GK') {
      setSubject('General Knowledge & District Heritage');
      setPastedText(`Rajsamand District Secondary Education Unit - Sample Assessment Paper 2026
Subject: Rajasthan General Knowledge & District Geography
Time: 30 Minutes | Total Marks: 20

Q1. Which famous lake built by Maharana Raj Singh I in 1660 AD is located in Rajsamand?
A) Rajsamand Lake (Rajsamudra)
B) Pichola Lake
C) Ana Sagar Lake
D) Fateh Sagar Lake
Correct Answer: A
Explanation: Rajsamand Lake was commissioned by Maharana Raj Singh I of Mewar for drought relief.

Q2. Haldighati mountain pass is located near which historic town in Rajsamand district?
A) Khamnore / Nathdwara
B) Bhim
C) Amet
D) Deogarh
Correct Answer: A
Explanation: Haldighati pass is situated in Khamnore near Nathdwara where Maharana Pratap fought in 1576.

Q3. What is the primary dimensional stone processed and exported from Rajsamand on a large scale?
A) White Marble & Granite
B) Red Sandstone
C) Limestone
D) Slate Stone
Correct Answer: A
Explanation: Rajsamand is India's largest center for marble processing and granite trading.`);
    } else if (sampleType === 'SCIENCE') {
      setSubject('Science & Technological Literacy');
      setPastedText(`Rajsamand District Secondary Science Competency Evaluation
Q1. Which gas is essential for human respiration and cellular oxidation?
A) Oxygen
B) Nitrogen
C) Carbon Dioxide
D) Hydrogen
Correct Answer: A

Q2. What is the chemical formula for pure drinking water?
A) H2O
B) CO2
C) NaCl
D) H2SO4
Correct Answer: A

Q3. Which planet in our solar system is widely known as the Red Planet?
A) Mars
B) Venus
C) Jupiter
D) Saturn
Correct Answer: A`);
    } else {
      setSubject('Mathematics & Logic');
      setPastedText(`Rajsamand District Mathematics Assessment
Q1. What is the square root of 625?
A) 25
B) 15
C) 35
D) 45
Correct Answer: A

Q2. If 15 meters of cloth costs ₹750, what is the cost of 4 meters?
A) ₹200
B) ₹220
C) ₹180
D) ₹240
Correct Answer: A`);
    }
  };

  // Trigger Gemini AI Parsing
  const handleParseWithAI = async () => {
    setIsParsing(true);
    setParseError(null);
    setNotificationMsg(null);

    try {
      let payload: any = {
        subject,
        targetBlock,
        defaultTimeLimit: timeLimit,
      };

      if (uploadMethod === 'FILE') {
        if (!filePreview && !pastedText.trim()) {
          throw new Error('Please select a PDF, image, or docx file to upload.');
        }
        if (pastedText.trim()) {
          payload.rawText = pastedText;
        }
        if (filePreview) {
          let mime = selectedFile?.type || '';
          const lower = selectedFile?.name.toLowerCase() || '';
          if (!mime || mime === 'application/octet-stream') {
            if (lower.endsWith('.pdf')) mime = 'application/pdf';
            else if (lower.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (lower.endsWith('.doc')) mime = 'application/msword';
            else if (lower.endsWith('.png')) mime = 'image/png';
            else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
          }
          payload.fileData = filePreview;
          payload.mimeType = mime || 'application/pdf';
        }
      } else {
        if (!pastedText.trim()) {
          throw new Error('Please enter or paste the test paper text.');
        }
        payload.rawText = pastedText;
      }

      const response = await parseTestPaperAPI(payload);

      if (response.success && response.data) {
        const data = response.data;
        // Ensure questions have valid ids
        const formattedQuestions: MCQQuestion[] = (data.questions || []).map((q: any, idx: number) => ({
          id: `q-${Date.now()}-${idx}`,
          questionText: q.questionText || `Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : [q.options?.[0] || 'Option A', q.options?.[1] || 'Option B', q.options?.[2] || 'Option C', q.options?.[3] || 'Option D'],
          correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
          marks: q.marks || 4,
        }));

        setParsedTest({
          testTitle: data.testTitle || `${subject} District Assessment 2026`,
          subject: data.subject || subject,
          timeLimitMinutes: data.timeLimitMinutes || timeLimit,
          totalMarks: data.totalMarks || formattedQuestions.reduce((acc, q) => acc + q.marks, 0),
          passingMarks: data.passingMarks || Math.round((data.totalMarks || 20) * 0.4),
          instructions: data.instructions || 'Select the correct choice for each MCQ question.',
          questions: formattedQuestions,
        });

        setNotificationMsg('Test paper successfully extracted and converted into editable MCQ format!');
      } else {
        throw new Error(response.error || 'Failed to extract questions.');
      }
    } catch (err: any) {
      console.error('Error parsing test paper:', err);
      setParseError(err.message || 'An error occurred during AI test paper conversion.');
    } finally {
      setIsParsing(false);
    }
  };

  // MCQ Question Editing Helpers
  const handleUpdateMarksPerQuestion = (newMarks: number) => {
    if (!parsedTest) return;
    const validMarks = Math.max(1, isNaN(newMarks) ? 1 : newMarks);
    const updated = parsedTest.questions.map((q) => ({ ...q, marks: validMarks }));
    const newTotal = updated.length * validMarks;
    setParsedTest({
      ...parsedTest,
      totalMarks: newTotal,
      passingMarks: Math.round(newTotal * 0.4),
      questions: updated,
    });
  };

  const handleUpdateQuestionText = (qIndex: number, text: string) => {
    if (!parsedTest) return;
    const updated = [...parsedTest.questions];
    updated[qIndex].questionText = text;
    setParsedTest({ ...parsedTest, questions: updated });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    if (!parsedTest) return;
    const updated = [...parsedTest.questions];
    updated[qIndex].options[optIndex] = text;
    setParsedTest({ ...parsedTest, questions: updated });
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    if (!parsedTest) return;
    const updated = [...parsedTest.questions];
    updated[qIndex].correctOptionIndex = optIndex;
    setParsedTest({ ...parsedTest, questions: updated });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!parsedTest) return;
    const updated = parsedTest.questions.filter((_, idx) => idx !== qIndex);
    const currentMarks = parsedTest.questions[0]?.marks || 4;
    const newTotal = updated.length * currentMarks;
    setParsedTest({
      ...parsedTest,
      questions: updated,
      totalMarks: newTotal,
      passingMarks: Math.round(newTotal * 0.4),
    });
  };

  const handleAddQuestion = () => {
    if (!parsedTest) return;
    const currentMarks = parsedTest.questions[0]?.marks || 4;
    const newQ: MCQQuestion = {
      id: `q-${Date.now()}-${parsedTest.questions.length}`,
      questionText: 'New Multiple Choice Question stem...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: 'Detailed explanation for correct choice.',
      marks: currentMarks,
    };
    const updated = [...parsedTest.questions, newQ];
    const newTotal = updated.length * currentMarks;
    setParsedTest({
      ...parsedTest,
      questions: updated,
      totalMarks: newTotal,
      passingMarks: Math.round(newTotal * 0.4),
    });
  };

  // Final Publish / Save Action
  const handlePublishTest = async () => {
    if (!parsedTest || parsedTest.questions.length === 0) {
      setParseError('Please add at least 1 question before saving or publishing.');
      return;
    }

    if (assignmentScope === 'SELECTED' && selectedCandidateIds.length === 0) {
      setParseError('Please select at least one candidate from the list or switch scope to "All Candidates".');
      return;
    }

    const testPaperToSave: TestPaper = {
      id: editingTest ? editingTest.id : `test-${Date.now()}`,
      title: parsedTest.testTitle || testTitle,
      subject: parsedTest.subject || subject,
      targetBlock,
      timeLimitMinutes: parsedTest.timeLimitMinutes || timeLimit,
      totalMarks: parsedTest.totalMarks || parsedTest.questions.reduce((sum, q) => sum + q.marks, 0),
      passingMarks: parsedTest.passingMarks || Math.round((parsedTest.totalMarks || 20) * 0.4),
      instructions: parsedTest.instructions || instructions,
      accessCode: accessCode.trim().toUpperCase() || `RJ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdBy: editingTest ? editingTest.createdBy : 'District Administration, Rajsamand',
      createdAt: editingTest ? editingTest.createdAt : new Date().toISOString(),
      status: 'PUBLISHED',
      assignedCandidateIds: assignmentScope === 'SELECTED' ? selectedCandidateIds : ['ALL'],
      questions: parsedTest.questions,
    };

    onPublishTest(testPaperToSave);

    const calcCount = assignmentScope === 'SELECTED'
      ? selectedCandidateIds.length
      : candidates && candidates.length > 0
        ? candidates.filter(c => c.activeStatus).length
        : 'All';

    setPublishedModalData({
      isOpen: true,
      test: testPaperToSave,
      notifiedCount: calcCount || 'All',
      isEdit: !!editingTest,
    });

    setNotificationMsg(
      editingTest
        ? `Test paper "${testPaperToSave.title}" has been updated and saved successfully!`
        : `Test paper "${testPaperToSave.title}" published successfully!`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/20 border border-purple-400/35 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/40 shrink-0">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {editingTest ? `Edit Assessment: ${editingTest.title}` : 'Create New Assessment Paper'}
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Upload question documents for AI extraction or construct MCQ assessments manually.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {editingTest && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs border border-white/10"
            >
              Cancel Editing
            </button>
          )}

          <div className="inline-flex p-1 rounded-xl bg-black/30 border border-white/10 text-xs font-bold backdrop-blur-xs">
            <button
              type="button"
              id="file-upload-mode-toggle"
              onClick={() => {
                setCreationMode('AI');
                setUploadMethod('FILE');
                fileInputRef.current?.click();
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                creationMode === 'AI'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> <span>Upload File (PDF / DOCX)</span>
            </button>
            <button
              type="button"
              onClick={handleSwitchToManual}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                creationMode === 'MANUAL'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> <span>Manual Entry</span>
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {notificationMsg && (
        <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold">{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Step 1 & 2: Upload & Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Inputs Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>1. Test Metadata Settings</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Test Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={timeLimit}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTimeLimit(val);
                if (parsedTest) setParsedTest({ ...parsedTest, timeLimitMinutes: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Marks
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={parsedTest ? parsedTest.totalMarks : totalMarks}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalMarks(val);
                  if (parsedTest) setParsedTest({ ...parsedTest, totalMarks: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Passing Marks
              </label>
              <input
                type="number"
                min={1}
                max={parsedTest ? parsedTest.totalMarks : totalMarks}
                value={parsedTest ? parsedTest.passingMarks : passingMarks}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPassingMarks(val);
                  if (parsedTest) setParsedTest({ ...parsedTest, passingMarks: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Test Access Code (For Candidates)
              </label>
              <button
                type="button"
                onClick={() => setAccessCode(`RJ-${Math.floor(1000 + Math.random() * 9000)}`)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
              >
                Auto-Generate
              </button>
            </div>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="e.g. RJ-8829"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none tracking-wider"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Candidates enter this code along with their credentials to access the test.
            </p>
          </div>

          {/* Quick Preset Samples */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
              Preset Sample Test Papers:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('GK')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                Rajsamand GK
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('SCIENCE')}
                className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors cursor-pointer"
              >
                Science
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('MATH')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors cursor-pointer"
              >
                Mathematics
              </button>
            </div>
          </div>
        </div>

        {/* File Upload / Text Area Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>2. Test Paper Source File</span>
              </h3>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUploadMethod('FILE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMethod === 'FILE'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('TEXT')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    uploadMethod === 'TEXT'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Paste Raw Text
                </button>
              </div>
            </div>

            {uploadMethod === 'FILE' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 sm:p-8 text-center bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Click or Drag PDF / DOCX File Here'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Supports <strong>PDF documents (.pdf)</strong>, <strong>Microsoft Word (.docx)</strong>, and plain text (.txt)
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      PDF
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      DOCX
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      TXT
                    </span>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Ready to convert: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                </div>

                {/* Suggested Format Guide for Error-Free Parsing */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Suggested Format (For 100% Error-Free Conversion)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Format your PDF / Word document with this pattern so the system converts it without errors:
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handleCopyTemplate}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy sample format template to clipboard"
                      >
                        {copiedTemplate ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Format</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleFormat}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Download sample format template file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template</span>
                      </button>
                    </div>
                  </div>

                  {/* Format Preview Code Block */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed overflow-x-auto">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Q1. Which famous lake built by Maharana Raj Singh I in 1660 AD is located in Rajsamand?</p>
                    <p className="pl-3">A) Rajsamand Lake (Rajsamudra)</p>
                    <p className="pl-3">B) Pichola Lake</p>
                    <p className="pl-3">C) Ana Sagar Lake</p>
                    <p className="pl-3">D) Fateh Sagar Lake</p>
                    <p className="pl-3 font-semibold text-emerald-600 dark:text-emerald-400">Correct Answer: A</p>
                    <p className="pl-3 text-slate-500">Marks: 4</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Start with <strong>Q1.</strong> or <strong>1.</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>4 choices <strong>A), B), C), D)</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Key: <strong>Correct Answer: A</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Optional <strong>Marks: 4</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  rows={8}
                  placeholder="Paste question paper text here (Questions, Choices A/B/C/D, Answer Key)..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {parseError && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-rose-200 dark:border-rose-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span className="font-semibold">{parseError}</span>
                </div>
                <div className="flex items-center gap-2">
                  {uploadMethod === 'TEXT' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setParseError(null);
                        handleLoadSamplePaper('GK');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Load Sample Paper Text
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setParseError(null);
                        setUploadMethod('TEXT');
                        handleLoadSamplePaper('GK');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Use Sample Text Instead
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Converts PDF/DOCX into Editable MCQs</span>
            </span>

            <button
              id="convert-to-mcqs-btn"
              type="button"
              onClick={handleParseWithAI}
              disabled={isParsing}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isParsing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Converting Document to Editable MCQs...</span>
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  <span>Convert File to Editable MCQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Candidate Assignment & Notification Scope */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>3. Candidate Assignment & Notification Scope</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Select whether this assessment is open to all candidates in the block or assigned strictly to specific candidates.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAssignmentScope('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                assignmentScope === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> <span>All Candidates</span>
            </button>
            <button
              type="button"
              onClick={() => setAssignmentScope('SELECTED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                assignmentScope === 'SELECTED'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> <span>Selected Candidates ({selectedCandidateIds.length})</span>
            </button>
          </div>
        </div>

        {assignmentScope === 'ALL' ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Broadcast Mode (All Registered Candidates)</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                This assessment will be accessible to <strong>all registered candidates</strong>. Notification emails will be dispatched to all active accounts upon publication.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search candidates by name, email, or Reg ID..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllFilteredCandidates(assignFilteredCandidates)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearCandidateAssignments}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {assignFilteredCandidates.length > 0 ? (
                assignFilteredCandidates.map((cand) => {
                  const isSelected = selectedCandidateIds.includes(cand.id);
                  return (
                    <label
                      key={cand.id}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCandidateAssignment(cand.id)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{cand.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
                              {cand.registrationId}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{cand.email}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cand.activeStatus ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {cand.activeStatus ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">No registered candidates found matching search.</div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>
                <strong>Targeted Dispatch:</strong> Only the <strong>{selectedCandidateIds.length} candidate(s)</strong> selected above will receive email notifications and be granted access.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Interactive MCQ Review & Editor */}
      {parsedTest && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1">
                Extracted & Editable MCQ Draft
              </div>
              <input
                type="text"
                value={parsedTest.testTitle}
                onChange={(e) => setParsedTest({ ...parsedTest, testTitle: e.target.value })}
                className="text-xl font-black text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Add Question</span>
              </button>

              <button
                id="publish-test-btn"
                type="button"
                onClick={handlePublishTest}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Publish Test & Notify</span>
              </button>
            </div>
          </div>

          {/* Test Parameters Bar Card */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs items-center">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Questions:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm mt-0.5 block">{parsedTest.questions.length} MCQs</span>
            </div>
            <div>
              <label htmlFor="marks-per-question-input" className="text-slate-500 dark:text-slate-400 block font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Marks Per Question:</span>
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  id="marks-per-question-input"
                  type="number"
                  min={1}
                  max={100}
                  value={parsedTest.questions[0]?.marks ?? 4}
                  onChange={(e) => handleUpdateMarksPerQuestion(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 text-xs font-black text-center text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                <span className="text-slate-500 font-bold">Marks</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Marks:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">{parsedTest.totalMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Passing Marks:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm mt-0.5 block">{parsedTest.passingMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Duration:</span>
              <span className="font-black text-slate-900 dark:text-white text-sm mt-0.5 block">{parsedTest.timeLimitMinutes} Mins</span>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-4">
            {parsedTest.questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                    Q{qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:pl-11">
                  {q.options.map((optText, optIndex) => {
                    const isCorrect = q.correctOptionIndex === optIndex;
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-choice-${q.id}`}
                          checked={isCorrect}
                          onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-black text-slate-500 text-xs w-4">
                          {String.fromCharCode(65 + optIndex)}:
                        </span>
                        <input
                          type="text"
                          value={optText}
                          onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creative Success Popup Modal */}
      <PublishSuccessModal
        isOpen={publishedModalData.isOpen}
        onClose={() => {
          setPublishedModalData((prev) => ({ ...prev, isOpen: false }));
          setParsedTest(null);
          setPastedText('');
          if (onCancelEdit) onCancelEdit();
        }}
        test={publishedModalData.test}
        notifiedCount={publishedModalData.notifiedCount}
        isEdit={publishedModalData.isEdit}
      />
    </div>
  );
};
