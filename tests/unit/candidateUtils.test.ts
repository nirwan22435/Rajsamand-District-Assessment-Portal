import { describe, it, expect } from 'vitest';
import {
  isCandidateRegisteredForTyping,
  isCandidateTypingOnly,
  isCandidateRegisteredForAssessment,
} from '../../src/utils/candidateUtils';
import { Candidate } from '../../src/types';

describe('Unit Tests: Candidate Module Permissions & Routing (candidateUtils.ts)', () => {
  const baseCandidate: Candidate = {
    id: 'cand-001',
    registrationId: 'RJ-2026-001',
    name: 'Ramesh Sharma',
    email: 'ramesh@rajsamand.gov.in',
    phone: '9876543210',
    block: 'Rajsamand',
    activeStatus: true,
    password: 'password123',
    createdAt: new Date().toISOString(),
  };

  describe('isCandidateRegisteredForTyping', () => {
    it('should return false if candidate is null or undefined', () => {
      expect(isCandidateRegisteredForTyping(null)).toBe(false);
      expect(isCandidateRegisteredForTyping(undefined)).toBe(false);
    });

    it('should return false if explicitly flagged registeredForTyping = false', () => {
      const cand: Candidate = { ...baseCandidate, registeredForTyping: false };
      expect(isCandidateRegisteredForTyping(cand)).toBe(false);
    });

    it('should return false if registeredModule is strictly ASSESSMENT', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'ASSESSMENT' };
      expect(isCandidateRegisteredForTyping(cand)).toBe(false);
    });

    it('should return true if registeredForTyping is explicitly true', () => {
      const cand: Candidate = { ...baseCandidate, registeredForTyping: true };
      expect(isCandidateRegisteredForTyping(cand)).toBe(true);
    });

    it('should return true if registeredModule is TYPING or BOTH', () => {
      expect(isCandidateRegisteredForTyping({ ...baseCandidate, registeredModule: 'TYPING' })).toBe(true);
      expect(isCandidateRegisteredForTyping({ ...baseCandidate, registeredModule: 'BOTH' })).toBe(true);
    });

    it('should return true if registrationId starts with TYP-', () => {
      const cand: Candidate = { ...baseCandidate, registrationId: 'TYP-2026-889' };
      expect(isCandidateRegisteredForTyping(cand)).toBe(true);
    });

    it('should return true if candidate ID starts with cand-typ-', () => {
      const cand: Candidate = { ...baseCandidate, id: 'cand-typ-1049' };
      expect(isCandidateRegisteredForTyping(cand)).toBe(true);
    });
  });

  describe('isCandidateTypingOnly', () => {
    it('should return true for candidates with registeredModule = TYPING', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'TYPING', registeredForTyping: true };
      expect(isCandidateTypingOnly(cand)).toBe(true);
    });

    it('should return false if candidate is registered for BOTH modules', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'BOTH', registeredForTyping: true, registeredForAssessment: true };
      expect(isCandidateTypingOnly(cand)).toBe(false);
    });

    it('should return false if candidate is registered for ASSESSMENT only', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'ASSESSMENT', registeredForTyping: false };
      expect(isCandidateTypingOnly(cand)).toBe(false);
    });
  });

  describe('isCandidateRegisteredForAssessment', () => {
    it('should return true for standard assessment candidates', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'ASSESSMENT' };
      expect(isCandidateRegisteredForAssessment(cand)).toBe(true);
    });

    it('should return false for typing-only candidates', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'TYPING', registeredForAssessment: false };
      expect(isCandidateRegisteredForAssessment(cand)).toBe(false);
    });

    it('should return true for candidates registered for BOTH', () => {
      const cand: Candidate = { ...baseCandidate, registeredModule: 'BOTH' };
      expect(isCandidateRegisteredForAssessment(cand)).toBe(true);
    });
  });
});
