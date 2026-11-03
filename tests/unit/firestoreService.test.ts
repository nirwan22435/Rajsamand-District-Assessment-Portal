import { describe, it, expect } from 'vitest';
import { computeTypingAccuracy } from '../../src/services/firestoreService';

describe('Unit Tests: Firestore Service Utilities (firestoreService.ts)', () => {
  describe('computeTypingAccuracy', () => {
    it('should return 100% when all typed words are correct', () => {
      expect(computeTypingAccuracy(300, 0)).toBe(100);
      expect(computeTypingAccuracy(50, 0)).toBe(100);
    });

    it('should return 0% when no words are typed or total typed is 0', () => {
      expect(computeTypingAccuracy(0, 0)).toBe(0);
      expect(computeTypingAccuracy(-1, 0)).toBe(0);
    });

    it('should calculate accurate percentages with one decimal place precision', () => {
      // 95 correct out of 100 total typed = 95%
      expect(computeTypingAccuracy(95, 5)).toBe(95);

      // 97 correct out of 100 total typed = 97%
      expect(computeTypingAccuracy(97, 3)).toBe(97);

      // 85 correct out of 90 total typed = (85/90)*100 = 94.444 -> 94.4%
      expect(computeTypingAccuracy(85, 5)).toBe(94.4);
    });

    it('should clamp bounds strictly between 0 and 100', () => {
      expect(computeTypingAccuracy(0, 50)).toBe(0);
      expect(computeTypingAccuracy(100, 0)).toBe(100);
    });
  });
});
