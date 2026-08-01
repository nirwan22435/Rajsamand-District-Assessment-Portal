import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Candidate, TestPaper, TestAttempt, EmailLog } from '../types';

const CANDIDATES_COL = 'candidates';
const TESTS_COL = 'tests';
const ATTEMPTS_COL = 'attempts';
const EMAIL_LOGS_COL = 'email_logs';

// Subscribe to candidates
export function subscribeCandidates(
  onData: (candidates: Candidate[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, CANDIDATES_COL),
    (snapshot) => {
      const list: Candidate[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Candidate);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CANDIDATES_COL);
      if (onError) onError(error);
    }
  );
}

// Subscribe to tests
export function subscribeTests(
  onData: (tests: TestPaper[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, TESTS_COL),
    (snapshot) => {
      const list: TestPaper[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TestPaper);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TESTS_COL);
      if (onError) onError(error);
    }
  );
}

// Subscribe to attempts
export function subscribeAttempts(
  onData: (attempts: TestAttempt[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, ATTEMPTS_COL),
    (snapshot) => {
      const list: TestAttempt[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TestAttempt);
      });
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, ATTEMPTS_COL);
      if (onError) onError(error);
    }
  );
}

// Subscribe to email logs
export function subscribeEmailLogs(
  onData: (logs: EmailLog[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, EMAIL_LOGS_COL),
    (snapshot) => {
      const list: EmailLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EmailLog);
      });
      list.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, EMAIL_LOGS_COL);
      if (onError) onError(error);
    }
  );
}

// Helper to clean objects before passing to Firestore (Firestore rejects 'undefined' values)
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(cleanForFirestore) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned as T;
}

// Save or add candidate
export async function saveCandidateToFirestore(candidate: Candidate) {
  const path = `${CANDIDATES_COL}/${candidate.id}`;
  try {
    await setDoc(doc(db, CANDIDATES_COL, candidate.id), cleanForFirestore(candidate), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Toggle candidate status
export async function toggleCandidateStatusInFirestore(candidateId: string, currentStatus: boolean) {
  const path = `${CANDIDATES_COL}/${candidateId}`;
  try {
    await updateDoc(doc(db, CANDIDATES_COL, candidateId), {
      activeStatus: !currentStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Save or add test
export async function saveTestToFirestore(test: TestPaper) {
  const path = `${TESTS_COL}/${test.id}`;
  try {
    await setDoc(doc(db, TESTS_COL, test.id), cleanForFirestore(test), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete test paper
export async function deleteTestFromFirestore(testId: string) {
  const path = `${TESTS_COL}/${testId}`;
  try {
    await deleteDoc(doc(db, TESTS_COL, testId));
  } catch (error) {
    console.error('Firestore delete test error:', error);
  }
}

// Save or add attempt
export async function saveAttemptToFirestore(attempt: TestAttempt) {
  const path = `${ATTEMPTS_COL}/${attempt.id}`;
  try {
    await setDoc(doc(db, ATTEMPTS_COL, attempt.id), cleanForFirestore(attempt), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save or add email log
export async function saveEmailLogToFirestore(log: EmailLog) {
  const path = `${EMAIL_LOGS_COL}/${log.id}`;
  try {
    await setDoc(doc(db, EMAIL_LOGS_COL, log.id), cleanForFirestore(log), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed initial mock data if collections are empty
export async function seedInitialDataIfEmpty(
  initialCandidates: Candidate[],
  initialTests: TestPaper[],
  initialAttempts: TestAttempt[],
  initialEmailLogs: EmailLog[]
) {
  try {
    const candSnap = await getDocs(collection(db, CANDIDATES_COL));
    if (candSnap.empty) {
      for (const c of initialCandidates) {
        await saveCandidateToFirestore(c);
      }
    }

    const testSnap = await getDocs(collection(db, TESTS_COL));
    if (testSnap.empty) {
      for (const t of initialTests) {
        await saveTestToFirestore(t);
      }
    }

    const attemptSnap = await getDocs(collection(db, ATTEMPTS_COL));
    if (attemptSnap.empty) {
      for (const a of initialAttempts) {
        await saveAttemptToFirestore(a);
      }
    }

    const emailSnap = await getDocs(collection(db, EMAIL_LOGS_COL));
    if (emailSnap.empty) {
      for (const l of initialEmailLogs) {
        await saveEmailLogToFirestore(l);
      }
    }
  } catch (err) {
    console.warn('Firestore seeding notice:', err);
  }
}
