const CACHE_NAME = 'clueless-closet-v3';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './more.html',
    './manifest.json',
    './reset.css',
    './styles.css',
    './script.js',
    './clothes.json',
    './assets/images/pc.png',
    './assets/images/icon-192.png',
    './assets/images/icon-512.png',
    './assets/images/leopardPattern.png',
    './assets/images/overlay.jpg',
    './assets/images/models/modelo_isa_1.png',
    './assets/images/more/josh.jpeg',
    './assets/images/more/Isa.jpeg',
    './assets/images/more/Tai.jpeg',
    './assets/images/more/Travis.png',
    './assets/audio/lclick-13694.mp3',
    './assets/audio/mixkit-winning-chimes-2015.wav',
    './assets/audio/mixkit-wrong-long-buzzer-954.wav',
    './assets/fonts/Pixellari/stylesheet.css',
    './assets/fonts/Pixellari/Pixellari.woff',
    './assets/fonts/Pixellari/Pixellari.woff2',
    './assets/images/clothes/camiseta_corta_gris_basica.png',
    './assets/images/clothes/falda_corta_blanca_vaquera.png',
    './assets/images/clothes/falda_larga_azul_rallas_blancas.png',
    './assets/images/clothes/falda_larga_blanca_volantes.png',
    './assets/images/clothes/falda_larga_negra_normal.png',
    './assets/images/clothes/jersey_cremallera_rallas_blanco_y_negro.png',
    './assets/images/clothes/jersey_cuello_alto_beige.png',
    './assets/images/clothes/jersey_cuello_alto_gris_oscuro.png',
    './assets/images/clothes/jersey_finio_negro_basico.png',
    './assets/images/clothes/pantalon_largo_azul_vaquero.png',
    './assets/images/clothes/pantalon_largo_beige_vaquero.png',
    './assets/images/clothes/pantalon_largo_gris_vaquero_ralla.png',
    './assets/images/clothes/pantalon_largo_verde_vaquero.png',
    './assets/images/clothes/short_corto_gris_vaquero.png',
    './assets/images/clothes/short_largo_azul_vaquero.png',
    './assets/images/clothes/top_bandeau_amarillo.png',
    './assets/images/clothes/top_bandeau_blanco.png',
    './assets/images/clothes/top_bandeau_rosa.png',
    './assets/images/clothes/top_blanco_tirantes_h&m.png',
    './assets/images/clothes/top_blusa_blanco_topos_negros.png',
    './assets/images/clothes/top_sin_mangas_granate_formal.png',
    './assets/images/clothes/vestido_amarillo_flores.png',
    './assets/images/clothes/vestido_granate_cruzado.png'
];

// Install Event - Resilient Precache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Precaching essential assets');
            // Cache items individually so a single network glitch or asset issue won't fail the SW install
            await Promise.allSettled(
                PRECACHE_ASSETS.map((asset) =>
                    cache.add(asset).catch((err) => {
                        console.warn('[Service Worker] Failed to precache asset:', asset, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches & take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Intercept Navigation and Assets (Cache-First with Navigation Fallback)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    try {
        const url = new URL(event.request.url);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    } catch (e) {
        return;
    }

    const isNavigation = event.request.mode === 'navigate' ||
                         event.request.destination === 'document' ||
                         (event.request.headers && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

    // Handle Navigation / Document Requests (iOS PWA launch & reload)
    if (isNavigation) {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If exact request match failed, check index.html or root in cache
                return caches.match('./index.html').then((indexFallback) => {
                    if (indexFallback) {
                        return indexFallback;
                    }
                    return caches.match('./').then((rootFallback) => {
                        if (rootFallback) {
                            return rootFallback;
                        }
                        // Try network as last resort
                        return fetch(event.request);
                    });
                });
            }).catch(() => {
                return caches.match('./index.html').then((fallback) => {
                    return fallback || caches.match('./');
                });
            })
        );
        return;
    }

    // Subresources (CSS, JS, images, audio, etc.) - Cache First, Network Fallback
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache).catch(() => {
                            // Suppress cache write error for non-standard responses
                        });
                    });

                    return networkResponse;
                })
                .catch((error) => {
                    console.error('[Service Worker] Network request failed for asset:', event.request.url, error);
                });
        })
    );
});
