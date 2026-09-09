import { TypingAttempt, TypingTest, Candidate } from '../types';
import { convertDevlysToUnicode } from './devlysConverter';
import { INITIAL_TYPING_TESTS } from '../data/defaultTypingData';

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

export type WordStatusType = 'CORRECT' | 'INCORRECT' | 'CURRENT' | 'CURRENT_MISMATCH' | 'UNTYPED' | 'SKIPPED';

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
  skippedWordsCount: number;
  correctWords: string[];
  incorrectWords: { refWord: string; typedWord?: string }[];
  skippedWords: string[];
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

    // 4. Handle 'प्र' vs 'र्प' keyboard nuances (e.g. key Z vs Shift+Z with 'प' in Remington)
    if (refNorm.includes('प्र') || typedNorm.includes('प्र')) {
      const refAlt = refNorm.replace(/प्र/g, 'र्प');
      const typedAlt = typedNorm.replace(/प्र/g, 'र्प');
      if (refNorm === typedAlt || refAlt === typedNorm) {
        return true;
      }
    }
  }

  return false;
}

// Cache for word normalization to avoid expensive repeated DevLys & Unicode conversions
const normalizeCacheHindi = new Map<string, string>();
const normalizeCacheEnglish = new Map<string, string>();
const passageRefNormsCache = new Map<string, string[]>();

let reusableDpBuffer = new Float32Array(131072); // 128K floats reusable buffer (zero GC pressure)
function getDpBuffer(size: number): Float32Array {
  if (reusableDpBuffer.length < size) {
    reusableDpBuffer = new Float32Array(Math.max(size, reusableDpBuffer.length * 2));
  }
  return reusableDpBuffer;
}

/**
 * Clears normalization and alignment caches
 */
export function clearTypingCaches(): void {
  normalizeCacheHindi.clear();
  normalizeCacheEnglish.clear();
  passageRefNormsCache.clear();
  lastAlignmentCache = null;
}

/**
 * Normalizes words for reliable, fair evaluation across Hindi (DevLys 010 & Unicode) and English.
 * - Converts DevLys ASCII to canonical Unicode Devanagari first so Remington ASCII keys (;, {, [, ', ", ?, <) aren't mistaken for punctuation.
 * - Strips outer punctuation (quotes, brackets, danda, commas, full stops).
 * - Normalizes Unicode NFC & nukta variations (e.g. पेड़ / पेड, ड + ़).
 * - In English tests, case differences and attached punctuation are normalized.
 * - Uses high-performance memoization cache so identical words take 0ms.
 */
export function normalizeWordForEvaluation(word: string, isHindi: boolean): string {
  if (!word) return '';

  const cache = isHindi ? normalizeCacheHindi : normalizeCacheEnglish;
  const cached = cache.get(word);
  if (cached !== undefined) return cached;

  let clean = word.normalize('NFC').trim();

  if (isHindi) {
    // If the token is written in DevLys 010 ASCII or contains Remington Alt codes (e.g. ';qx', '{ks=', 'çfrfnu', 'fo|ky;', 'izfrfnu'),
    // convert it to canonical Unicode Devanagari FIRST before any punctuation stripping
    if (!/[\u0900-\u097F]/.test(clean) || /[A-Za-zçÁØÝæäéàáâãíìïêëô÷ÌÍÎÏÑÔÖÜËè¶¸|}]/.test(clean)) {
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

  if (cache.size > 8000) {
    cache.clear();
  }
  cache.set(word, clean);
  return clean;
}

// Single-slot cache for the alignment result of completedTokens
let lastAlignmentCache: {
  passageHash: string;
  tokensKey: string;
  isHindi: boolean;
  result: {
    refToTypedMap: Map<number, number>;
    unmatchedTokens: Set<number>;
    lastAlignedRefIdx: number;
  };
} | null = null;

/**
 * Align typed tokens with reference words using Banded Dynamic Programming Sequence Alignment.
 * - Pre-normalizes all reference and typed words once before DP loops, reducing string/regex ops by 99%.
 * - Uses a flat contiguous Float32Array for the DP table, avoiding memory allocation overhead.
 * - Constrains alignment within a realistic typing drift band (BAND_RADIUS = 16) for sub-millisecond execution.
 * - Caches identical completed token sets so character typing within a word executes in 0ms.
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

  // Pre-normalize all reference words (cached per passage) and typed tokens
  const passageKey = `${n}_${isHindiDevLys}_${refWords[0] || ''}_${refWords[n - 1] || ''}`;
  let refNorms = passageRefNormsCache.get(passageKey);
  if (!refNorms || refNorms.length !== n) {
    refNorms = new Array(n);
    for (let i = 0; i < n; i++) {
      refNorms[i] = normalizeWordForEvaluation(refWords[i], isHindiDevLys);
    }
    if (passageRefNormsCache.size > 20) {
      passageRefNormsCache.clear();
    }
    passageRefNormsCache.set(passageKey, refNorms);
  }

  const tokenNorms: string[] = new Array(m);
  for (let j = 0; j < m; j++) {
    tokenNorms[j] = normalizeWordForEvaluation(meaningfulTokens[j].token, isHindiDevLys);
  }

  // Band radius: typists type sequentially with local drift (skips/insertions) of at most 16 words.
  const BAND_RADIUS = 16;
  const MATCH_SCORE = 5;
  const MISMATCH_SCORE = -1;
  const GAP_REF_PENALTY = -3;
  const GAP_TYPED_PENALTY = -3;

  // Contiguous 1D flat Float32Array from reusable pool (O(1) memory, 0 heap allocations)
  const stride = m + 1;
  const totalCells = (n + 1) * stride;
  const dp = getDpBuffer(totalCells);
  dp.fill(-1e9, 0, totalCells);
  dp[0] = 0;

  // Base cases within band
  for (let i = 1; i <= Math.min(n, BAND_RADIUS); i++) {
    dp[i * stride] = i * GAP_REF_PENALTY;
  }
  for (let j = 1; j <= Math.min(m, BAND_RADIUS); j++) {
    dp[j] = j * GAP_TYPED_PENALTY;
  }

  for (let j = 1; j <= m; j++) {
    const minI = Math.max(1, j - BAND_RADIUS);
    const maxI = Math.min(n, j + BAND_RADIUS);
    const typedNorm = tokenNorms[j - 1];

    for (let i = minI; i <= maxI; i++) {
      let maxScore = -1e9;
      const prevDiag = dp[(i - 1) * stride + (j - 1)];

      // 1. Diagonal transition: match or substitution
      if (prevDiag > -1e8) {
        const refNorm = refNorms[i - 1];
        const isMatch = areWordsEquivalent(refNorm, typedNorm, isHindiDevLys);
        const score = prevDiag + (isMatch ? MATCH_SCORE : MISMATCH_SCORE);
        if (score > maxScore) maxScore = score;
      }

      // 2. Up transition: candidate skipped a word in the reference passage
      const prevUp = dp[(i - 1) * stride + j];
      if (prevUp > -1e8) {
        const score = prevUp + GAP_REF_PENALTY;
        if (score > maxScore) maxScore = score;
      }

      // 3. Left transition: candidate typed an extra inserted word
      const prevLeft = dp[i * stride + (j - 1)];
      if (prevLeft > -1e8) {
        const score = prevLeft + GAP_TYPED_PENALTY;
        if (score > maxScore) maxScore = score;
      }

      dp[i * stride + j] = maxScore;
    }
  }

  // Find optimal ending reference index i* within local band around m
  const searchMinI = Math.max(0, m - BAND_RADIUS);
  const searchMaxI = Math.min(n, m + BAND_RADIUS);

  let bestI = Math.min(n, m);
  let bestScore = -1e9;

  for (let i = searchMinI; i <= searchMaxI; i++) {
    const score = dp[i * stride + m];
    if (score > bestScore) {
      bestScore = score;
      bestI = i;
    } else if (score === bestScore && Math.abs(i - m) < Math.abs(bestI - m)) {
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

    const refNorm = refNorms[i - 1];
    const typedNorm = tokenNorms[j - 1];
    const isMatch = areWordsEquivalent(refNorm, typedNorm, isHindiDevLys);
    const matchScore = isMatch ? MATCH_SCORE : MISMATCH_SCORE;
    const currentScore = dp[i * stride + j];
    const prevDiag = dp[(i - 1) * stride + (j - 1)];
    const prevUp = dp[(i - 1) * stride + j];

    if (prevDiag > -1e8 && Math.abs(currentScore - (prevDiag + matchScore)) < 1e-4) {
      const originalIdx = meaningfulTokens[j - 1].originalIndex;
      refToTypedMap.set(i - 1, originalIdx);
      matchedOriginalTokenIndices.add(originalIdx);
      if (lastAlignedRefIdx === -1) {
        lastAlignedRefIdx = i - 1;
      }
      i--;
      j--;
    } else if (prevUp > -1e8 && Math.abs(currentScore - (prevUp + GAP_REF_PENALTY)) < 1e-4) {
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
  minCorrectWords?: number,
  isFinalSubmission: boolean = false
): TypingEvaluationResult {
  const refWords = getWordsArray(referencePassage);
  const totalWordsInPara = refWords.length;

  // Analyze typed tokens
  const hasTrailingSpace = /\s$/.test(typedText);
  const rawWords = getWordsArray(typedText);

  // When test is submitted, even the final word without a trailing space is evaluated
  const completedTokens = (isFinalSubmission || hasTrailingSpace)
    ? rawWords
    : rawWords.length > 0
    ? rawWords.slice(0, -1)
    : [];

  const currentToken = (!isFinalSubmission && !hasTrailingSpace && rawWords.length > 0)
    ? rawWords[rawWords.length - 1]
    : '';

  // Check if we can reuse previous alignment result for identical completedTokens
  const passageHash = `${referencePassage.length}_${refWords.length}`;
  const tokensKey = `${completedTokens.length}_${completedTokens.join(' ')}`;

  let alignmentResult: {
    refToTypedMap: Map<number, number>;
    unmatchedTokens: Set<number>;
    lastAlignedRefIdx: number;
  };

  if (
    lastAlignmentCache &&
    lastAlignmentCache.isHindi === isHindiDevLys &&
    lastAlignmentCache.passageHash === passageHash &&
    lastAlignmentCache.tokensKey === tokensKey &&
    !isFinalSubmission
  ) {
    alignmentResult = lastAlignmentCache.result;
  } else {
    alignmentResult = alignWordsSequence(
      refWords,
      completedTokens,
      isHindiDevLys
    );
    lastAlignmentCache = {
      passageHash,
      tokensKey,
      isHindi: isHindiDevLys,
      result: alignmentResult,
    };
  }

  const { refToTypedMap, unmatchedTokens } = alignmentResult;

  let correctCount = 0;
  let incorrectCount = 0;
  const correctWords: string[] = [];
  const incorrectWords: { refWord: string; typedWord?: string }[] = [];
  const skippedWords: string[] = [];

  // Extra inserted typed words count as errors
  unmatchedTokens.forEach((tokenIdx) => {
    incorrectCount++;
    incorrectWords.push({
      refWord: '(Extra Word)',
      typedWord: completedTokens[tokenIdx],
    });
  });

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
        correctWords.push(ref);
        wordStatuses.push({
          refWord: ref,
          typedWord: typed,
          status: 'CORRECT',
          index: i,
        });
      } else {
        incorrectCount++;
        incorrectWords.push({
          refWord: ref,
          typedWord: typed,
        });
        wordStatuses.push({
          refWord: ref,
          typedWord: typed,
          status: 'INCORRECT',
          index: i,
        });
      }
    } else if (i < nextActiveRefIdx) {
      // Skipped word in between completed words
      skippedWords.push(ref);
      wordStatuses.push({
        refWord: ref,
        status: 'SKIPPED',
        index: i,
      });
    } else if (!isFinalSubmission && i === nextActiveRefIdx) {
      // Current active word being typed
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
      // Future untyped / omitted words from reference paragraph
      skippedWords.push(ref);
      wordStatuses.push({
        refWord: ref,
        status: isFinalSubmission ? 'SKIPPED' : 'UNTYPED',
        index: i,
      });
    }
  }

  const skippedWordsCount = skippedWords.length;
  const untypedCount = Math.max(0, totalWordsInPara - (correctCount + incorrectCount));

  // Safe time calculation in minutes
  const effectiveSeconds = Math.max(1, timeTakenSeconds);
  const timeTakenMinutes = Math.round((effectiveSeconds / 60) * 100) / 100;
  const timeInMinutes = effectiveSeconds / 60;

  // Gross WPM = (Total words typed) / Minutes
  const totalTypedWords = rawWords.filter((t) => !isPurePunctuationToken(t)).length;
  const grossWpm = Math.round((totalTypedWords / timeInMinutes) * 10) / 10;

  // Net WPM = (Correct words typed) / Minutes (Official Standard)
  const netWpm = Math.max(0, Math.round((correctCount / timeInMinutes) * 10) / 10);

  // ACCURACY PERCENTAGE:
  // Accuracy = (correct words typed / total words typed by the candidate) * 100
  const totalTypedWordsByCandidate = correctCount + incorrectCount;
  const accuracyPercentage =
    totalTypedWordsByCandidate > 0
      ? Math.min(100, Math.max(0, Math.round((correctCount / totalTypedWordsByCandidate) * 1000) / 10))
      : 0;

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
    skippedWordsCount,
    correctWords,
    incorrectWords,
    skippedWords,
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

export interface DetailedWordAnalysis {
  referencePassage: string;
  refWords: string[];
  totalWordsInPara: number;
  correctWords: string[];
  incorrectWords: { refWord: string; typedWord?: string }[];
  skippedWords: string[];
  correctWordsCount: number;
  incorrectWordsCount: number;
  skippedWordsCount: number;
  accuracyPercentage: number;
  wordStatuses: WordComparisonItem[];
}

/**
 * Extracts or computes the reference paragraph and complete word breakdown (correct, incorrect, skipped)
 * for a typing assessment attempt.
 */
export function getDetailedWordAnalysis(
  attempt: TypingAttempt,
  referencePassage?: string
): DetailedWordAnalysis {
  const passage =
    referencePassage ||
    attempt.referencePassage ||
    (INITIAL_TYPING_TESTS.find((t) => t.id === attempt.typingTestId)?.passageText) ||
    '';

  const isHindi = attempt.language === 'HINDI_DEVLYS_010';

  if (passage) {
    const evalRes = evaluateTyping(
      passage,
      attempt.typedText || '',
      attempt.timeTakenSeconds || 600,
      30,
      isHindi,
      undefined,
      true // isFinalSubmission
    );

    return {
      referencePassage: passage,
      refWords: getWordsArray(passage),
      totalWordsInPara: evalRes.totalWordsInPara,
      correctWords: evalRes.correctWords,
      incorrectWords: evalRes.incorrectWords,
      skippedWords: evalRes.skippedWords,
      correctWordsCount: evalRes.correctWordsCount,
      incorrectWordsCount: evalRes.incorrectWordsCount,
      skippedWordsCount: evalRes.skippedWordsCount,
      accuracyPercentage: evalRes.accuracyPercentage,
      wordStatuses: evalRes.wordStatuses,
    };
  }

  // Fallback if passage is completely unavailable
  const fallbackSkippedCount =
    attempt.skippedWordsCount ??
    Math.max(0, (attempt.totalWordsInPara || 0) - (attempt.correctWordsCount || 0) - (attempt.incorrectWordsCount || 0));

  const totalTypedWords = (attempt.correctWordsCount || 0) + (attempt.incorrectWordsCount || 0);
  const fallbackAccuracy = totalTypedWords > 0
    ? Math.min(100, Math.max(0, Math.round(((attempt.correctWordsCount || 0) / totalTypedWords) * 1000) / 10))
    : 0;

  return {
    referencePassage: '',
    refWords: [],
    totalWordsInPara: attempt.totalWordsInPara || 0,
    correctWords: attempt.correctWords || [],
    incorrectWords: attempt.incorrectWords || [],
    skippedWords: attempt.skippedWords || [],
    correctWordsCount: attempt.correctWordsCount || 0,
    incorrectWordsCount: attempt.incorrectWordsCount || 0,
    skippedWordsCount: fallbackSkippedCount,
    accuracyPercentage: fallbackAccuracy,
    wordStatuses: [],
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
    'Skipped Words',
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
    att.skippedWordsCount ?? att.untypedWordsCount ?? 0,
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
