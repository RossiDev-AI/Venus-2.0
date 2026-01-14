import { VaultItem, DNAToken, StudioSession, LuminaPreset } from './types';

const DB_NAME = 'LatentCinemaDB_v2';
const STORE_NAME = 'vault_nodes';
const SESSION_STORE = 'studio_sessions';
const TOKEN_STORE_NAME = 'dna_tokens';
const PRESET_STORE = 'lumina_presets';
const DB_VERSION = 5;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(SESSION_STORE)) db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(TOKEN_STORE_NAME)) db.createObjectStore(TOKEN_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PRESET_STORE)) db.createObjectStore(PRESET_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePreset = async (preset: LuminaPreset): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRESET_STORE, 'readwrite');
    tx.objectStore(PRESET_STORE).put(preset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllUserPresets = async (): Promise<LuminaPreset[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(PRESET_STORE, 'readonly');
    const req = tx.objectStore(PRESET_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
};

export const saveSession = async (session: StudioSession): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSION_STORE, 'readwrite');
        tx.objectStore(SESSION_STORE).put(session);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getAllSessions = async (): Promise<StudioSession[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const tx = db.transaction(SESSION_STORE, 'readonly');
        const req = tx.objectStore(SESSION_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
};

export const deleteNode = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const toggleFavoriteNode = async (id: string): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item = await new Promise<VaultItem | undefined>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
  if (item) {
    item.isFavorite = !item.isFavorite;
    store.put(item);
  }
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const bulkSaveNodes = async (items: VaultItem[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveNode = async (item: VaultItem): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllNodes = async (): Promise<VaultItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};
