self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: data.url
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      // W przypadku plain text
      event.waitUntil(
        self.registration.showNotification('Powiadomienie TRUP', {
          body: event.data.text(),
          icon: '/icon-192.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});
