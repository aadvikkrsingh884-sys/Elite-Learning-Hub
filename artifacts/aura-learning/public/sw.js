/**
 * AuraLearning Elite — Service Worker
 * Strategies:
 *  - App shell (HTML/CSS/JS): Cache-first, update in background
 *  - Static assets (fonts, images): Cache-first
 *  - API calls (/api/*): Network-only (no caching — live data)
 *  - PDF resources: Cache-first (downloaded once, available offline)
 *  - Navigation: Network-first with offline fallback to cached index
 * Background Sync: queued progress & notes flush when reconnected
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `aura-shell-${CACHE_VERSION}`;
const STATIC_CACHE  = `aura-static-${CACHE_VERSION}`;
const PDF_CACHE     = `aura-pdfs-${CACHE_VERSION}`;

const APP_SHELL_URLS = ['/', '/index.html'];

// ─── Install: pre-cache the app shell ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, STATIC_CACHE, PDF_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !currentCaches.includes(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: routing logic ────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, chrome-extension
  if (request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin.split('//')[1]?.split('/')[0])) return;
  if (url.protocol === 'chrome-extension:') return;

  // API calls — always network, never cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // PDF resources — cache-first (available offline after first download)
  if (url.pathname.includes('.pdf') || url.pathname.includes('/resources/download')) {
    event.respondWith(pdfCacheFirst(request));
    return;
  }

  // Static assets (Vite hashed files — /assets/*.js, /assets/*.css)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staticCacheFirst(request));
    return;
  }

  // Navigation requests — network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ─── Strategy implementations ────────────────────────────────────────────────
async function pdfCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  if (network.ok) {
    const cache = await caches.open(PDF_CACHE);
    cache.put(request, network.clone());
  }
  return network;
}

async function staticCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  if (network.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, network.clone());
  }
  return network;
}

async function navigationNetworkFirst(request) {
  try {
    const network = await fetch(request);
    if (network.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, network.clone());
    }
    return network;
  } catch {
    const cached = await caches.match('/') || await caches.match('/index.html');
    return cached || new Response('Offline — open AuraLearning while connected first.', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(network => {
    if (network.ok) cache.put(request, network.clone());
    return network;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// ─── Background Sync: flush offline progress queue ───────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'aura-progress-sync') {
    event.waitUntil(flushProgressQueue());
  }
});

async function flushProgressQueue() {
  const db = await openOfflineDB();
  const tx = db.transaction('pending-syncs', 'readwrite');
  const store = tx.objectStore('pending-syncs');
  const allItems = await idbGetAll(store);

  for (const item of allItems) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        const delTx = db.transaction('pending-syncs', 'readwrite');
        delTx.objectStore('pending-syncs').delete(item.id);
        await txDone(delTx);
      }
    } catch {
      // Will retry on next sync event
    }
  }
}

// ─── Minimal IndexedDB helpers (no idb library) ──────────────────────────────
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('aura-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending-syncs')) {
        db.createObjectStore('pending-syncs', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
