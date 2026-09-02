const CACHE_NAME = 'clueless-closet-v1';

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
    './assets/images/header.gif',
    './assets/images/models/modelo_isa_1.png',
    './assets/images/more/josh.jpeg',
    './assets/images/more/Isa.png',
    './assets/images/more/Tai.jpeg',
    './assets/images/more/Travis.png',
    './assets/audio/lclick-13694.mp3',
    './assets/audio/mixkit-winning-chimes-2015.wav',
    './assets/audio/mixkit-wrong-long-buzzer-954.wav',
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

// Install Event - Precache essential static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching essential assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches
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

// Fetch Event - Cache First, Network Fallback with Dynamic Caching
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                })
                .catch((error) => {
                    console.error('[Service Worker] Network request failed:', error);
                });
        })
    );
});
