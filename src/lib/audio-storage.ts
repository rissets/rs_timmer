
import type { UserSoundscapeRecord, UserSoundscapeListItem } from './types';

const DB_NAME = "rsUserSoundscapesDB";
const STORE_NAME = "soundscapes";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn("IndexedDB not supported or not available in this environment.");
        // Return a mock/stub or handle appropriately if needed server-side or in non-browser env
        // For client-side only app, this might be an error state.
        return reject(new Error("IndexedDB not supported."));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("name", "name", { unique: false });
        // No need to index mimeType or data directly for querying
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Reset promise on error
    };
  });
  return dbPromise;
}

export async function addSoundscape(name: string, mimeType: string, data: ArrayBuffer): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const soundscape: UserSoundscapeRecord = { name, mimeType, data };
    const request = store.add(soundscape);

    request.onsuccess = () => {
      resolve(request.result as number);
    };
    request.onerror = (event) => {
      console.error("Error adding soundscape:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

export async function getSoundscape(id: number): Promise<UserSoundscapeRecord | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as UserSoundscapeRecord | undefined);
    };
    request.onerror = (event) => {
      console.error("Error getting soundscape:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

export async function getAllSoundscapeListItems(): Promise<UserSoundscapeListItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    const items: UserSoundscapeListItem[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        items.push({ id: cursor.value.id, name: cursor.value.name });
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    request.onerror = (event) => {
      console.error("Error getting all soundscape list items:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}


export async function deleteSoundscape(id: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error deleting soundscape:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}
