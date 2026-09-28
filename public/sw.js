self.addEventListener('push', (event) => {
  const message = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(message.title || 'Porchlight', {
    body: message.body || 'A Porchlight was turned on.',
    data: { url: message.url || '/' },
    icon: '/pwa-192x192.png',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});