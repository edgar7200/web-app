/* Chunk Reader service worker (generated at build time).
 * Keeps a copy of the app's own files on this device, so the app opens
 * without a connection. It only ever handles requests for the app's own
 * files: nothing is sent or fetched anywhere else. */
const VERSION = "3ab44ff5c209";
// The folder is part of the name, so two copies of the app on one site keep their files apart.
const PREFIX = 'chunk-reader-' + tag(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + VERSION;
const FILES = [
 "./assets/atkinson-hyperlegible-latin-400-normal-BrHNak5F.woff2",
 "./assets/atkinson-hyperlegible-latin-ext-400-normal-DRk46D-x.woff2",
 "./assets/epub-DB0_PR4z.js",
 "./assets/index-BXFCsfLk.css",
 "./assets/index-Cr8QGGGt.js",
 "./assets/literata-latin-400-normal-CLtNJ872.woff2",
 "./assets/literata-latin-ext-400-normal-D5BsCrMl.woff2",
 "./assets/pdf-B4xTgNxR.js",
 "./assets/pdf-CPLwuKBH.js",
 "./assets/pdfWorker-Cq4AOvP2.js",
 "./assets/pdfWorker-DrRiuNVY.js",
 "./icons/apple-touch-icon.png",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/icon.svg",
 "./",
 "./licenses.txt",
 "./manifest.webmanifest"
];
// What the start page of this version loads. A start page that names other files is an older copy.
const ENTRY = ["assets/index-Cr8QGGGt.js","assets/index-BXFCsfLk.css"];

function tag(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // "reload" skips the browser's own cache, so a new version never stores stale files.
      await cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' })));
      // Right after a deploy a server can still hand out the previous start page for a while.
      // Keeping that one would leave the app asking for files that are gone, so this install
      // is given up instead. The version that is running stays, and the next check tries again.
      const page = await cache.match('./');
      const html = page ? await page.text() : '';
      if (!ENTRY.every((name) => html.includes(name))) {
        await caches.delete(CACHE);
        throw new Error('The start page does not belong to this version yet.');
      }
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  // A new version waits until the reader taps "Update". Then the page sends this message.
  if (event.data === 'skip-waiting') self.skipWaiting();
  // The page asks which version is in charge (shown in Settings).
  if (event.data === 'version' && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request.mode === 'navigate' ? './' : request, { ignoreSearch: true });
      return hit || fetch(request);
    }),
  );
});
