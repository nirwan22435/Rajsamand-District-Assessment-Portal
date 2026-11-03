import { describe, it, expect } from 'vitest';
import {
  auditAndRefinePassage,
  verifyDevlysKeystrokeMatch,
} from '../../src/utils/passageSanitizer';

describe('Unit Tests: Passage Sanitizer & Unicode Converter (passageSanitizer.ts)', () => {
  it('should clean zero-width characters and collapse whitespace', () => {
    // Contains \u200B zero-width space and extra tab/spaces
    const dirtyText = 'राजसमंद\u200B   जिला    मूल्यांकन \t  पोर्टल';
    const result = auditAndRefinePassage(dirtyText, true);

    expect(result.refinedPassage).toBe('राजसमंद जिला मूल्यांकन पोर्टल');
    expect(result.originalWordCount).toBe(4);
    expect(result.refinedWordCount).toBe(4);
    expect(result.healthScore).toBe(100);
  });

  it('should handle empty or whitespace-only passages cleanly without throwing errors', () => {
    const result = auditAndRefinePassage('', false);
    expect(result.refinedPassage).toBe('');
    expect(result.originalWordCount).toBe(0);
    expect(result.healthScore).toBe(100);
  });

  it('should verify DevLys / Unicode keystroke matches accurately', () => {
    const match = verifyDevlysKeystrokeMatch('राजस्थान', 'राजस्थान');
    expect(match.isMatch).toBe(true);

    const variantMatch = verifyDevlysKeystrokeMatch('नए', 'नये');
    expect(variantMatch.isMatch).toBe(true);

    const mismatch = verifyDevlysKeystrokeMatch('उदयपुर', 'जयपुर');
    expect(mismatch.isMatch).toBe(false);
  });
});
