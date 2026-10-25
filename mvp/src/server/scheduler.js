import { dueBucket, hoursBefore, matches } from './catalog.js';
import { sendPush } from './push.js';

export function makeScheduler(store, vapidKeys, push = sendPush) {
  let running = false;
  async function notify(profile, payload, kind, eventId, nowMs) {
    if (!profile?.subscription) return false;
    try {
      const outcome = await push(profile.subscription, payload, vapidKeys);
      store.logDelivery({ deviceId: profile.deviceId, eventId, kind, status: outcome.status,
        statusType: outcome.ok ? 'push_accepted' : 'push_rejected',
        marginHours: eventId ? hoursBefore(store.data.events.find(e => e.id === eventId)?.startsAt, nowMs) : null });
      if ([404, 410].includes(outcome.status)) store.detachSubscription(profile.deviceId);
      return outcome.ok || [404, 410].includes(outcome.status);
    } catch (error) {
      store.logDelivery({ deviceId: profile.deviceId, eventId, kind, statusType: 'push_error', detail: String(error.message).slice(0, 120) });
      return false;
    }
  }
  async function tick(nowMs = Date.now()) {
    if (running) return;
    running = true;
    try {
      for (const p of Object.values(store.data.profiles)) {
        if (!p.subscription) continue;
        if (p.alerts) {
          const pending = store.data.queued.filter(q => q.deviceId === p.deviceId && store.data.events.some(e => e.id === q.eventId && matches(e, p)));
          if (p.frequency === 'instantanea') {
            for (const q of pending) {
              const e = store.data.events.find(event => event.id === q.eventId);
              const ok = await notify(p, { title: 'Nuevo evento de tu carrera', body: e.title, eventId: e.id, url: `/?evento=${encodeURIComponent(e.id)}` }, 'new', e.id, nowMs);
              if (ok) store.removeQueued([q.id]);
            }
          } else {
            const key = dueBucket(nowMs, p.frequency);
            if (key) {
              const cutoff = Date.parse(`${key}T19:00:00.000Z`);
              const ready = pending.filter(q => Date.parse(q.createdAt) <= cutoff);
              if (ready.length > 0) {
                const event = store.data.events.find(e => e.id === ready[0].eventId);
                const more = ready.length - 1;
                const ok = await notify(p, { title: more ? `${ready.length} eventos de tu carrera` : 'Nuevo evento de tu carrera',
                  body: more ? `${event.title} y ${more} más` : event.title, eventId: event.id,
                  url: `/?evento=${encodeURIComponent(event.id)}` }, 'digest', event.id, nowMs);
                if (ok) store.removeQueued(ready.map(q => q.id));
              }
            }
          }
        }
        for (const reminder of store.data.reminders.filter(r => r.deviceId === p.deviceId && !r.sentAt)) {
          const e = store.data.events.find(event => event.id === reminder.eventId);
          if (!e || !matches(e,p)) continue;
          const remaining = hoursBefore(e.startsAt, nowMs);
          if (remaining > 0 && remaining <= 24) {
            const ok = await notify(p, { title: 'Tu evento se acerca', body: `${e.title} · mañana o dentro de las próximas 24 h`,
              eventId: e.id, url: `/?evento=${encodeURIComponent(e.id)}` }, 'reminder', e.id, nowMs);
            if (ok) store.setReminderSent(reminder.id);
          }
        }
        if (p.explore && p.alerts) {
          const key = dueBucket(nowMs, p.exploreFrequency || 'semanal');
          if (key && `${p.exploreFrequency}:${key}` !== p.lastExploreKey) {
            const accepted = await notify(p, { title: 'Recordame revisar la app', body: 'Entrá a Nodo UNLaM para consultar eventos de tu carrera.', url: '/', eventId: null }, 'explore', null, nowMs);
            if (accepted) store.setExploreSent(p.deviceId, `${p.exploreFrequency}:${key}`);
          }
        }
      }
    } finally { running = false; }
  }
  return { tick };
}
