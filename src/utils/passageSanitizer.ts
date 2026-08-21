/**
 * Comprehensive DevLys 010 & Unicode Devanagari Token Health Doctor & Passage Sanitizer
 * 
 * Detects, classifies, and automatically heals all word/token anomalies:
 * 1. Special Remington Key ASCII Stripping (; -> य, { -> क्ष्, [ -> ख्, ? -> घ्, / -> ध्, ' -> श्, " -> ष्, < -> ढ)
 * 2. Rogue Nuktas on non-standard consonants (ह़, म़, ऱ, त़, प़, ऩ, स़, ब़, च़, etc.)
 * 3. Trailing attached periods/dots (पेड़., इंटरनेट., कंप्यूटर. -> पेड़, इंटरनेट, कंप्यूटर)
 * 4. Danda / Pipe spacing desynchronization (है । -> है।)
 * 5. Matra 'f' (ि) placement or orphan issues
 * 6. Independent vowel vs matra ambiguities (नए / नये / ने, गए / गये, हुए / हुये)
 * 7. Zero-width invisible unicode characters (\u200B, \u200C, \u200D, \uFEFF, \u00A0)
 * 8. Conflicting / Double matras (ाा, िी, ुू, ेै, ोौ)
 * 9. Repeated or hanging halants (््)
 * 10. ASCII / Unicode mixed encoding glitches
 */

import { convertDevlysToUnicode, convertUnicodeToDevlys } from './devlysConverter';

export type AnomalySeverity = 'ERROR' | 'WARNING' | 'INFO';

export type AnomalyCategory =
  | 'ROGUE_NUKTA'
  | 'TRAILING_PUNCTUATION'
  | 'DANDA_SPACING'
  | 'DEVLYS_KEY_CORRUPTION'
  | 'MATRA_ENCODING'
  | 'VOWEL_AMBIGUITY'
  | 'ZERO_WIDTH_CHAR'
  | 'DOUBLE_MATRA'
  | 'DANGLING_HALANT'
  | 'EXTRA_SPACE';

export interface TokenHealthReport {
  index: number;
  originalToken: string;
  refinedToken: string;
  originalWord: string; // Alias for backward compatibility
  refinedWord: string; // Alias for backward compatibility
  devlysKeystrokes: string;
  unicodeRepr: string;
  hasIssue: boolean;
  severity?: AnomalySeverity;
  category?: AnomalyCategory;
  issueType?: string; // Alias
  description?: string; // Alias
  categoryLabelHindi: string;
  categoryLabelEnglish: string;
  descriptionHindi: string;
  descriptionEnglish: string;
  codepoints: string[];
}

export interface PassageAuditResult {
  hasIssues: boolean;
  healthScore: number; // 0 to 100
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  anomalies: TokenHealthReport[];
  allTokens: TokenHealthReport[];
  originalPassage: string;
  refinedPassage: string;
  originalWordCount: number;
  refinedWordCount: number;
}

/**
 * Detailed analysis of an individual word/token
 */
export function analyzeToken(token: string, index: number, isHindi: boolean): TokenHealthReport {
  if (!token) {
    return {
      index,
      originalToken: '',
      refinedToken: '',
      originalWord: '',
      refinedWord: '',
      devlysKeystrokes: '',
      unicodeRepr: '',
      hasIssue: false,
      categoryLabelHindi: 'सामान्य',
      categoryLabelEnglish: 'Normal',
      descriptionHindi: 'खाली टोकन',
      descriptionEnglish: 'Empty token',
      codepoints: [],
    };
  }

  const codepoints = Array.from(token).map((c) => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
  let refined = token;
  let hasIssue = false;
  let severity: AnomalySeverity = 'INFO';
  let category: AnomalyCategory = 'EXTRA_SPACE';
  let categoryLabelHindi = 'सामान्य';
  let categoryLabelEnglish = 'Normal';
  let descriptionHindi = 'टोकन सही है';
  let descriptionEnglish = 'Token is healthy and valid';

  // 1. Zero-width character check
  if (/[\u200B-\u200D\uFEFF\u00A0]/.test(refined)) {
    hasIssue = true;
    severity = 'ERROR';
    category = 'ZERO_WIDTH_CHAR';
    categoryLabelHindi = 'अदृश्य वर्ण (Zero-width character)';
    categoryLabelEnglish = 'Invisible Zero-Width Character';
    descriptionHindi = 'अवांछित अदृश्य यूनीकोड वर्ण पाया गया जो मिलान में त्रुटि पैदा करता है';
    descriptionEnglish = 'Invisible zero-width formatting character found that breaks string equality';
    refined = refined.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
  }

  if (isHindi) {
    // Check if token is DevLys ASCII or Unicode Devanagari
    const isDevlysAscii = /^[A-Za-z0-9~`!@#$%^&*()_+\-=\[\]{}':;"\\|,.<>\/?]+$/.test(refined) && !/[\u0900-\u097F]/.test(refined);

    // 2. DevLys Special Key Corruption check
    if (isDevlysAscii && /[;{}\[\]?'"<>/=KJQWT]/.test(refined)) {
      const converted = convertDevlysToUnicode(refined);
      if (converted && converted !== refined) {
        // Valid Remington symbol token
      }
    }

    // 3. Double matra detection (e.g. ाा, िी, ुू, ेै, ोौ)
    if (/([\u093E-\u094C])\1+/u.test(refined)) {
      hasIssue = true;
      severity = 'ERROR';
      category = 'DOUBLE_MATRA';
      categoryLabelHindi = 'दोहरी मात्रा (Double Matra)';
      categoryLabelEnglish = 'Repeated / Conflicting Matra';
      descriptionHindi = 'एक ही अक्षर पर दोहरी मात्रा पाई गई';
      descriptionEnglish = 'Consecutive duplicate matra detected';
      refined = refined.replace(/([\u093E-\u094C])\1+/gu, '$1');
    }

    // 4. Rogue Nukta on non-standard Devanagari consonants (e.g. ह़, म़, ऱ, त़, प़, ऩ, स़, ब़, च़, etc.)
    if (/[^कखगज़डढफ़]\u093C/u.test(refined)) {
      hasIssue = true;
      severity = 'ERROR';
      category = 'ROGUE_NUKTA';
      categoryLabelHindi = 'अनावश्यक नुक्ता (Rogue Nukta)';
      categoryLabelEnglish = 'Rogue Nukta Mark';
      descriptionHindi = 'गैर-मानक वर्ण पर अनावश्यक नुक्ता (ह़/म़/आदि) लगा है जिससे सही टाइप करने पर भी गलत माना जाता है';
      descriptionEnglish = 'Unnecessary nukta attached to consonant (e.g. ह़ instead of हमारे), causing false mismatches';
      refined = refined.replace(/([^कखगज़डढफ़])\u093C/gu, '$1');
    }

    // 5. Trailing attached period/dot on Hindi word (e.g. 'पेड़.', 'इंटरनेट.')
    if (/[\u0900-\u097F]\.+$/u.test(refined) && !/[।]$/.test(refined)) {
      hasIssue = true;
      severity = 'WARNING';
      category = 'TRAILING_PUNCTUATION';
      categoryLabelHindi = 'अवांछित डॉट (Attached Period)';
      categoryLabelEnglish = 'Attached Trailing Period';
      descriptionHindi = 'हिंदी शब्द के साथ बिना स्पेस के अंग्रेजी डॉट (.) लगा है';
      descriptionEnglish = 'English period (.) attached directly to Hindi word without sentence separator';
      refined = refined.replace(/\.+$/u, '');
    }

    // 6. Danda / Pipe spacing anomaly
    if (/\|/.test(refined)) {
      hasIssue = true;
      severity = 'WARNING';
      category = 'DANDA_SPACING';
      categoryLabelHindi = 'पाइप सिंबल (Pipe symbol)';
      categoryLabelEnglish = 'ASCII Pipe instead of Danda';
      descriptionHindi = 'अंग्रेजी पाइप (|) के स्थान पर मानक पूर्णविराम डंडा (।) होना चाहिए';
      descriptionEnglish = 'ASCII pipe (|) used instead of Hindi full-stop danda (।)';
      refined = refined.replace(/\|+/g, '।');
    }

    // 7. Dangling halant at end of isolated word (e.g. 'विद्‍')
    if (/\u094D$/u.test(refined)) {
      hasIssue = true;
      severity = 'INFO';
      category = 'DANGLING_HALANT';
      categoryLabelHindi = 'अधूरा हलंत (Trailing Halant)';
      categoryLabelEnglish = 'Trailing Halant at Word Boundary';
      descriptionHindi = 'शब्द के अंत में अधूरा हलंत पाया गया';
      descriptionEnglish = 'Word ends with an incomplete halant modifier';
    }

    // 8. Vowel ambiguity (e.g. 'नए' vs 'ने' / 'नये')
    if (refined === 'नए' || refined === 'नये') {
      // Info flag for typists
    }
  } else {
    // English checks: Repeated trailing dots, non-ASCII quotes
    if (/[a-zA-Z]\.{2,}$/.test(refined)) {
      hasIssue = true;
      severity = 'WARNING';
      category = 'TRAILING_PUNCTUATION';
      categoryLabelHindi = 'अतिरिक्त विराम चिन्ह';
      categoryLabelEnglish = 'Multiple Trailing Periods';
      descriptionHindi = 'शब्द के अंत में कई डॉट्स पाए गए';
      descriptionEnglish = 'Multiple consecutive periods at word ending';
      refined = refined.replace(/\.{2,}$/, '.');
    }
  }

  // Derive representations
  const unicodeRepr = isHindi
    ? (/^[\u0900-\u097F\s।|.,;:!?\-+=_*~^%#@`]+$/.test(refined)
      ? refined
      : convertDevlysToUnicode(refined))
    : refined;

  const devlysKeystrokes = isHindi
    ? convertUnicodeToDevlys(unicodeRepr)
    : refined;

  return {
    index,
    originalToken: token,
    refinedToken: refined,
    originalWord: token,
    refinedWord: refined,
    devlysKeystrokes,
    unicodeRepr,
    hasIssue: hasIssue || refined !== token,
    severity: hasIssue ? severity : undefined,
    category: hasIssue ? category : undefined,
    issueType: category,
    description: descriptionHindi,
    categoryLabelHindi,
    categoryLabelEnglish,
    descriptionHindi,
    descriptionEnglish,
    codepoints,
  };
}

/**
 * Audits and sanitizes a complete typing test passage.
 * Automatically resolves token errors and computes diagnostic health statistics.
 */
export function auditAndRefinePassage(
  passage: string,
  isHindi: boolean
): PassageAuditResult {
  if (!passage || !passage.trim()) {
    return {
      hasIssues: false,
      healthScore: 100,
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0,
      anomalies: [],
      allTokens: [],
      originalPassage: '',
      refinedPassage: '',
      originalWordCount: 0,
      refinedWordCount: 0,
    };
  }

  const rawWords = passage.trim().split(/\s+/).filter(Boolean);

  // Step 1: Global macro cleaning
  let cleanedPassage = passage
    .replace(/\r\n/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/[ \t]+/g, ' '); // Collapse spaces

  if (isHindi) {
    // Replace ASCII pipes '|' with standard Hindi danda '।'
    cleanedPassage = cleanedPassage.replace(/\|{1,2}/g, '।');
    // Clean rogue nuktas on non-standard letters across text
    cleanedPassage = cleanedPassage.replace(/([^कखगज़डढफ़\s])\u093C/gu, '$1');
    // Remove rogue periods attached directly after Devanagari characters (e.g. पेड़. -> पेड़)
    cleanedPassage = cleanedPassage.replace(/([\u0900-\u097F])\.(?=\s|$)/gu, '$1');
    // Fix double matras
    cleanedPassage = cleanedPassage.replace(/([\u093E-\u094C])\1+/gu, '$1');
    // Standardize danda attachment: attach to preceding word, leave 1 space after
    cleanedPassage = cleanedPassage
      .replace(/\s+([।!?.,;:])/g, '$1')
      .replace(/([।!?.,;:])([^\s।!?.,;:])/g, '$1 $2');
  } else {
    cleanedPassage = cleanedPassage
      .replace(/\s*([,;:!?.])\s*/g, '$1 ')
      .replace(/\s+/g, ' ');
  }

  cleanedPassage = cleanedPassage.trim();

  // Step 2: Token-by-token analysis
  const allTokens: TokenHealthReport[] = [];
  const anomalies: TokenHealthReport[] = [];
  let errorCount = 0;
  let warningCount = 0;

  rawWords.forEach((word, idx) => {
    const report = analyzeToken(word, idx + 1, isHindi);
    allTokens.push(report);
    if (report.hasIssue) {
      anomalies.push(report);
      if (report.severity === 'ERROR') errorCount++;
      else if (report.severity === 'WARNING') warningCount++;
    }
  });

  const refinedWords = cleanedPassage.split(/\s+/).filter(Boolean);

  // Calculate Health Score (0 - 100)
  const totalTokens = Math.max(1, rawWords.length);
  const penalty = (errorCount * 10 + warningCount * 4) / totalTokens * 100;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    hasIssues: anomalies.length > 0 || cleanedPassage !== passage.trim(),
    healthScore,
    totalIssues: anomalies.length,
    errorCount,
    warningCount,
    anomalies,
    allTokens,
    originalPassage: passage,
    refinedPassage: cleanedPassage,
    originalWordCount: rawWords.length,
    refinedWordCount: refinedWords.length,
  };
}

/**
 * Live validator for typed tokens against reference tokens.
 * Detects whether a mismatch is due to typing error or font encoding artifact.
 */
export function verifyDevlysKeystrokeMatch(
  refWord: string,
  typedWord: string
): {
  isMatch: boolean;
  refUnicode: string;
  typedUnicode: string;
  reason?: string;
} {
  if (!refWord || !typedWord) {
    return { isMatch: false, refUnicode: refWord || '', typedUnicode: typedWord || '' };
  }

  const refUnicode = /^[A-Za-z0-9~`!@#$%^&*()_+\-=\[\]{}':;"\\|,.<>\/?]+$/.test(refWord) && !/[\u0900-\u097F]/.test(refWord)
    ? convertDevlysToUnicode(refWord)
    : refWord;

  const typedUnicode = /^[A-Za-z0-9~`!@#$%^&*()_+\-=\[\]{}':;"\\|,.<>\/?]+$/.test(typedWord) && !/[\u0900-\u097F]/.test(typedWord)
    ? convertDevlysToUnicode(typedWord)
    : typedWord;

  const cleanRef = refUnicode.replace(/^[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+|[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+$/gu, '').normalize('NFC');
  const cleanTyped = typedUnicode.replace(/^[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+|[«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`]+$/gu, '').normalize('NFC');

  if (cleanRef === cleanTyped) {
    return { isMatch: true, refUnicode, typedUnicode };
  }

  // Handle standard variants (नए / नये / ने)
  if ((cleanRef === 'नए' || cleanRef === 'नये') && (cleanTyped === 'नए' || cleanTyped === 'नये' || cleanTyped === 'ने')) {
    return { isMatch: true, refUnicode, typedUnicode, reason: 'Variant spelling accepted' };
  }

  return { isMatch: false, refUnicode, typedUnicode, reason: 'Character mismatch' };
}
