
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

// --- Generic Save Function for Daily Data ---
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

// --- Generic Load Function for Daily Data ---
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

// --- Specific Save Functions for Daily Data ---
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


// --- Specific Load Functions using the generic loader for Daily Data ---
export const loadTasksForDay = async (userId: string, dateKey: string): Promise<Task[]> =>
  (await loadDailyData(userId, dateKey))?.tasks || [];

export const loadNotesForDay = async (userId: string, dateKey: string): Promise<string | null> => // Allow null
  (await loadDailyData(userId, dateKey))?.notes || null;

export const loadDictionaryForDay = async (userId: string, dateKey: string): Promise<DefinedWordEntry[]> =>
  (await loadDailyData(userId, dateKey))?.dictionary || [];

export const loadSessionContextForDay = async (userId: string, dateKey: string): Promise<SessionType | null> => // Allow null
  (await loadDailyData(userId, dateKey))?.sessionContext || null;

export const loadSessionLogForDay = async (userId: string, dateKey: string): Promise<SessionRecord[]> =>
  (await loadDailyData(userId, dateKey))?.sessionLog || [];


// --- Delete Today's History (Session Log) for Daily Data ---
export const deleteSessionLogForDay = async (userId: string, dateKey: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated for deleting data.");
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    // Set the sessionLog field to an empty array. Using updateDoc is safer if the doc might not exist.
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        await updateDoc(docRef, { sessionLog: [] });
    }
  } catch (error) {
    console.error(`Error deleting session log for ${dateKey}:`, error);
    throw error;
  }
};

// --- Delete Notes for a Specific Day from Daily Data ---
export const deleteNotesForDay = async (userId: string, dateKey: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated for deleting notes.");
  const docRef = getDailyDataDocRef(userId, dateKey);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        notes: deleteField()
      });
    }
  } catch (error) {
    console.error(`Error deleting notes for ${dateKey}:`, error);
    throw error;
  }
};


// --- General Notebook Service Functions ---
const GENERAL_NOTEBOOK_DOC_ID = "mainContent"; // Using a fixed ID for the single notebook document

function getGeneralNotebookDocRef(userId: string) {
  return doc(db, "users", userId, "generalNotebook", GENERAL_NOTEBOOK_DOC_ID);
}

export const saveGeneralNotes = async (userId: string, content: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated for saving general notes.");
  const docRef = getGeneralNotebookDocRef(userId);
  try {
    await setDoc(docRef, { content: content, updatedAt: new Date() }, { merge: true });
  } catch (error) {
    console.error("Error saving general notes:", error);
    throw error;
  }
};

export const loadGeneralNotes = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.warn("User not authenticated for loading general notes.");
    return null;
  }
  const docRef = getGeneralNotebookDocRef(userId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.content || null;
    }
    return null; // No notes saved yet
  } catch (error) {
    console.error("Error loading general notes:", error);
    throw error;
  }
};
