import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Publica los JSON de src/server/events (los mismos del cargador manual) en una base que todavía no los tiene.
// Es idempotente: omite los eventos que ya existen con el mismo título y fecha.
const eventsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'events');

export function seedEvents(store, { dir = eventsDir, log = console } = {}) {
  if (!fs.existsSync(dir)) return 0;
  let added = 0;
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      const startsAt = new Date(data.startsAt).toISOString();
      if (store.data.events.some(e => !e.demo && e.title === data.title && e.startsAt === startsAt)) continue;
      store.addEvent(data);
      added++;
    } catch (err) {
      log.error(`Evento ${name} omitido: ${err.message}`);
    }
  }
  return added;
}
