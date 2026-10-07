// Mortgage Quote Pro Service Worker
// Offline-friendly caching. Registration is guarded in src/main.tsx so this
// never runs inside the Lovable preview iframe.

const VERSION = 'v1';
const SHELL_CACHE = `mqp-shell-${VERSION}`;
const ASSETS_CACHE = `mqp-assets-${VERSION}`;
const HTML_CACHE = `mqp-html-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, ASSETS_CACHE, HTML_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

const isSupabaseRequest = (url) =>
  url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in');

const isAsset = (request) => {
  const dest = request.destination;
  return ['style', 'script', 'font', 'image'].includes(dest);
};

// Network-first for HTML navigations with 3s timeout, fallback to cached shell.
async function networkFirstHTML(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    if (network && network.ok) {
      cache.put(request, network.clone());
    }
    return network;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.match('/');
    if (shell) return shell;
    throw e;
  }
}

// Stale-while-revalidate for assets.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never cache Supabase / API calls.
  if (isSupabaseRequest(url)) return;

  // Skip cross-origin non-asset requests (analytics, fonts handled below).
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  if (isAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
