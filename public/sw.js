const CACHE = 'nodo-unlam-shell-v1';
const OFFLINE = ['/', '/index.html', '/app.js', '/styles.css', '/logo.svg', '/icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(found => found || caches.match('/'))));
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: 'Nuevo evento', body: event.data?.text() || '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Nodo UNLaM', {
    body: data.body || 'Hay novedades de tu carrera.', icon: '/icon.svg', badge: '/icon.svg',
    data: { url: data.url || '/' }, tag: data.eventId ? `evento-${data.eventId}` : undefined,
    renotify: false
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const link = new URL(event.notification.data?.url || '/',self.location.origin);
  if (link.searchParams.has('evento')) link.searchParams.set('origen','push');
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = tabs.find(tab => new URL(tab.url).origin === link.origin);
    if (existing) { await existing.navigate(link.href); return existing.focus(); }
    return self.clients.openWindow(link.href);
  })());
});
