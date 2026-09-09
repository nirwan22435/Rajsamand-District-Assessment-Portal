import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Candidate, TypingTest, TypingAttempt } from '../../types';
import { evaluateTyping, formatSecondsToTime, getWordsArray, WordComparisonItem } from '../../utils/typingUtils';
import { auditAndRefinePassage } from '../../utils/passageSanitizer';
import { DEVLYS_KEYBOARD_LAYOUT } from '../../utils/devlysConverter';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  Keyboard,
  Info,
  Type,
  Send,
  AlertCircle,
  Plus,
  Minus,
  Link2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Target,
  Check,
  RotateCcw,
} from 'lucide-react';

const FONT_SIZES = [
  { id: 'text-xs', label: '12px', name: 'XS' },
  { id: 'text-sm', label: '14px', name: 'Small' },
  { id: 'text-base', label: '16px', name: 'Medium' },
  { id: 'text-lg', label: '18px', name: 'Large' },
  { id: 'text-xl', label: '20px', name: 'XL' },
  { id: 'text-2xl', label: '24px', name: '2XL' },
  { id: 'text-3xl', label: '30px', name: '3XL' },
  { id: 'text-4xl', label: '36px', name: '4XL' },
  { id: 'text-5xl', label: '48px', name: '5XL' },
] as const;

interface CandidateTypingRunnerProps {
  test: TypingTest;
  candidate: Candidate;
  onFinishTest: (attempt: TypingAttempt) => void;
  onCancel: () => void;
}

interface PassageWordItemProps {
  item: WordComparisonItem;
  isCurrent: boolean;
}

const PassageWordItem = React.memo<PassageWordItemProps>(
  ({ item, isCurrent }) => {
    let wordStyle = 'text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded transition-colors';

    if (item.status === 'CORRECT') {
      wordStyle =
        'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold border-b-2 border-emerald-500/80 px-1.5 py-0.5 rounded shadow-2xs';
    } else if (item.status === 'INCORRECT') {
      wordStyle =
        'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 font-bold border-b-2 border-rose-500 px-1.5 py-0.5 rounded shadow-2xs line-through decoration-rose-500/50';
    } else if (item.status === 'CURRENT') {
      wordStyle =
        'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-500/80 shadow-md px-2 py-0.5 rounded-lg transition-all scale-[1.03] inline-block';
    } else if (item.status === 'CURRENT_MISMATCH') {
      wordStyle =
        'bg-rose-500 text-white font-black ring-2 ring-rose-600 shadow-md px-2 py-0.5 rounded-lg transition-all scale-[1.03] inline-block';
    } else if (item.status === 'SKIPPED') {
      wordStyle =
        'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded opacity-70 line-through';
    }

    return (
      <span
        id={`passage-word-${item.index}`}
        className={`${wordStyle} ${isCurrent ? 'relative z-10' : ''}`}
      >
        {item.refWord}
      </span>
    );
  },
  (prev, next) => {
    return (
      prev.item.status === next.item.status &&
      prev.isCurrent === next.isCurrent &&
      prev.item.refWord === next.item.refWord
    );
  }
);
PassageWordItem.displayName = 'PassageWordItem';

export const CandidateTypingRunner: React.FC<CandidateTypingRunnerProps> = ({
  test,
  candidate,
  onFinishTest,
  onCancel,
}) => {
  // Test Duration in Seconds (Default 10 minutes = 600s)
  const durationSeconds = (test.durationMinutes || 10) * 60;

  // Time Remaining State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);

  // Typed Text State
  const [typedText, setTypedText] = useState<string>('');
  const isHindi = test.language === 'HINDI_DEVLYS_010';

  // Check if candidate is registered on typing module
  const isTypingModuleCandidate =
    candidate.registeredModule === 'TYPING' ||
    Boolean(candidate.typingMedium) ||
    candidate.id.startsWith('cand-typ-');

  // Default font index: 30px (3XL)
  const defaultFontIdx = Math.max(0, FONT_SIZES.findIndex((f) => f.label === '30px'));

  // Font Size States
  const [passageFontIndex, setPassageFontIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rdaa_typing_passage_font_v30px');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < FONT_SIZES.length) return parsed;
      }
    } catch {}
    return defaultFontIdx;
  });

  const [typingFontIndex, setTypingFontIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rdaa_typing_input_font_v30px');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < FONT_SIZES.length) return parsed;
      }
    } catch {}
    return defaultFontIdx;
  });

  const [syncFontSizes, setSyncFontSizes] = useState<boolean>(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  // Ergonomic UX Enhancements: Fullscreen, Audio Click, CapsLock, Word Guide Ribbon
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rdaa_typing_audio_feedback') === 'true';
    } catch {
      return false;
    }
  });
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>(false);
  const [showWordRibbon, setShowWordRibbon] = useState<boolean>(true);

  // Synchronous State Tracking Refs (Prevents React stale closures during timer auto-finish)
  const typedTextRef = useRef<string>('');
  const secondsRemainingRef = useRef<number>(durationSeconds);
  const isFinishedRef = useRef<boolean>(false);
  const startTimeRef = useRef<number | null>(null);
  const runnerRootRef = useRef<HTMLDivElement | null>(null);

  // Audio Context Ref for instant zero-latency synthesized tactile key sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTactileClick = useCallback(() => {
    if (!audioFeedback) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.025);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.028);
    } catch {}
  }, [audioFeedback]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const elem = runnerRootRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleAudioFeedback = () => {
    setAudioFeedback((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rdaa_typing_audio_feedback', String(next));
      } catch {}
      return next;
    });
  };

  // Font Size Handlers
  const handleIncreasePassageFont = () => {
    setPassageFontIndex((prev) => {
      const next = Math.min(FONT_SIZES.length - 1, prev + 1);
      try {
        localStorage.setItem('rdaa_typing_passage_font_v30px', String(next));
      } catch {}
      if (syncFontSizes) {
        setTypingFontIndex(next);
        try {
          localStorage.setItem('rdaa_typing_input_font_v30px', String(next));
        } catch {}
      }
      return next;
    });
  };

  const handleDecreasePassageFont = () => {
    setPassageFontIndex((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem('rdaa_typing_passage_font_v30px', String(next));
      } catch {}
      if (syncFontSizes) {
        setTypingFontIndex(next);
        try {
          localStorage.setItem('rdaa_typing_input_font_v30px', String(next));
        } catch {}
      }
      return next;
    });
  };

  const handleResetPassageFont = () => {
    setPassageFontIndex(defaultFontIdx);
    try {
      localStorage.setItem('rdaa_typing_passage_font_v30px', String(defaultFontIdx));
    } catch {}
    if (syncFontSizes) {
      setTypingFontIndex(defaultFontIdx);
      try {
        localStorage.setItem('rdaa_typing_input_font_v30px', String(defaultFontIdx));
      } catch {}
    }
  };

  const handleIncreaseTypingFont = () => {
    setTypingFontIndex((prev) => {
      const next = Math.min(FONT_SIZES.length - 1, prev + 1);
      try {
        localStorage.setItem('rdaa_typing_input_font_v30px', String(next));
      } catch {}
      return next;
    });
  };

  const handleDecreaseTypingFont = () => {
    setTypingFontIndex((prev) => {
      const next = Math.max(0, prev - 1);
      try {
        localStorage.setItem('rdaa_typing_input_font_v30px', String(next));
      } catch {}
      return next;
    });
  };

  const handleResetTypingFont = () => {
    setTypingFontIndex(defaultFontIdx);
    try {
      localStorage.setItem('rdaa_typing_input_font_v30px', String(defaultFontIdx));
    } catch {}
  };

  // References
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledRowTopRef = useRef<number>(-1);

  const sanitizedPassage = useMemo(() => {
    return auditAndRefinePassage(test.passageText, isHindi).refinedPassage || test.passageText;
  }, [test.passageText, isHindi]);
  const referenceWords = useMemo(() => getWordsArray(sanitizedPassage), [sanitizedPassage]);

  // Target qualifying words threshold
  const targetQualifyingWords =
    test.minCorrectWords || (test.minPassingWpm ? test.minPassingWpm * 10 : (isHindi ? 250 : 300));

  // Live word evaluation with sequence alignment
  const wordEvaluation = useMemo(() => {
    return evaluateTyping(
      sanitizedPassage,
      typedText,
      durationSeconds,
      test.minPassingWpm || (isHindi ? 25 : 30),
      isHindi,
      targetQualifyingWords
    );
  }, [sanitizedPassage, typedText, isHindi, targetQualifyingWords, test.minPassingWpm, durationSeconds]);

  // High-precision dynamic live metrics calculated on-demand from wall-clock elapsed time
  const timeElapsedSeconds = Math.max(1, durationSeconds - secondsRemaining);
  const timeInMinutes = timeElapsedSeconds / 60;
  const liveNetWpm = Math.max(0, Math.round((wordEvaluation.correctWordsCount / timeInMinutes) * 10) / 10);

  // Combined shallow view object for UI components
  const liveEvaluation = useMemo(() => ({
    ...wordEvaluation,
    netWpm: liveNetWpm,
  }), [wordEvaluation, liveNetWpm]);

  // Find index of currently active word directly from evaluation statuses
  const activeWordIndex = useMemo(() => {
    const currentIdx = wordEvaluation.wordStatuses.findIndex(
      (item) => item.status === 'CURRENT' || item.status === 'CURRENT_MISMATCH'
    );
    if (currentIdx !== -1) return currentIdx;
    const rawTokens = getWordsArray(typedText);
    const hasTrailingSpace = /\s$/.test(typedText);
    return hasTrailingSpace ? rawTokens.length : Math.max(0, rawTokens.length - 1);
  }, [wordEvaluation, typedText]);

  // Current active reference word
  const currentTargetWord = referenceWords[activeWordIndex] || '';

  // Extract current word typed so far (unspaced word token at cursor)
  const currentTypedWord = useMemo(() => {
    if (!typedText) return '';
    if (/\s$/.test(typedText)) return '';
    const tokens = typedText.split(/\s+/);
    return tokens[tokens.length - 1] || '';
  }, [typedText]);

  const currentWordMatches = useMemo(() => {
    const activeItem = wordEvaluation.wordStatuses[activeWordIndex];
    return activeItem?.status === 'CURRENT';
  }, [wordEvaluation.wordStatuses, activeWordIndex]);

  // Fast count of typed words for toolbar
  const typedWordsCount = useMemo(() => {
    const trimmed = typedText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [typedText]);

  // Progress percentage (0 - 100%)
  const passageProgressPct = useMemo(() => {
    if (referenceWords.length === 0) return 0;
    const completed = wordEvaluation.correctWordsCount + wordEvaluation.incorrectWordsCount;
    return Math.min(100, Math.round((completed / referenceWords.length) * 100));
  }, [wordEvaluation.correctWordsCount, wordEvaluation.incorrectWordsCount, referenceWords.length]);

  // Keep refs synchronized on every render
  useEffect(() => {
    typedTextRef.current = typedText;
  }, [typedText]);

  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // 10-Minute Timer Countdown Interval with High-Precision Wall-Clock Sync
  useEffect(() => {
    if (!isTestStarted || isTestFinished) return;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (isFinishedRef.current) {
        clearInterval(interval);
        return;
      }

      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);

      setSecondsRemaining(remaining);
      secondsRemainingRef.current = remaining;

      if (remaining <= 0) {
        clearInterval(interval);
        finalizeAttempt(durationSeconds);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isTestStarted, isTestFinished, durationSeconds]);

  // High-performance Jitter-Free Auto-Scroll:
  // Only scrolls when the active word moves to a new line or approaches viewport boundaries.
  useEffect(() => {
    if (!passageContainerRef.current) return;

    const frameId = requestAnimationFrame(() => {
      const container = passageContainerRef.current;
      if (!container) return;

      const activeEl = container.querySelector(`#passage-word-${activeWordIndex}`) as HTMLElement | null;
      if (!activeEl) return;

      const wordTop = activeEl.offsetTop;
      const containerScrollTop = container.scrollTop;
      const containerH = container.clientHeight;
      const relativeTop = wordTop - containerScrollTop;

      // Check if word row has changed or if it is outside the comfortable 20%-50% reading band
      const rowChanged = Math.abs(wordTop - lastScrolledRowTopRef.current) > 12;

      if (rowChanged && (relativeTop > containerH * 0.45 || relativeTop < 25)) {
        lastScrolledRowTopRef.current = wordTop;
        const targetScrollTop = Math.max(0, wordTop - containerH * 0.32);

        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [activeWordIndex]);

  // Handle typing input change with instant zero-lag response & double-space collapse protection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isTestFinished || isFinishedRef.current) return;

    if (!isTestStarted) {
      setIsTestStarted(true);
      startTimeRef.current = Date.now();
    }

    let value = e.target.value;

    // Collapse accidental double spaces so candidates don't get shifted a word ahead
    if (value.includes('  ')) {
      value = value.replace(/ {2,}/g, ' ');
    }

    typedTextRef.current = value;
    setTypedText(value);
  };

  // Handle key down mapping for DevLys 010 Hindi typing, CapsLock detection, and Tab prevention
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isTestFinished || isFinishedRef.current) return;

    // Detect CapsLock status to prevent silent layout corruption
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }

    // Play subtle auditory tactile click if enabled
    playTactileClick();

    // Prevent Tab key from dropping examination focus
    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }

    // DevLys 010 Remington special handling for physical key Z
    if (isHindi && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')) {
      if (e.shiftKey) {
        // Shift+Z MUST produce reph ('Z' / 'र्'), never rakar sign.
        if (e.key === 'z') {
          e.preventDefault();
          const target = e.currentTarget;
          const start = target.selectionStart ?? target.value.length;
          const end = target.selectionEnd ?? target.value.length;
          const currentVal = target.value;

          if (!isTestStarted) {
            setIsTestStarted(true);
            startTimeRef.current = Date.now();
          }

          const nextVal = currentVal.substring(0, start) + 'Z' + currentVal.substring(end);
          target.value = nextVal;
          target.selectionStart = target.selectionEnd = start + 1;
          typedTextRef.current = nextVal;
          setTypedText(nextVal);
        }
        return;
      } else {
        // Unshifted key Z maps strictly to rakar sign ('z' / '्र')
        if (e.key === 'Z') {
          e.preventDefault();
          const target = e.currentTarget;
          const start = target.selectionStart ?? target.value.length;
          const end = target.selectionEnd ?? target.value.length;
          const currentVal = target.value;

          if (!isTestStarted) {
            setIsTestStarted(true);
            startTimeRef.current = Date.now();
          }

          const nextVal = currentVal.substring(0, start) + 'z' + currentVal.substring(end);
          target.value = nextVal;
          target.selectionStart = target.selectionEnd = start + 1;
          typedTextRef.current = nextVal;
          setTypedText(nextVal);
        }
        return;
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Open confirmation modal or auto finish
  const handleRequestSubmit = () => {
    if (isTestFinished || isFinishedRef.current) return;
    setShowSubmitConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirmModal(false);
    finalizeAttempt();
  };

  const finalizeAttempt = (overrideFinalSeconds?: number) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsTestFinished(true);

    const currentTyped = typedTextRef.current;
    const finalSeconds = overrideFinalSeconds !== undefined
      ? overrideFinalSeconds
      : Math.min(durationSeconds, Math.max(1, durationSeconds - secondsRemainingRef.current));

    const result = evaluateTyping(
      sanitizedPassage,
      currentTyped,
      finalSeconds,
      test.minPassingWpm || (isHindi ? 25 : 30),
      isHindi,
      targetQualifyingWords,
      true // isFinalSubmission
    );

    const attempt: TypingAttempt = {
      id: `t-att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      typingTestId: test.id,
      testTitle: test.title,
      language: test.language,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      registrationId: candidate.registrationId,
      block: candidate.block,
      totalWordsInPara: result.totalWordsInPara,
      correctWordsCount: result.correctWordsCount,
      incorrectWordsCount: result.incorrectWordsCount,
      untypedWordsCount: result.untypedWordsCount,
      skippedWordsCount: result.skippedWordsCount,
      correctWords: result.correctWords,
      incorrectWords: result.incorrectWords,
      skippedWords: result.skippedWords,
      referencePassage: sanitizedPassage,
      netWpm: result.netWpm,
      grossWpm: result.grossWpm,
      accuracyPercentage: result.accuracyPercentage,
      timeTakenSeconds: finalSeconds,
      timeTakenMinutes: result.timeTakenMinutes,
      status: result.status,
      typedText: currentTyped,
      submittedAt: new Date().toISOString(),
    };

    onFinishTest(attempt);
  };

  const isLowTime = secondsRemaining <= 60;

  return (
    <div
      ref={runnerRootRef}
      className={`w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-5 space-y-3.5 animate-in fade-in duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-4 overflow-y-auto max-w-none' : ''
      }`}
    >
      {/* 1. Top Test Header Bar with Examination Overview & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
              {isHindi ? 'Hindi Typing (DevLys 010)' : 'English Typing Test'}
            </span>
            {test.examDate && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                • Exam Date: {test.examDate}
              </span>
            )}
            <span className="text-xs text-slate-500 font-semibold">• 10 Mins Duration</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              • Qualifying Criterion: {targetQualifyingWords} Correctly Typed Words
            </span>
            {!isHindi && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                Case errors ignored
              </span>
            )}
            {isCapsLockOn && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                <AlertCircle className="w-3 h-3" />
                <span>Caps Lock ON</span>
              </span>
            )}
          </div>
          {test.heading && (
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">
              {test.heading}
            </div>
          )}
          <h2 className={`text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight ${
            isHindi ? 'font-devlys text-xl' : ''
          }`}>
            {test.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Candidate: <strong className="text-slate-900 dark:text-slate-200">{candidate.name}</strong> ({candidate.registrationId} • {candidate.block})
          </p>
        </div>

        {/* 10-Minute Timer, Ergonomic Quick Toggles & Submit Action */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Quick Ergonomic Toggles */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Audio Feedback Toggle */}
            <button
              type="button"
              onClick={toggleAudioFeedback}
              title={audioFeedback ? 'Mute keyboard sound feedback' : 'Enable keyboard tactile sound feedback'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                audioFeedback
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Target Word Ribbon Toggle */}
            <button
              type="button"
              onClick={() => setShowWordRibbon(!showWordRibbon)}
              title={showWordRibbon ? 'Hide live target word banner' : 'Show live target word banner'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                showWordRibbon
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
            </button>

            {/* Fullscreen Focus Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen Focus' : 'Enter Fullscreen Focus (Zen Mode)'}
              className="p-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Countdown Clock Display */}
          <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all ${
            isLowTime
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
          }`}>
            <Clock className={`w-5 h-5 ${isLowTime ? 'text-rose-600' : 'text-amber-600'}`} />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                {isTestStarted ? 'Time Remaining' : 'Auto Finish (10:00)'}
              </div>
              <div className="text-xl font-black font-mono tracking-wider">
                {formatSecondsToTime(secondsRemaining)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestSubmit}
            disabled={isTestFinished}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Progress Bar (Overall Passage Completion & Pacing) */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${passageProgressPct}%` }}
        />
      </div>

      {/* 2. Live Performance Metric Highlights (Hidden for candidate registered on typing module) */}
      {!isTypingModuleCandidate && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <span className="block text-[10px] font-bold uppercase text-slate-500">Total Words</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{referenceWords.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="block text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Correct Words</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{liveEvaluation.correctWordsCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center">
            <span className="block text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Incorrect Words</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">{liveEvaluation.incorrectWordsCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
            <span className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Words Remaining</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{liveEvaluation.untypedWordsCount}</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-center">
            <span className="block text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400">Live Net Speed</span>
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">{liveEvaluation.netWpm} <span className="text-xs">WPM</span></span>
          </div>
        </div>
      )}

      {/* 3. SIDE-BY-SIDE EQUAL 2-SECTION SPLIT: Reference Passage & Typing Window */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* LEFT SECTION (50%): Reference Passage with Smooth Scrolling & Error Isolation */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col ${
          isFullscreen ? 'h-[75vh]' : isTypingModuleCandidate ? 'h-[580px] sm:h-[620px] lg:h-[660px]' : 'h-[460px]'
        } overflow-hidden relative`}>
          {/* Passage Toolbar */}
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Type className="w-4 h-4 text-amber-600" />
              <span>Reference Passage ({isHindi ? 'DevLys 010 Font' : 'English'})</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Font Size Increase/Decrease Controller for Reference Passage */}
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecreasePassageFont}
                  disabled={passageFontIndex <= 0}
                  title="Decrease passage font size"
                  aria-label="Decrease passage font size"
                  className="p-1 sm:px-2 py-1 rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">A-</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetPassageFont}
                  title={`Click to reset font size to default (${FONT_SIZES[defaultFontIdx].label})`}
                  className="px-2 py-0.5 font-mono text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                >
                  {FONT_SIZES[passageFontIndex].label}
                </button>

                <button
                  type="button"
                  onClick={handleIncreasePassageFont}
                  disabled={passageFontIndex >= FONT_SIZES.length - 1}
                  title="Increase passage font size"
                  aria-label="Increase passage font size"
                  className="p-1 sm:px-2 py-1 rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">A+</span>
                </button>
              </div>

              {/* Sync font sizes button */}
              <button
                type="button"
                onClick={() => setSyncFontSizes(!syncFontSizes)}
                title={syncFontSizes ? 'Passage & Typing Box font sizes are synced (click to unlink)' : 'Passage & Typing Box font sizes are independent (click to sync)'}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  syncFontSizes
                    ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[10px]">{syncFontSizes ? 'Sync Font' : 'Unlinked'}</span>
              </button>

              {/* DevLys Keyboard Helper Toggle */}
              {isHindi && (
                <button
                  type="button"
                  onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Key Map</span>
                </button>
              )}
            </div>
          </div>

          {/* Reference Paragraph Container with Precise Word Statuses & Smooth Auto-Scroll */}
          <div
            ref={passageContainerRef}
            className={`p-5 sm:p-6 overflow-y-auto flex-1 leading-relaxed select-none typing-passage-scroll relative ${
              isHindi ? 'font-devlys' : 'font-sans'
            } ${FONT_SIZES[passageFontIndex].id}`}
          >
            <div className="flex flex-wrap gap-x-2 gap-y-2.5">
              {wordEvaluation.wordStatuses.map((item, idx) => (
                <PassageWordItem
                  key={idx}
                  item={item}
                  isCurrent={idx === activeWordIndex}
                />
              ))}
            </div>
          </div>

          {/* Reference Footer Status */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between flex-shrink-0">
            <span>
              Passage Progress: <strong>{wordEvaluation.correctWordsCount + wordEvaluation.incorrectWordsCount}</strong> / {referenceWords.length} Words ({passageProgressPct}%)
            </span>
            {!isTypingModuleCandidate ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{liveEvaluation.accuracyPercentage}% Accuracy</span>
            ) : (
              <span className="text-slate-500 font-semibold">10-Minute Official Examination</span>
            )}
          </div>
        </div>

        {/* RIGHT SECTION (50%): Typing Input Box with Ergonomic Guidance */}
        <div
          onClick={() => textareaRef.current?.focus()}
          className={`bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500/80 dark:border-amber-500/60 shadow-lg flex flex-col ${
            isFullscreen ? 'h-[75vh]' : isTypingModuleCandidate ? 'h-[580px] sm:h-[620px] lg:h-[660px]' : 'h-[460px]'
          } overflow-hidden cursor-text`}
        >
          {/* Input Header Toolbar */}
          <div className="bg-amber-500/10 dark:bg-slate-800/80 px-4 py-2.5 border-b border-amber-500/30 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Typing Window ({isHindi ? 'DevLys 010' : 'English'})</span>
            </div>

            <div className="flex items-center space-x-2.5">
              {/* Font Size Increase/Decrease Controller for Typing Textarea */}
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecreaseTypingFont();
                  }}
                  disabled={typingFontIndex <= 0}
                  title="Decrease typing text area font size"
                  aria-label="Decrease typing text area font size"
                  className="p-1 sm:px-2 py-1 rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">A-</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTypingFont();
                  }}
                  title={`Click to reset font size to default (${FONT_SIZES[defaultFontIdx].label})`}
                  className="px-2 py-0.5 font-mono text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors cursor-pointer"
                >
                  {FONT_SIZES[typingFontIndex].label}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIncreaseTypingFont();
                  }}
                  disabled={typingFontIndex >= FONT_SIZES.length - 1}
                  title="Increase typing text area font size"
                  aria-label="Increase typing text area font size"
                  className="p-1 sm:px-2 py-1 rounded-lg font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">A+</span>
                </button>
              </div>

              <div className="text-[11px] font-mono font-bold text-slate-500 hidden sm:block">
                {typedText.length} Chars • {typedWordsCount} Words
              </div>
            </div>
          </div>

          {/* Optional Live Target Word Spotlight Ribbon: Reduces Head Movement & Eye Strain */}
          {showWordRibbon && currentTargetWord && (
            <div className="bg-amber-50/80 dark:bg-slate-800/90 px-4 py-2 border-b border-amber-200 dark:border-slate-700/80 flex items-center justify-between text-xs flex-shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                  Target Word:
                </span>
                <span className={`px-2 py-0.5 rounded-md font-black bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white shadow-2xs ${
                  isHindi ? 'font-devlys text-base' : 'font-mono'
                }`}>
                  {currentTargetWord}
                </span>

                {currentTypedWord && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                    currentWordMatches
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}>
                    {currentWordMatches ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Matching</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Typo (Backspace to fix)</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                Word {Math.min(referenceWords.length, activeWordIndex + 1)} of {referenceWords.length}
              </span>
            </div>
          )}

          {/* Large Focused Typing Textarea matching full height */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={typedText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              placeholder={
                !isTestStarted
                  ? isHindi
                    ? 'यहाँ टाइप करना शुरू करें...'
                    : 'Start typing here...'
                  : isHindi
                  ? 'टाइप जारी रखें...'
                  : 'Keep typing the reference passage...'
              }
              className={`w-full flex-1 p-4 sm:p-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed placeholder:font-sans ${
                isHindi ? 'font-devlys' : 'font-mono'
              } ${FONT_SIZES[typingFontIndex].id}`}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          {/* Input Bottom Action Toolbar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="hidden sm:inline">Press space after each word. Backspace allowed for corrections.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestSubmit}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DevLys 010 Remington Keyboard Layout Drawer */}
      {isHindi && showKeyboardHelp && (
        <div className="bg-amber-50 dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-slate-800 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" />
              <span>DevLys 010 / Remington Keyboard Quick Guide</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowKeyboardHelp(false)}
              className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5 text-center text-xs font-mono">
            {DEVLYS_KEYBOARD_LAYOUT.map((k) => (
              <div key={k.key} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 shadow-2xs">
                <span className="block font-black text-slate-900 dark:text-white">{k.key}</span>
                <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{k.normal}</span>
                <span className="block text-[9px] text-slate-500">{k.shift}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Finishing/Submitting Test */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Confirm Test Submission
                </h3>
                <p className="text-xs text-slate-500">
                  {formatSecondsToTime(secondsRemaining)} remaining on the 10-minute timer.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-semibold">
                Once submitted, your examination attempt will be finalized and securely recorded for official evaluation. You will not be able to make further edits.
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to finish and submit your typing test now?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitConfirmModal(false);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Continue Typing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Submit Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
