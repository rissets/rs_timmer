
// src/lib/firebase/firestore-service.ts
import { doc, setDoc, getDoc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from './config'; // Import Firestore instance
import type { Task, SessionRecord, DefinedWordEntry, SessionType } from '@/lib/types';

interface DailyData {
  tasks?: Task[];
  notes?: string;
  dictionary?: DefinedWordEntry[];
  sessionContext?: SessionType;
  sessionLog?: SessionRecord[];
}

// Helper function to get the document reference for a user's daily data
function getDailyDataDocRef(userId: string, dateKey: string) {
  return doc(db, "users", userId, "dailyData", dateKey);
}

// --- Generic Save Function ---
async function saveDailyDataField(userId: string, dateKey: string, field: keyof DailyData, data: any) {
  if (!userId) throw new Error("User not authenticated for saving data.");
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    await setDoc(docRef, { [field]: data }, { merge: true });
  } catch (error) {
    console.error(`Error saving ${field} for ${dateKey}:`, error);
    throw error; // Re-throw to be caught by caller
  }
}

// --- Generic Load Function ---
async function loadDailyData(userId: string, dateKey: string): Promise<DailyData | null> {
  if (!userId) {
    console.warn("User not authenticated for loading data.");
    return null;
  }
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyData;
    }
    return null; // No data for this day
  } catch (error) {
    console.error(`Error loading daily data for ${dateKey}:`, error);
    throw error; // Re-throw to be caught by caller
  }
}

// --- Specific Save Functions ---
export const saveTasksForDay = async (userId: string, dateKey: string, tasks: Task[]) =>
  saveDailyDataField(userId, dateKey, 'tasks', tasks);

export const saveNotesForDay = async (userId: string, dateKey: string, notes: string) =>
  saveDailyDataField(userId, dateKey, 'notes', notes);

export const saveDictionaryForDay = async (userId: string, dateKey: string, dictionary: DefinedWordEntry[]) =>
  saveDailyDataField(userId, dateKey, 'dictionary', dictionary);

export const saveSessionContextForDay = async (userId: string, dateKey: string, context: SessionType) =>
  saveDailyDataField(userId, dateKey, 'sessionContext', context);

export const saveSessionLogForDay = async (userId: string, dateKey: string, sessionLog: SessionRecord[]) =>
  saveDailyDataField(userId, dateKey, 'sessionLog', sessionLog);


// --- Specific Load Functions using the generic loader ---
export const loadTasksForDay = async (userId: string, dateKey: string): Promise<Task[]> =>
  (await loadDailyData(userId, dateKey))?.tasks || [];

export const loadNotesForDay = async (userId: string, dateKey: string): Promise<string> =>
  (await loadDailyData(userId, dateKey))?.notes || "";

export const loadDictionaryForDay = async (userId: string, dateKey: string): Promise<DefinedWordEntry[]> =>
  (await loadDailyData(userId, dateKey))?.dictionary || [];

export const loadSessionContextForDay = async (userId: string, dateKey: string): Promise<SessionType> =>
  (await loadDailyData(userId, dateKey))?.sessionContext || 'general';

export const loadSessionLogForDay = async (userId: string, dateKey: string): Promise<SessionRecord[]> =>
  (await loadDailyData(userId, dateKey))?.sessionLog || [];


// --- Delete Today's History (Session Log) ---
export const deleteSessionLogForDay = async (userId: string, dateKey: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated for deleting data.");
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    await setDoc(docRef, { sessionLog: [] }, { merge: true });
  } catch (error) {
    console.error(`Error deleting session log for ${dateKey}:`, error);
    throw error;
  }
};

// --- Delete Notes for a Specific Day ---
export const deleteNotesForDay = async (userId: string, dateKey: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated for deleting notes.");
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    // Using updateDoc with deleteField is more robust if the document might not exist
    // or the field might not exist, though setDoc with merge:true and an empty string works too.
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        notes: deleteField()
      });
    }
    // If doc doesn't exist, no action needed, notes are effectively "deleted" or non-existent.
  } catch (error) {
    console.error(`Error deleting notes for ${dateKey}:`, error);
    throw error;
  }
};

