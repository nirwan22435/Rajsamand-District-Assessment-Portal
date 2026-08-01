import React, { useState } from 'react';
import { TestPaper, MCQQuestion, DistrictBlock, Candidate } from '../types';
import { parseTestPaperAPI, sendEmailAPI } from '../services/api';
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
} from 'lucide-react';

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
  
  // Assessment Metadata
  const [testTitle, setTestTitle] = useState<string>(editingTest?.title || 'General Knowledge & District History Assessment');
  const [subject, setSubject] = useState<string>(editingTest?.subject || 'General Knowledge & District History');
  const [targetBlock, setTargetBlock] = useState<DistrictBlock>(editingTest?.targetBlock || 'District-Wide');
  const [timeLimit, setTimeLimit] = useState<number>(editingTest?.timeLimitMinutes || 30);
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
  const [assignBlockFilter, setAssignBlockFilter] = useState<string>('ALL');

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
    const matchesBlock = assignBlockFilter === 'ALL' || c.block === assignBlockFilter;
    return matchesSearch && matchesBlock;
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

  // File Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setParseError(null);

      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        if (!filePreview) {
          throw new Error('Please select a PDF, image, or docx file to upload.');
        }
        const mimeType = selectedFile?.type || 'image/jpeg';
        payload.fileData = filePreview;
        payload.mimeType = mimeType;
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
          explanation: q.explanation || 'Refer to Rajsamand District Board syllabus.',
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

  const handleUpdateExplanation = (qIndex: number, text: string) => {
    if (!parsedTest) return;
    const updated = [...parsedTest.questions];
    updated[qIndex].explanation = text;
    setParsedTest({ ...parsedTest, questions: updated });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!parsedTest) return;
    const updated = parsedTest.questions.filter((_, idx) => idx !== qIndex);
    const newTotal = updated.reduce((sum, q) => sum + q.marks, 0);
    setParsedTest({ ...parsedTest, questions: updated, totalMarks: newTotal });
  };

  const handleAddQuestion = () => {
    if (!parsedTest) return;
    const newQ: MCQQuestion = {
      id: `q-${Date.now()}-${parsedTest.questions.length}`,
      questionText: 'New Multiple Choice Question stem...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: 'Detailed explanation for correct choice.',
      marks: 4,
    };
    const updated = [...parsedTest.questions, newQ];
    const newTotal = updated.reduce((sum, q) => sum + q.marks, 0);
    setParsedTest({ ...parsedTest, questions: updated, totalMarks: newTotal });
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

    setNotificationMsg(
      editingTest
        ? `Test paper "${testPaperToSave.title}" has been updated and saved successfully!`
        : `Test paper "${testPaperToSave.title}" published successfully! ${
            assignmentScope === 'SELECTED'
              ? `Notifications sent ONLY to ${selectedCandidateIds.length} assigned candidate(s).`
              : 'Notifications sent to all candidates in block.'
          }`
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {editingTest ? `Edit Assessment: ${editingTest.title}` : 'Create New Test Paper'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create or edit test papers manually or convert PDF / Image documents using AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {editingTest && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Cancel Editing
            </button>
          )}

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCreationMode('AI')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                creationMode === 'AI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Create New Test (AI)
            </button>
            <button
              type="button"
              onClick={handleSwitchToManual}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                creationMode === 'MANUAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Manual Entry
            </button>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{notificationMsg}</span>
        </div>
      )}

      {/* Step 1: Upload & Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Inputs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            1. Test Metadata Settings
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Tehsil / District Block
            </label>
            <select
              value={targetBlock}
              onChange={(e) => setTargetBlock(e.target.value as DistrictBlock)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="District-Wide">District-Wide (All Rajsamand Tehsils)</option>
              <option value="Nathdwara">Nathdwara Tehsil</option>
              <option value="Kumbhalgarh">Kumbhalgarh Tehsil</option>
              <option value="Bhim">Bhim Tehsil</option>
              <option value="Rajsamand">Rajsamand Tehsil</option>
              <option value="Amet">Amet Tehsil</option>
              <option value="Deogarh">Deogarh Tehsil</option>
              <option value="Railmagra">Railmagra Tehsil</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Test Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Test Access Code (For Candidates)
              </label>
              <button
                type="button"
                onClick={() => setAccessCode(`RJ-${Math.floor(1000 + Math.random() * 9000)}`)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Auto-Generate
              </button>
            </div>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="e.g. RJ-8829 or custom code"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none tracking-wide"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Candidates enter this code along with their Email ID during login to unlock & attempt this test.
            </p>
          </div>

          {/* Quick Preset Samples */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Load Preset Sample Test Papers:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('GK')}
                className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
              >
                Rajsamand GK
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('SCIENCE')}
                className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
              >
                Science
              </button>
              <button
                type="button"
                onClick={() => handleLoadSamplePaper('MATH')}
                className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
              >
                Mathematics
              </button>
            </div>
          </div>
        </div>

        {/* File Upload / Text Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                2. Test Paper Source File
              </h3>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUploadMethod('FILE')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    uploadMethod === 'FILE'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Upload File (PDF / JPG / DOCX)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('TEXT')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    uploadMethod === 'TEXT'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Paste Raw Text
                </button>
              </div>
            </div>

            {uploadMethod === 'FILE' ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,text/plain"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or Drag Test Paper File Here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports scanned PDF, question paper photos (JPG/PNG), DOCX or TXT files
                </p>
              </div>
            ) : (
              <div>
                <textarea
                  rows={8}
                  placeholder="Paste question paper text here (Questions, Choices A/B/C/D, Answer Key)..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {parseError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Gemini 3.6 Flash Server-Side Multimodal AI
            </span>

            <button
              id="ai-parse-btn"
              type="button"
              onClick={handleParseWithAI}
              disabled={isParsing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting Paper to MCQs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convert Test Paper with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Candidate Assignment & Notification Scope */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              3. Candidate Assignment & Notification Scope
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select whether this test is open to all candidates in the block or assigned strictly to specific candidates.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAssignmentScope('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                assignmentScope === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> All Candidates
            </button>
            <button
              type="button"
              onClick={() => setAssignmentScope('SELECTED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                assignmentScope === 'SELECTED'
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Selected Candidates Only ({selectedCandidateIds.length})
            </button>
          </div>
        </div>

        {assignmentScope === 'ALL' ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Broadcast Mode (All Block Candidates)</p>
              <p className="text-[11px] opacity-90">
                This test will be available to <strong>all candidates</strong> registered in the selected Tehsil (<em>"{targetBlock}"</em>). Notification emails will be sent to all active candidates in this block.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search candidates by name, email, or Reg ID..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={assignBlockFilter}
                  onChange={(e) => setAssignBlockFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                >
                  <option value="ALL">All Tehsils / Blocks</option>
                  <option value="Nathdwara">Nathdwara</option>
                  <option value="Kumbhalgarh">Kumbhalgarh</option>
                  <option value="Bhim">Bhim</option>
                  <option value="Rajsamand">Rajsamand</option>
                  <option value="Amet">Amet</option>
                  <option value="Deogarh">Deogarh</option>
                  <option value="Railmagra">Railmagra</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleSelectAllFilteredCandidates(assignFilteredCandidates)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearCandidateAssignments}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition-colors"
                >
                  Clear Selection
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
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{cand.email} • {cand.block} Tehsil</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cand.activeStatus ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {cand.activeStatus ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">No registered candidates found matching search.</div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>
                <strong>Targeted Dispatch:</strong> Only the <strong>{selectedCandidateIds.length} candidate(s)</strong> selected above will receive email notifications and be granted portal access to this assessment.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Interactive MCQ Review & Editor */}
      {parsedTest && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-1">
                Extracted & Editable MCQ Draft
              </div>
              <input
                type="text"
                value={parsedTest.testTitle}
                onChange={(e) => setParsedTest({ ...parsedTest, testTitle: e.target.value })}
                className="text-xl font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>

              <button
                id="publish-test-btn"
                type="button"
                onClick={handlePublishTest}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Publish Test & Notify Candidates</span>
              </button>
            </div>
          </div>

          {/* Test Parameters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Questions:</span>
              <span className="font-bold text-slate-900 dark:text-white">{parsedTest.questions.length} MCQs</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Marks:</span>
              <span className="font-bold text-slate-900 dark:text-white">{parsedTest.totalMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Passing Marks:</span>
              <span className="font-bold text-slate-900 dark:text-white">{parsedTest.passingMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Duration:</span>
              <span className="font-bold text-slate-900 dark:text-white">{parsedTest.timeLimitMinutes} Mins</span>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {parsedTest.questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    Q{qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                  {q.options.map((optText, optIndex) => {
                    const isCorrect = q.correctOptionIndex === optIndex;
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center space-x-2 p-2 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600'
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
                        <span className="font-bold text-slate-500 text-xs w-4">
                          {String.fromCharCode(65 + optIndex)}:
                        </span>
                        <input
                          type="text"
                          value={optText}
                          onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Input */}
                <div className="pl-10">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    AI Solution Explanation:
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleUpdateExplanation(qIndex, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
