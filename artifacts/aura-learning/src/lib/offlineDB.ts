/**
 * Client-side IndexedDB helpers for offline queuing.
 * Stores pending API calls (progress updates, notes) that are
 * flushed to the server when the device reconnects via Background Sync.
 */

const DB_NAME    = 'aura-offline';
const DB_VERSION = 1;

export interface PendingSync {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  queuedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-syncs')) {
        db.createObjectStore('pending-syncs', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Queue a fetch for later replay when online. */
export async function queueSync(item: Omit<PendingSync, 'id' | 'queuedAt'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-syncs', 'readwrite');
    tx.objectStore('pending-syncs').add({ ...item, queuedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Read all queued items. */
export async function getPendingSyncs(): Promise<PendingSync[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-syncs', 'readonly');
    const req = tx.objectStore('pending-syncs').getAll();
    req.onsuccess = () => resolve(req.result as PendingSync[]);
    req.onerror   = () => reject(req.error);
  });
}

/** Delete a synced item by its auto-assigned id. */
export async function removePendingSync(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-syncs', 'readwrite');
    tx.objectStore('pending-syncs').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Register a Background Sync tag so the SW flushes the queue when online. */
export async function requestBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('aura-progress-sync');
    } catch {
      // Background Sync not supported — flush inline instead
      await flushQueueInline();
    }
  } else {
    await flushQueueInline();
  }
}

/** Fallback: flush the queue directly when Background Sync is unavailable. */
async function flushQueueInline(): Promise<void> {
  const items = await getPendingSyncs();
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: JSON.stringify(item.body),
      });
      if (res.ok && item.id !== undefined) await removePendingSync(item.id);
    } catch {
      break; // still offline — stop
    }
  }
}
