
const CACHE_NAME = 'v-nus-neural-cache-v1';
const NEURAL_ASSETS = [
  'https://huggingface.co/',
  'https://unpkg.com/@ffmpeg/',
  'https://cdn.jsdelivr.net/npm/@mediapipe/'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Estratégia Cache-First para modelos de IA e Libs pesadas
  const isNeuralAsset = NEURAL_ASSETS.some(domain => url.startsWith(domain));
  
  if (isNeuralAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
