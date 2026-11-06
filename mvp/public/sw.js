// Service worker de Nodo UNLaM para notificaciones de escritorio (Web Push).
// El servidor envía { title, body, eventId, url } cifrado con aes128gcm.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Nodo UNLaM', {
    body: data.body || '',
    icon: '/favicon.ico',
    tag: data.eventId || undefined,
    data: { url: data.url || '/', eventId: data.eventId || null },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { url = '/', eventId } = event.notification.data || {};
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(item => new URL(item.url).origin === self.location.origin);
    if (client) {
      await client.focus();
      if (eventId) client.postMessage({ type: 'open-event', eventId });
      return;
    }
    await self.clients.openWindow(new URL(url, self.location.origin).href);
  })());
});
