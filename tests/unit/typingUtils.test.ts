import { describe, it, expect } from 'vitest';
import {
  getWordsArray,
  countWords,
  isPurePunctuationToken,
  areWordsEquivalent,
  normalizeWordForEvaluation,
  evaluateTyping,
} from '../../src/utils/typingUtils';

describe('Unit Tests: Typing Assessment Engine (typingUtils.ts)', () => {
  describe('Word Splitting and Tokenization', () => {
    it('should split standard English sentences into words correctly', () => {
      const text = 'Rajsamand is a historical district in Rajasthan with rich culture.';
      const words = getWordsArray(text);
      expect(words).toEqual([
        'Rajsamand',
        'is',
        'a',
        'historical',
        'district',
        'in',
        'Rajasthan',
        'with',
        'rich',
        'culture.',
      ]);
      expect(countWords(text)).toBe(10);
    });

    it('should cleanly handle multiple whitespace, tabs, and newlines', () => {
      const text = '  Rajsamand \n\n  Assessment \t\t Portal   System  ';
      const words = getWordsArray(text);
      expect(words).toEqual(['Rajsamand', 'Assessment', 'Portal', 'System']);
      expect(countWords(text)).toBe(4);
    });

    it('should attach trailing punctuation tokens to the preceding word', () => {
      const text = 'Hello world ! This is Rajsamand , Rajasthan .';
      const words = getWordsArray(text);
      expect(words).toContain('world!');
      expect(words).toContain('Rajsamand,');
      expect(words).toContain('Rajasthan.');
    });

    it('should return empty array for empty or whitespace-only inputs', () => {
      expect(getWordsArray('')).toEqual([]);
      expect(getWordsArray('   ')).toEqual([]);
      expect(countWords('')).toBe(0);
    });
  });

  describe('Punctuation Token Detection', () => {
    it('should identify pure punctuation tokens correctly', () => {
      expect(isPurePunctuationToken('!')).toBe(true);
      expect(isPurePunctuationToken('।')).toBe(true); // Devanagari Danda
      expect(isPurePunctuationToken('||')).toBe(true);
      expect(isPurePunctuationToken('...')).toBe(true);
      expect(isPurePunctuationToken(',')).toBe(true);
      expect(isPurePunctuationToken(';')).toBe(true);
    });

    it('should identify alphanumeric and Devanagari words as not pure punctuation', () => {
      expect(isPurePunctuationToken('Rajasthan')).toBe(false);
      expect(isPurePunctuationToken('राजसमंद')).toBe(false);
      expect(isPurePunctuationToken('test123')).toBe(false);
      expect(isPurePunctuationToken('word!')).toBe(false);
    });
  });

  describe('Hindi Remington Keyboard Nuance & Orthographic Variations', () => {
    it('should match standard Hindi word variants (नए vs नये, गए vs गये)', () => {
      expect(areWordsEquivalent('नए', 'नये', true)).toBe(true);
      expect(areWordsEquivalent('नये', 'नए', true)).toBe(true);
      expect(areWordsEquivalent('गए', 'गये', true)).toBe(true);
      expect(areWordsEquivalent('हुए', 'हुये', true)).toBe(true);
      expect(areWordsEquivalent('लिए', 'लिये', true)).toBe(true);
    });

    it('should recognize identical Hindi words', () => {
      expect(areWordsEquivalent('भारत', 'भारत', true)).toBe(true);
      expect(areWordsEquivalent('राजस्थान', 'राजस्थान', true)).toBe(true);
    });

    it('should reject completely different Hindi words', () => {
      expect(areWordsEquivalent('भारत', 'प्रदेश', true)).toBe(false);
      expect(areWordsEquivalent('सड़क', 'मकान', true)).toBe(false);
    });
  });

  describe('Word Normalization for Fair Evaluation', () => {
    it('should strip outer punctuation in English and convert to lowercase', () => {
      expect(normalizeWordForEvaluation('"Rajsamand"', false)).toBe('rajsamand');
      expect(normalizeWordForEvaluation('Assessment,', false)).toBe('assessment');
      expect(normalizeWordForEvaluation('(Rajasthan)', false)).toBe('rajasthan');
    });

    it('should strip outer punctuation and normalize Devanagari in Hindi', () => {
      const normalized = normalizeWordForEvaluation('“राजसमंद”।', true);
      expect(normalized).toBe('राजसमंद');
    });
  });

  describe('Typing Speed (WPM) and Accuracy Evaluation', () => {
    it('should evaluate 100% accurate typing accurately', () => {
      const passage = 'Rajsamand is a beautiful district in Rajasthan known for marble and lakes.';
      const typed = 'Rajsamand is a beautiful district in Rajasthan known for marble and lakes.';
      const result = evaluateTyping(passage, typed, 60, 10, false, 10, true);

      expect(result.correctWordsCount).toBe(12);
      expect(result.incorrectWordsCount).toBe(0);
      expect(result.accuracyPercentage).toBe(100);
      expect(result.netWpm).toBe(12);
      expect(result.grossWpm).toBe(12);
      expect(result.status).toBe('QUALIFIED');
    });

    it('should compute accuracy percentage as (correct / (correct + incorrect)) * 100', () => {
      const passage = 'one two three four five six seven eight nine ten';
      const typed = 'one two wrong four wrong six seven eight nine ten';
      const result = evaluateTyping(passage, typed, 60, 5, false, 5, true);

      expect(result.correctWordsCount).toBe(8);
      expect(result.incorrectWordsCount).toBe(2);
      expect(result.accuracyPercentage).toBe(80); // (8 / 10) * 100 = 80%
      expect(result.status).toBe('QUALIFIED');
    });

    it('should disqualify a candidate if correct words fall below required threshold', () => {
      const passage = 'one two three four five six seven eight nine ten';
      const typed = 'one two wrong wrong wrong wrong wrong wrong wrong wrong';
      const result = evaluateTyping(passage, typed, 60, 10, false, 8, true);

      expect(result.correctWordsCount).toBe(2);
      expect(result.targetMinCorrectWords).toBe(8);
      expect(result.status).toBe('DISQUALIFIED');
    });

    it('should gracefully handle empty or unattempted submissions', () => {
      const passage = 'Rajsamand assessment test paper';
      const typed = '';
      const result = evaluateTyping(passage, typed, 60, 10, false, 10, true);

      expect(result.correctWordsCount).toBe(0);
      expect(result.netWpm).toBe(0);
      expect(result.grossWpm).toBe(0);
      expect(result.accuracyPercentage).toBe(0);
      expect(result.status).toBe('DISQUALIFIED');
    });
  });
});
