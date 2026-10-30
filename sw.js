/* ==========================================================
   Dravenlock Software - Service Worker
   Pagina's: netwerk eerst (altijd de nieuwste). Overige: stale-while-revalidate:
   - Cachet HTML/CSS/JS/images bij eerste bezoek
   - Serveert vanuit cache (instant load)
   - Op de achtergrond: haalt vers exemplaar op + update cache
   - Volgende bezoek = nieuwe versie zichtbaar
   - Offline = laatst gecachte versie werkt door

   BIJ UPDATES: bump CACHE_VERSION zodat oude cache wordt
   weggegooid en gebruikers direct de nieuwe assets krijgen.
   ========================================================== */

const CACHE_VERSION = 'dravenlock-v1.9.6';

// Relatief aan de SW-locatie. Bv. als sw.js in /test/ staat, dan
// worden alle paden relatief aan /test/ - geen hardcoded /css/
// of /index.html nodig. Maakt de SW herbruikbaar in root EN
// sub-mappen zonder code-aanpassing.
const PRECACHE_URLS = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './logo.png',
    './favicon.ico',
    './manifest.webmanifest'
];

// === Install: precache de kernbestanden ===
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            // addAll faalt als één enkele 404 geeft - daarom add per stuk
            return Promise.all(
                PRECACHE_URLS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[SW] Precache skip:', url, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// === Activate: oude cache opruimen ===
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// === Fetch: stale-while-revalidate strategie ===
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Alleen GET requests cachen
    if (req.method !== 'GET') return;

    // Skip alle non-http(s) requests (chrome-extension://, etc.)
    if (!req.url.startsWith('http')) return;

    // POSTs naar send_mail.php nooit cachen (al voorbij de GET check,
    // maar voor de zekerheid)
    if (req.url.includes('send_mail.php')) return;

    // Externe downloads (de .exe bestanden) niet cachen - die zijn
    // groot en moeten altijd vers
    if (req.url.includes('/downloads/')) return;

    // Uitlegvideo's niet cachen (groot, en de browser vraagt ze in stukjes op)
    if (req.url.includes('/video/')) return;

    // Pagina's en apps.json: eerst het netwerk (dan zie je nieuwe versies en aantallen meteen),
    // alleen zonder internet uit de cache. (29-10-2026)
    const isPagina = req.mode === 'navigate' || req.destination === 'document' || req.url.includes('apps.json');
    if (isPagina) {
        event.respondWith(
            fetch(req).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const kopie = networkResponse.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(req, kopie));
                }
                return networkResponse;
            }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            const fetchPromise = fetch(req).then((networkResponse) => {
                // Cache alleen succesvolle responses
                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type === 'basic'
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(req, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Netwerk faalt - val terug op cache (al gebeurd hierboven)
                // Of return een offline-fallback voor HTML pages
                if (req.destination === 'document') {
                    return caches.match('./index.html');
                }
                return cachedResponse;
            });

            // Geef cached versie direct terug, fetchPromise update op
            // de achtergrond. Als geen cache: wacht op netwerk.
            return cachedResponse || fetchPromise;
        })
    );
});

// === Message handler voor handmatige cache-clear vanuit de pagina ===
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
