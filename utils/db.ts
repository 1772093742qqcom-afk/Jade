import { StarData, Song } from '../types';

const DB_NAME = 'LuminousOceanDB';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets'; // Stores Blobs (Images/Audio)
const STORE_STATE = 'state';   // Stores JSON data (Stars, Playlist, etc.)

export interface GameState {
  stars: StarData[];
  playlist: Song[];
  playbackCount: number;
}

// Open Database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS);
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save a File/Blob and return a unique ID
export const saveAsset = async (blob: Blob): Promise<string> => {
  const db = await openDB();
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.put(blob, id);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

// Get a File/Blob by ID
export const getAsset = async (id: string): Promise<Blob | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save entire Game State
export const saveGameState = async (state: GameState): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STATE, 'readwrite');
    const store = tx.objectStore(STORE_STATE);
    // We strip out the runtime Blob URLs before saving to avoid clutter/confusion,
    // though strictly speaking we only need the assetIds for reconstruction.
    // However, saving the whole object is fine, runtime URLs are temporary anyway.
    const request = store.put(state, 'current');
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Load Game State
export const loadGameState = async (): Promise<GameState | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STATE, 'readonly');
    const store = tx.objectStore(STORE_STATE);
    const request = store.get('current');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteAsset = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    tx.objectStore(STORE_ASSETS).delete(id);
};
