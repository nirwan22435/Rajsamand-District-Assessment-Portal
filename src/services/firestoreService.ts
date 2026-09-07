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
import { Candidate, TestPaper, TestAttempt, EmailLog, TypingTest, TypingAttempt } from '../types';

const CANDIDATES_COL = 'candidates';
const TESTS_COL = 'tests';
const ATTEMPTS_COL = 'attempts';
const EMAIL_LOGS_COL = 'email_logs';
const TYPING_TESTS_COL = 'typing_tests';
const TYPING_ATTEMPTS_COL = 'typing_attempts';

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

// Subscribe to typing tests
export function subscribeTypingTests(
  onData: (tests: TypingTest[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, TYPING_TESTS_COL),
    (snapshot) => {
      const list: TypingTest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TypingTest);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TYPING_TESTS_COL);
      if (onError) onError(error);
    }
  );
}

// Subscribe to typing attempts
export function subscribeTypingAttempts(
  onData: (attempts: TypingAttempt[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    collection(db, TYPING_ATTEMPTS_COL),
    (snapshot) => {
      const list: TypingAttempt[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TypingAttempt);
      });
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TYPING_ATTEMPTS_COL);
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

// Delete candidate and cascade-delete all test submissions / attempts
export async function deleteCandidateFromFirestore(candidateId: string, candidateEmail?: string) {
  try {
    await deleteDoc(doc(db, CANDIDATES_COL, candidateId));
  } catch (error) {
    console.error('Firestore delete candidate error:', error);
  }

  // Delete test attempts/submissions associated with this candidate
  try {
    const attemptsSnap = await getDocs(collection(db, ATTEMPTS_COL));
    const targetEmail = candidateEmail ? candidateEmail.toLowerCase().trim() : null;
    const deletePromises: Promise<void>[] = [];
    attemptsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const matchId = data.candidateId === candidateId;
      const matchEmail =
        targetEmail &&
        data.candidateEmail &&
        data.candidateEmail.toLowerCase().trim() === targetEmail;
      if (matchId || matchEmail) {
        deletePromises.push(deleteDoc(doc(db, ATTEMPTS_COL, docSnap.id)));
      }
    });
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.error('Firestore cascade delete attempts error:', err);
  }

  // Delete typing attempts associated with this candidate
  try {
    const typingAttemptsSnap = await getDocs(collection(db, TYPING_ATTEMPTS_COL));
    const targetEmail = candidateEmail ? candidateEmail.toLowerCase().trim() : null;
    const deletePromises: Promise<void>[] = [];
    typingAttemptsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const matchId = data.candidateId === candidateId;
      const matchEmail =
        targetEmail &&
        data.candidateEmail &&
        data.candidateEmail.toLowerCase().trim() === targetEmail;
      if (matchId || matchEmail) {
        deletePromises.push(deleteDoc(doc(db, TYPING_ATTEMPTS_COL, docSnap.id)));
      }
    });
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.error('Firestore cascade delete typing attempts error:', err);
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

// Save or add typing test
export async function saveTypingTestToFirestore(test: TypingTest) {
  const path = `${TYPING_TESTS_COL}/${test.id}`;
  try {
    await setDoc(doc(db, TYPING_TESTS_COL, test.id), cleanForFirestore(test), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete typing test
export async function deleteTypingTestFromFirestore(testId: string) {
  const path = `${TYPING_TESTS_COL}/${testId}`;
  try {
    await deleteDoc(doc(db, TYPING_TESTS_COL, testId));
  } catch (error) {
    console.error('Firestore delete typing test error:', error);
  }
}

// Save or add typing attempt
export async function saveTypingAttemptToFirestore(attempt: TypingAttempt) {
  const path = `${TYPING_ATTEMPTS_COL}/${attempt.id}`;
  try {
    await setDoc(doc(db, TYPING_ATTEMPTS_COL, attempt.id), cleanForFirestore(attempt), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete typing attempt
export async function deleteTypingAttemptFromFirestore(attemptId: string) {
  const path = `${TYPING_ATTEMPTS_COL}/${attemptId}`;
  try {
    await deleteDoc(doc(db, TYPING_ATTEMPTS_COL, attemptId));
  } catch (error) {
    console.error('Firestore delete typing attempt error:', error);
  }
}

// Seed initial mock data if collections are empty
export async function seedInitialDataIfEmpty(
  initialCandidates: Candidate[],
  initialTests: TestPaper[],
  initialAttempts: TestAttempt[],
  initialEmailLogs: EmailLog[],
  initialTypingTests?: TypingTest[]
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

    if (initialTypingTests && initialTypingTests.length > 0) {
      const typingTestSnap = await getDocs(collection(db, TYPING_TESTS_COL));
      if (typingTestSnap.empty) {
        for (const tt of initialTypingTests) {
          await saveTypingTestToFirestore(tt);
        }
      }
    }
  } catch (err) {
    console.warn('Firestore seeding notice:', err);
  }
}

// Admin Password Storage Helpers & Realtime Sync
let inMemoryAdminPassword: string | null = null;

export function getStoredAdminPassword(): string {
  if (inMemoryAdminPassword && inMemoryAdminPassword.trim()) {
    return inMemoryAdminPassword.trim();
  }
  try {
    const stored = localStorage.getItem('rajsamand_admin_password');
    if (stored && stored.trim()) {
      inMemoryAdminPassword = stored.trim();
      return stored.trim();
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'admin123';
}

export async function saveStoredAdminPassword(newPassword: string): Promise<void> {
  const cleanPass = newPassword.trim();
  inMemoryAdminPassword = cleanPass;
  try {
    localStorage.setItem('rajsamand_admin_password', cleanPass);
  } catch (e) {
    // Ignore localStorage errors
  }
  try {
    const docRef = doc(db, 'settings', 'admin_config');
    await setDoc(docRef, { password: cleanPass, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Firestore admin config sync notice:', e);
  }
}

export function subscribeAdminPassword(onPasswordChange: (password: string) => void) {
  const docRef = doc(db, 'settings', 'admin_config');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.password && typeof data.password === 'string') {
          const pass = data.password.trim();
          inMemoryAdminPassword = pass;
          try {
            localStorage.setItem('rajsamand_admin_password', pass);
          } catch (e) {
            // Ignore
          }
          onPasswordChange(pass);
        }
      }
    },
    (err) => {
      console.warn('Firestore admin config listener notice:', err);
    }
  );
}
