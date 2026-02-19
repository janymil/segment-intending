const CACHE_NAME = 'segment-intending-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/smart-detect.js',
    '/translations.js',
    '/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Interactive Notification Actions
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const action = event.action;

    if (action === 'start-segment') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                if (clientList.length > 0) {
                    clientList[0].focus();
                    clientList[0].postMessage({ type: 'START_SEGMENT' });
                } else {
                    clients.openWindow('/');
                }
            })
        );
    } else if (action === 'snooze') {
        // Snooze for 10 minutes
        setTimeout(() => {
            self.registration.showNotification('Segment Intending ⏰', {
                body: 'Reminder snoozed — time to set your intention!',
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: 'snooze-reminder',
                actions: [
                    { action: 'start-segment', title: '✨ Set Intention' },
                    { action: 'dismiss', title: '✕ Dismiss' }
                ]
            });
        }, 10 * 60 * 1000);
    }
    // 'dismiss' action — notification was already closed above
});
