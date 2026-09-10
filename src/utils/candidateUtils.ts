import { Candidate } from '../types';

/**
 * Checks whether a candidate is officially registered for the typing test module.
 * If false, the candidate must NOT have access to the typing test module,
 * typing test tabs, typing evaluations, or typing test links now and in the future.
 */
export function isCandidateRegisteredForTyping(candidate?: Candidate | null): boolean {
  if (!candidate) return false;
  // If explicitly flagged as false, candidate is definitely not registered for typing test
  if (candidate.registeredForTyping === false) return false;
  // If registered module is strictly ASSESSMENT, candidate is not registered for typing test
  if (candidate.registeredModule === 'ASSESSMENT') return false;
  // If explicitly flagged as true
  if (candidate.registeredForTyping === true) return true;
  // If registeredModule is TYPING or BOTH
  if (candidate.registeredModule === 'TYPING' || candidate.registeredModule === 'BOTH') return true;
  // Candidates explicitly created under dedicated typing roll number prefix (TYP-...)
  if (typeof candidate.registrationId === 'string' && candidate.registrationId.toUpperCase().startsWith('TYP-')) return true;
  // Dedicated typing candidate ID prefix
  if (typeof candidate.id === 'string' && candidate.id.startsWith('cand-typ-')) return true;
  return false;
}

/**
 * Checks whether a candidate is registered strictly ONLY for typing test (no MCQ assessments).
 */
export function isCandidateTypingOnly(candidate?: Candidate | null): boolean {
  if (!isCandidateRegisteredForTyping(candidate)) return false;
  if (candidate?.registeredModule === 'BOTH') return false;
  if (candidate?.registeredForAssessment === true) return false;
  if (candidate?.registeredModule === 'TYPING') return true;
  if (typeof candidate?.id === 'string' && candidate.id.startsWith('cand-typ-')) return true;
  if (typeof candidate?.registrationId === 'string' && candidate.registrationId.toUpperCase().startsWith('TYP-')) return true;
  return false;
}

/**
 * Checks whether a candidate is registered for general/MCQ assessment.
 */
export function isCandidateRegisteredForAssessment(candidate?: Candidate | null): boolean {
  if (!candidate) return false;
  if (candidate.registeredForAssessment === false) return false;
  if (candidate.registeredModule === 'ASSESSMENT' || candidate.registeredModule === 'BOTH') return true;
  if (isCandidateTypingOnly(candidate)) return false;
  return true;
}
