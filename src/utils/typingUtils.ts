import { TypingAttempt, TypingTest, Candidate } from '../types';
import { convertDevlysToUnicode } from './devlysConverter';

/**
 * Splits text into cleaned words array, merging dangling punctuation tokens into the preceding word
 */
export function getWordsArray(text: string): string[] {
  if (!text) return [];
  const rawTokens = text.trim().split(/\s+/).filter(Boolean);
  const words: string[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (isPurePunctuationToken(token)) {
      if (words.length > 0) {
        words[words.length - 1] += token;
      }
    } else {
      words.push(token);
    }
  }

  return words;
}

/**
 * Counts total words in text
 */
export function countWords(text: string): number {
  return getWordsArray(text).length;
}

export type WordStatusType = 'CORRECT' | 'INCORRECT' | 'CURRENT' | 'CURRENT_MISMATCH' | 'UNTYPED';

export interface WordComparisonItem {
  refWord: string;
  typedWord?: string;
  status: WordStatusType;
  index: number;
}

export interface TypingEvaluationResult {
  totalWordsInPara: number;
  correctWordsCount: number;
  incorrectWordsCount: number;
  untypedWordsCount: number;
  netWpm: number;
  grossWpm: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  timeTakenMinutes: number;
  targetMinCorrectWords: number;
  status: 'QUALIFIED' | 'DISQUALIFIED';
  wordStatuses: WordComparisonItem[];
}

/**
 * Checks if a token consists strictly of punctuation/symbols/danda without core alphanumeric characters.
 */
export function isPurePunctuationToken(token: string): boolean {
  if (!token) return true;
  // If token is solely punctuation, brackets, danda, full stops, dashes, or quotes
  return /^[\s«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+$/u.test(token.trim());
}

/**
 * Checks if two normalized words match, handling Hindi orthographic variations.
 */
export function areWordsEquivalent(refNorm: string, typedNorm: string, isHindi: boolean): boolean {
  if (!refNorm || !typedNorm) return false;
  if (refNorm === typedNorm) return true;

  if (isHindi) {
    // 1. Direct match
    if (refNorm === typedNorm) return true;

    // 2. Handle 'नए' / 'नये' / 'ने' variation in Remington keyboard typing
    if ((refNorm === 'नए' || refNorm === 'नये') && (typedNorm === 'नए' || typedNorm === 'नये' || typedNorm === 'ने')) {
      return true;
    }
    if ((refNorm === 'गए' || refNorm === 'गये') && (typedNorm === 'गए' || typedNorm === 'गये' || typedNorm === 'गे')) {
      return true;
    }
    if ((refNorm === 'हुए' || refNorm === 'हुये') && (typedNorm === 'हुए' || typedNorm === 'हुये')) {
      return true;
    }
    if ((refNorm === 'लिए' || refNorm === 'लिये') && (typedNorm === 'लिए' || typedNorm === 'लिये')) {
      return true;
    }
    if ((refNorm === 'दिए' || refNorm === 'दिये') && (typedNorm === 'दिए' || typedNorm === 'दिये')) {
      return true;
    }
    if ((refNorm === 'किए' || refNorm === 'किये') && (typedNorm === 'किए' || typedNorm === 'किये')) {
      return true;
    }

    // 3. Handle 'रू' / 'रु' matra nuances in DevLys
    const refClean = refNorm.replace(/[\u0941\u0942]/g, '');
    const typedClean = typedNorm.replace(/[\u0941\u0942]/g, '');
    if (refNorm.startsWith('र') && typedNorm.startsWith('र') && refClean === typedClean) {
      return true;
    }
  }

  return false;
}

/**
 * Normalizes words for reliable, fair evaluation across Hindi (DevLys 010 & Unicode) and English.
 * - Converts DevLys ASCII to canonical Unicode Devanagari first so Remington ASCII keys (;, {, [, ', ", ?, <) aren't mistaken for punctuation.
 * - Strips outer punctuation (quotes, brackets, danda, commas, full stops).
 * - Normalizes Unicode NFC & nukta variations (e.g. पेड़ / पेड, ड + ़).
 * - In English tests, case differences and attached punctuation are normalized.
 */
export function normalizeWordForEvaluation(word: string, isHindi: boolean): string {
  if (!word) return '';

  let clean = word.normalize('NFC').trim();

  if (isHindi) {
    // If the token is written in DevLys 010 ASCII (e.g. ';qx', '{ks=', 'f\'k{kk', 'gekjs', 'thou'),
    // convert it to canonical Unicode Devanagari FIRST before any punctuation stripping
    if (/^[A-Za-z0-9~`!@#$%^&*()_+\-=\[\]{}':;"\\|,.<>\/?]+$/.test(clean) && !/[\u0900-\u097F]/.test(clean)) {
      clean = convertDevlysToUnicode(clean);
    }

    // Strip outer punctuation and symbols without affecting Devanagari letters
    clean = clean.replace(/^[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+|[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+$/gu, '');

    // Canonical Devanagari normalization
    clean = clean
      .normalize('NFD')
      .replace(/\u093C/g, '') // Normalize both precomposed and combining nuktas (e.g. ड़/ड, ढ़/ढ, ह़/ह, ज़/ज)
      .normalize('NFC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip invisible zero-width chars
      .replace(/[।|.]/g, '') // Strip remaining danda/period
      .trim();
  } else {
    // For English: strip outer punctuation, lowercase, and trim
    clean = clean.replace(/^[«»“”"‘’'()\[\]{}<>\/\\|.,;:!?\-+=_*~^%#@`]+|[«»“”"‘’'()\[\]{}<>\/\\|.,;:!?\-+=_*~^%#@`]+$/gu, '');
    clean = clean.toLowerCase().trim();
  }

  return clean;
}

/**
 * Align typed tokens with reference words using Banded Dynamic Programming Sequence Alignment.
 * Constrains alignment within a local prefix window (BAND_RADIUS = 10) to prevent false matching
 * to duplicate common words that appear further down in the passage.
 * Resolves cascading misalignment and false incorrect word detections.
 */
function alignWordsSequence(
  refWords: string[],
  completedTokens: string[],
  isHindiDevLys: boolean
): {
  refToTypedMap: Map<number, number>; // refIdx -> tokenIdx in completedTokens
  unmatchedTokens: Set<number>;
  lastAlignedRefIdx: number;
} {
  // Filter out pure punctuation tokens (like standalone '।', '|', '.', ',') for alignment
  // so typists aren't penalized for inserting a space before a danda / full stop
  const meaningfulTokens: { token: string; originalIndex: number }[] = [];
  const punctuationTokenIndices = new Set<number>();

  completedTokens.forEach((tok, idx) => {
    if (isPurePunctuationToken(tok)) {
      punctuationTokenIndices.add(idx);
    } else {
      meaningfulTokens.push({ token: tok, originalIndex: idx });
    }
  });

  const n = refWords.length;
  const m = meaningfulTokens.length;

  if (n === 0 || m === 0) {
    return {
      refToTypedMap: new Map(),
      unmatchedTokens: new Set(meaningfulTokens.map((t) => t.originalIndex)),
      lastAlignedRefIdx: -1,
    };
  }

  const BAND_RADIUS = Math.max(30, Math.abs(n - m) + 15);
  const MATCH_SCORE = 5;
  const MISMATCH_SCORE = -1;
  const GAP_REF_PENALTY = -3; // Penalty for skipping a reference word
  const GAP_TYPED_PENALTY = -3; // Penalty for typing an extra inserted word

  // dp[i][j] holds score for refWords[0..i-1] and meaningfulTokens[0..j-1]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(-Infinity));
  dp[0][0] = 0;

  // Base cases within band
  for (let i = 1; i <= Math.min(n, BAND_RADIUS); i++) {
    dp[i][0] = i * GAP_REF_PENALTY;
  }
  for (let j = 1; j <= Math.min(m, BAND_RADIUS); j++) {
    dp[0][j] = j * GAP_TYPED_PENALTY;
  }

  for (let j = 1; j <= m; j++) {
    const minI = Math.max(1, j - BAND_RADIUS);
    const maxI = Math.min(n, j + BAND_RADIUS);

    for (let i = minI; i <= maxI; i++) {
      let maxScore = -Infinity;

      // 1. Diagonal transition: match or substitution
      if (dp[i - 1][j - 1] !== -Infinity) {
        const refNorm = normalizeWordForEvaluation(refWords[i - 1], isHindiDevLys);
        const typedNorm = normalizeWordForEvaluation(meaningfulTokens[j - 1].token, isHindiDevLys);
        const isMatch = areWordsEquivalent(refNorm, typedNorm, isHindiDevLys);
        const score = dp[i - 1][j - 1] + (isMatch ? MATCH_SCORE : MISMATCH_SCORE);
        if (score > maxScore) maxScore = score;
      }

      // 2. Up transition: candidate skipped a word in the reference passage
      if (dp[i - 1][j] !== -Infinity) {
        const score = dp[i - 1][j] + GAP_REF_PENALTY;
        if (score > maxScore) maxScore = score;
      }

      // 3. Left transition: candidate typed an extra inserted word
      if (dp[i][j - 1] !== -Infinity) {
        const score = dp[i][j - 1] + GAP_TYPED_PENALTY;
        if (score > maxScore) maxScore = score;
      }

      dp[i][j] = maxScore;
    }
  }

  // Find optimal ending reference index i* within local band around m
  const searchMinI = Math.max(0, m - BAND_RADIUS);
  const searchMaxI = Math.min(n, m + BAND_RADIUS);

  let bestI = Math.min(n, m);
  let bestScore = -Infinity;

  for (let i = searchMinI; i <= searchMaxI; i++) {
    if (dp[i][m] > bestScore) {
      bestScore = dp[i][m];
      bestI = i;
    } else if (dp[i][m] === bestScore && Math.abs(i - m) < Math.abs(bestI - m)) {
      bestI = i;
    }
  }

  // Backtrack from (bestI, m)
  let i = bestI;
  let j = m;
  const refToTypedMap = new Map<number, number>(); // refIdx -> originalTokenIndex
  const matchedOriginalTokenIndices = new Set<number>();
  let lastAlignedRefIdx = -1;

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
      continue;
    }
    if (j === 0) {
      i--;
      continue;
    }

    const refNorm = normalizeWordForEvaluation(refWords[i - 1], isHindiDevLys);
    const typedNorm = normalizeWordForEvaluation(meaningfulTokens[j - 1].token, isHindiDevLys);
    const isMatch = areWordsEquivalent(refNorm, typedNorm, isHindiDevLys);
    const matchScore = isMatch ? MATCH_SCORE : MISMATCH_SCORE;

    if (
      dp[i - 1][j - 1] !== -Infinity &&
      Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchScore)) < 1e-5
    ) {
      const originalIdx = meaningfulTokens[j - 1].originalIndex;
      refToTypedMap.set(i - 1, originalIdx);
      matchedOriginalTokenIndices.add(originalIdx);
      if (lastAlignedRefIdx === -1) {
        lastAlignedRefIdx = i - 1;
      }
      i--;
      j--;
    } else if (
      dp[i - 1][j] !== -Infinity &&
      Math.abs(dp[i][j] - (dp[i - 1][j] + GAP_REF_PENALTY)) < 1e-5
    ) {
      i--;
    } else {
      j--;
    }
  }

  const unmatchedTokens = new Set<number>();
  for (let t = 0; t < meaningfulTokens.length; t++) {
    const origIdx = meaningfulTokens[t].originalIndex;
    if (!matchedOriginalTokenIndices.has(origIdx)) {
      unmatchedTokens.add(origIdx);
    }
  }

  return { refToTypedMap, unmatchedTokens, lastAlignedRefIdx };
}

/**
 * Evaluates typing performance against reference passage with sequence alignment precision.
 * Accurately handles Hindi DevLys 010 / Unicode Devanagari and English.
 */
export function evaluateTyping(
  referencePassage: string,
  typedText: string,
  timeTakenSeconds: number,
  minPassingWpm: number = 30,
  isHindiDevLys: boolean = false,
  minCorrectWords?: number
): TypingEvaluationResult {
  const refWords = getWordsArray(referencePassage);
  const totalWordsInPara = refWords.length;

  // Analyze typed tokens
  const hasTrailingSpace = /\s$/.test(typedText);
  const rawWords = getWordsArray(typedText);

  const completedTokens = hasTrailingSpace
    ? rawWords
    : rawWords.length > 0
    ? rawWords.slice(0, -1)
    : [];

  const currentToken = !hasTrailingSpace && rawWords.length > 0 ? rawWords[rawWords.length - 1] : '';

  // Align completed words with reference passage
  const { refToTypedMap, unmatchedTokens } = alignWordsSequence(
    refWords,
    completedTokens,
    isHindiDevLys
  );

  let correctCount = 0;
  let incorrectCount = unmatchedTokens.size; // Extra inserted words count as errors

  const wordStatuses: WordComparisonItem[] = [];

  // Determine the highest reference index reached so far
  let maxCoveredRefIdx = -1;
  refToTypedMap.forEach((_, refIdx) => {
    if (refIdx > maxCoveredRefIdx) maxCoveredRefIdx = refIdx;
  });

  const nextActiveRefIdx = maxCoveredRefIdx + 1;

  for (let i = 0; i < totalWordsInPara; i++) {
    const ref = refWords[i];
    const refNorm = normalizeWordForEvaluation(ref, isHindiDevLys);

    if (refToTypedMap.has(i)) {
      // Reference word was aligned to a typed token
      const tokenIdx = refToTypedMap.get(i)!;
      const typed = completedTokens[tokenIdx];
      const typedNorm = normalizeWordForEvaluation(typed, isHindiDevLys);

      if (areWordsEquivalent(refNorm, typedNorm, isHindiDevLys)) {
        correctCount++;
        wordStatuses.push({
          refWord: ref,
          typedWord: typed,
          status: 'CORRECT',
          index: i,
        });
      } else {
        incorrectCount++;
        wordStatuses.push({
          refWord: ref,
          typedWord: typed,
          status: 'INCORRECT',
          index: i,
        });
      }
    } else if (i < nextActiveRefIdx) {
      // Skipped word in between completed words -> mark as INCORRECT (skipped)
      incorrectCount++;
      wordStatuses.push({
        refWord: ref,
        status: 'INCORRECT',
        index: i,
      });
    } else if (i === nextActiveRefIdx) {
      // Current active word
      if (currentToken && !isPurePunctuationToken(currentToken)) {
        const tokenNorm = normalizeWordForEvaluation(currentToken, isHindiDevLys);
        const isPrefix = tokenNorm.length > 0 && (refNorm.startsWith(tokenNorm) || areWordsEquivalent(refNorm, tokenNorm, isHindiDevLys));
        wordStatuses.push({
          refWord: ref,
          typedWord: currentToken,
          status: isPrefix ? 'CURRENT' : 'CURRENT_MISMATCH',
          index: i,
        });
      } else {
        wordStatuses.push({
          refWord: ref,
          status: 'CURRENT',
          index: i,
        });
      }
    } else {
      // Future untyped words (always UNTYPED, never incorrectly marked)
      wordStatuses.push({
        refWord: ref,
        status: 'UNTYPED',
        index: i,
      });
    }
  }

  const totalAttempted = correctCount + incorrectCount;
  const untypedCount = Math.max(0, totalWordsInPara - totalAttempted);

  // Safe time calculation in minutes
  const effectiveSeconds = Math.max(1, timeTakenSeconds);
  const timeTakenMinutes = Math.round((effectiveSeconds / 60) * 100) / 100;
  const timeInMinutes = effectiveSeconds / 60;

  // Gross WPM = (Total words typed) / Minutes
  const totalTypedWords = rawWords.filter((t) => !isPurePunctuationToken(t)).length;
  const grossWpm = Math.round((totalTypedWords / timeInMinutes) * 10) / 10;

  // Net WPM = (Correct words typed) / Minutes (Official Standard)
  const netWpm = Math.max(0, Math.round((correctCount / timeInMinutes) * 10) / 10);

  // Accuracy % = (Correct words / Total words attempted) * 100
  const accuracyPercentage =
    totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 1000) / 10 : 0;

  // Qualification criteria is strictly based on Number of correctly typed words in 10 minutes only.
  const targetMinCorrectWords =
    minCorrectWords !== undefined && minCorrectWords > 0
      ? minCorrectWords
      : minPassingWpm > 0
      ? minPassingWpm * 10
      : isHindiDevLys
      ? 250
      : 300;

  const status: 'QUALIFIED' | 'DISQUALIFIED' =
    correctCount >= targetMinCorrectWords ? 'QUALIFIED' : 'DISQUALIFIED';

  return {
    totalWordsInPara,
    correctWordsCount: correctCount,
    incorrectWordsCount: incorrectCount,
    untypedWordsCount: untypedCount,
    netWpm,
    grossWpm,
    accuracyPercentage,
    timeTakenSeconds,
    timeTakenMinutes,
    targetMinCorrectWords,
    status,
    wordStatuses,
  };
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatSecondsToTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Export typing attempts report as CSV
 */
export function exportTypingReportToCSV(attempts: TypingAttempt[], testTitle?: string) {
  if (!attempts || attempts.length === 0) {
    return;
  }

  const headers = [
    'S.No.',
    'Candidate Name',
    'Registration / Roll No',
    'Email Address',
    'Test Title',
    'Language',
    'Total Words in Para',
    'Correct Words',
    'Incorrect Words',
    'Untyped Words',
    'Net Speed (WPM)',
    'Gross Speed (WPM)',
    'Accuracy (%)',
    'Time Taken (mm:ss)',
    'Result Status',
    'Submission Date & Time',
  ];

  const rows = attempts.map((att, idx) => [
    idx + 1,
    `"${(att.candidateName || '').replace(/"/g, '""')}"`,
    `"${att.registrationId || att.candidateId || ''}"`,
    `"${att.candidateEmail || ''}"`,
    `"${(att.testTitle || '').replace(/"/g, '""')}"`,
    att.language === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English',
    att.totalWordsInPara || 0,
    att.correctWordsCount || 0,
    att.incorrectWordsCount || 0,
    att.untypedWordsCount || 0,
    att.netWpm || 0,
    att.grossWpm || 0,
    `${att.accuracyPercentage || 0}%`,
    formatSecondsToTime(att.timeTakenSeconds || 0),
    att.status || 'EVALUATED',
    `"${new Date(att.submittedAt).toLocaleString('en-IN')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Rajsamand_Typing_Evaluation_Report_${testTitle ? testTitle.replace(/\s+/g, '_') : 'All'}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
