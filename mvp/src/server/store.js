import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { DEPARTMENTS, CAREER_RENAMES, FREQUENCIES, validProfile, matches } from './catalog.js';

// fileURLToPath maneja correctamente las unidades de Windows (C:\\...), a diferencia de URL.pathname.
const dir = path.resolve(process.env.NODO_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data'));
const dbPath = path.join(dir, 'db.json');
export const id = () => crypto.randomUUID();
const isoPlus = (days) => new Date(Date.now() + days * 86400000).toISOString();
const addHours = (n) => new Date(Date.now() + n * 3600000).toISOString();
// Archivos de src/server/media (o <datos>/media) que sirve el propio servidor en /media/<archivo>.
const MEDIA_PATH = /^\/media\/[A-Za-z0-9._-]{1,100}\.(jpe?g|png|webp)$/i;
const MAX_IMAGES = 5;
const DEMO_IMAGES = {
  'Charla sobre inteligencia artificial responsable': ['/media/flyer-ia-principal.jpg', '/media/flyer-ia-charla.jpg']
};
// Lugar y descripción de los eventos de muestra (sin marcas de "ejemplo" ni "ficticio").
const DEMO_CONTENT = {
  'Taller introductorio de ciberseguridad': {
    place: 'Laboratorio de informática',
    description: 'Resolución de ejercicios básicos de seguridad en redes, intercambio de ideas y espacio para consultas.'
  },
  'Charla sobre inteligencia artificial responsable': {
    place: 'Aula de conferencias',
    description: 'Charlas, preguntas y casos prácticos sobre el impacto de la IA en distintas áreas. Consultar siempre la fuente oficial antes de asistir.'
  },
  'Encuentro de proyectos tecnológicos': {
    place: 'Hall del DIIT',
    description: 'Presentación de proyectos de diferentes carreras del departamento, con intercambio entre estudiantes.'
  },
  'Jornada de comunicación y medios': {
    place: 'Aula de Humanidades',
    description: 'Jornada de encuentro y debate sobre comunicación y medios.'
  }
};
const validImages = images => Array.isArray(images) && images.length <= MAX_IMAGES &&
  images.every(url => typeof url === 'string' && (MEDIA_PATH.test(url) || /^https:\/\/\S{1,500}$/.test(url)));

function seed() {
  const examples = [
    { title: 'Taller introductorio de ciberseguridad', department: 'diit', career: 'Ingeniería en Informática', startsAt: isoPlus(12), registrationUrl: 'https://www.unlam.edu.ar/' },
    { title: 'Charla sobre inteligencia artificial responsable', department: 'diit', career: 'Ingeniería en Informática', startsAt: isoPlus(16), registrationUrl: null, images: DEMO_IMAGES['Charla sobre inteligencia artificial responsable'] },
    { title: 'Encuentro de proyectos tecnológicos', department: 'diit', career: '', startsAt: isoPlus(18), registrationUrl: null },
    { title: 'Jornada de comunicación y medios', department: 'humanidades', career: 'Licenciatura en Comunicación Social', startsAt: isoPlus(14), registrationUrl: null }
  ].map(e => ({ ...e, ...DEMO_CONTENT[e.title] }));
  return { version: 1, profiles: {}, events: examples.map(e => ({ images: [], ...e, id: id(), demo: true, publishedAt: addHours(-12), sourcePublishedAt: addHours(-20), createdAt: addHours(-12), reviewed: true })),
    queued: [], reminders: [], deliveries: [], opens: [] };
}

export function createStore({ file = dbPath, fresh = false } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let db = (!fresh && fs.existsSync(file)) ? JSON.parse(fs.readFileSync(file, 'utf8')) : seed();
  // Bases anteriores a las imágenes: cada evento recibe su lista (los de demostración, sus flyers de ejemplo).
  const migrated = db.events.filter(e => !Array.isArray(e.images));
  for (const e of migrated) e.images = (e.demo && DEMO_IMAGES[e.title]) || [];
  // Eventos de muestra con la redacción anterior ("(ejemplo)", "ficticio"): pasan al texto actual.
  let reworded = 0;
  for (const e of db.events) {
    const content = e.demo && DEMO_CONTENT[e.title];
    if (content && (e.place !== content.place || e.description !== content.description)) {
      Object.assign(e, content);
      reworded++;
    }
  }
  // Carreras con el nombre anterior (perfiles y eventos) pasan al nombre oficial actual.
  let renamed = 0;
  for (const item of [...Object.values(db.profiles), ...db.events]) {
    if (CAREER_RENAMES[item.career]) { item.career = CAREER_RENAMES[item.career]; renamed++; }
  }
  function save() {
    // Recuperar el directorio si fue omitido por la extracción del ZIP o se eliminó.
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  if (!fs.existsSync(file) || fresh || migrated.length || renamed || reworded) save();
  function profileFor(deviceId) { return db.profiles[deviceId] ?? null; }
  function updateProfile(deviceId, data) {
    if (!validProfile(data)) throw Object.assign(new Error('Configuración de perfil inválida'), { status: 400 });
    const old = db.profiles[deviceId] || {};
    db.profiles[deviceId] = {
      ...old, deviceId, department: data.department, career: data.career,
      frequency: data.frequency, alerts: data.alerts, explore: data.explore,
      exploreFrequency: data.exploreFrequency === 'diaria' ? 'diaria' : 'semanal',
      updatedAt: new Date().toISOString()
    };
    // Un cambio de carrera o suspensión de avisos quita envíos anteriores ya no pertinentes.
    db.queued = db.queued.filter(q => q.deviceId !== deviceId ||
      (db.profiles[deviceId].alerts && db.events.some(e => e.id === q.eventId && matches(e, db.profiles[deviceId]))));
    save(); return db.profiles[deviceId];
  }
  function attachSubscription(deviceId, subscription) {
    if (!profileFor(deviceId)) throw Object.assign(new Error('Primero configurar el perfil'), { status: 400 });
    if (subscription?.provider === 'expo') {
      if (typeof subscription.token !== 'string' ||
        !/^(Exponent|Expo)PushToken\[[^\]\s]{1,256}\]$/.test(subscription.token)) {
        throw Object.assign(new Error('Token de Expo Push inválido'), { status: 400 });
      }
      db.profiles[deviceId].subscription = { provider: 'expo', token: subscription.token };
      db.profiles[deviceId].subscribedAt = new Date().toISOString(); save();
      return true;
    }
    if (!subscription || typeof subscription.endpoint !== 'string' || !/^https:\/\//.test(subscription.endpoint) ||
      typeof subscription.keys?.p256dh !== 'string' || typeof subscription.keys?.auth !== 'string') {
      throw Object.assign(new Error('Suscripción push inválida'), { status: 400 });
    }
    db.profiles[deviceId].subscription = { provider: 'webpush', endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } };
    db.profiles[deviceId].subscribedAt = new Date().toISOString(); save();
    return true;
  }
  function detachSubscription(deviceId) {
    if (db.profiles[deviceId]) delete db.profiles[deviceId].subscription;
    save();
  }
  const isUpcoming = e => Date.parse(e.startsAt) > Date.now();
  const byStart = (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt);
  // Primero los próximos, del más cercano al más lejano; después los pasados, del más reciente al más antiguo.
  const chronological = list => [
    ...list.filter(isUpcoming).sort(byStart),
    ...list.filter(e => !isUpcoming(e)).sort((a, b) => byStart(b, a))
  ];
  function eventsFor(deviceId) {
    return chronological(db.events.filter(e => matches(e, profileFor(deviceId))));
  }
  // Todos los eventos de un departamento, de cualquier carrera (para explorar otros departamentos).
  function eventsByDepartment(department) {
    return chronological(db.events.filter(e => e.department === department));
  }
  function findEvent(eventId) { return db.events.find(e => e.id === eventId) ?? null; }
  function reminderEventsFor(deviceId) {
    const ids = new Set(db.reminders.filter(r => r.deviceId === deviceId).map(r => r.eventId));
    return db.events.filter(e => ids.has(e.id) && isUpcoming(e)).sort(byStart);
  }
  function addEvent(data) {
    const { title, department, career, startsAt, place, description, registrationUrl, noRegistration = false, sourceUrl, sourcePublishedAt, reviewed, demo = false, images = [] } = data ?? {};
    const trimmed = v => typeof v === 'string' ? v.trim() : '';
    if (!trimmed(title) || title.length > 170 || !DEPARTMENTS[department] ||
      (career && !DEPARTMENTS[department].careers.includes(career)) || !Number.isFinite(Date.parse(startsAt)) ||
      !trimmed(place) || !trimmed(description) || description.length > 4000 ||
      !Number.isFinite(Date.parse(sourcePublishedAt)) || !reviewed ||
      (!demo && !/^https:\/\//.test(sourceUrl || '')) ||
      (registrationUrl && !/^https:\/\//.test(registrationUrl))) {
      throw Object.assign(new Error('Evento inválido: revisar campos, fuente HTTPS y aprobación de segunda revisión'), { status: 400 });
    }
    if (!validImages(images)) {
      throw Object.assign(new Error(`Imágenes inválidas: hasta ${MAX_IMAGES}, cada una una URL HTTPS o un archivo /media/<nombre>.jpg|png|webp`), { status: 400 });
    }
    if (typeof noRegistration !== 'boolean') {
      throw Object.assign(new Error('noRegistration debe ser true o false'), { status: 400 });
    }
    if (noRegistration && registrationUrl) {
      throw Object.assign(new Error('Un evento que no requiere inscripción no puede tener enlace de inscripción'), { status: 400 });
    }
    const now = new Date().toISOString();
    const event = { id: id(), title: trimmed(title), department, career: career || '', startsAt: new Date(startsAt).toISOString(),
      place: trimmed(place), description: trimmed(description), registrationUrl: registrationUrl || null, noRegistration,
      sourceUrl: sourceUrl || null, sourcePublishedAt: new Date(sourcePublishedAt).toISOString(),
      images, createdAt: now, publishedAt: now, reviewed: true, demo: Boolean(demo) };
    db.events.push(event);
    // Un evento que ya ocurrió se publica en "pasados" pero no avisa a nadie.
    for (const p of isUpcoming(event) ? Object.values(db.profiles) : []) {
      if (p.alerts && p.subscription && matches(event, p)) {
        db.queued.push({ id: id(), deviceId: p.deviceId, eventId: event.id, kind: 'new', createdAt: now });
      }
    }
    save(); return event;
  }
  function markReminder(deviceId, eventId, enabled) {
    const event = findEvent(eventId);
    if (!event || (enabled && !isUpcoming(event))) throw Object.assign(new Error('Evento no disponible'), { status: 404 });
    const existing = db.reminders.find(r => r.deviceId === deviceId && r.eventId === eventId);
    if (!enabled) db.reminders = db.reminders.filter(r => r !== existing);
    else if (!existing) db.reminders.push({ id: id(), deviceId, eventId, sentAt: null, createdAt: new Date().toISOString() });
    save(); return enabled;
  }
  function trackOpen(deviceId, eventId, source) {
    if (!findEvent(eventId)) return false;
    db.opens.push({ deviceId, eventId, source: source === 'push' ? 'push' : 'feed', at: new Date().toISOString() });
    save(); return true;
  }
  function logDelivery(info) { db.deliveries.push({ ...info, at: new Date().toISOString() }); save(); }
  function removeQueued(ids) { db.queued = db.queued.filter(q => !ids.includes(q.id)); save(); }
  function setReminderSent(idToUpdate) {
    const r = db.reminders.find(r => r.id === idToUpdate);
    if (r) r.sentAt = new Date().toISOString(); save();
  }
  function setExploreSent(deviceId, key) {
    if (db.profiles[deviceId]) db.profiles[deviceId].lastExploreKey = key;
    save();
  }
  return { get data() { return db; }, save, profileFor, updateProfile, attachSubscription, detachSubscription,
    eventsFor, eventsByDepartment, findEvent, reminderEventsFor, addEvent, markReminder, trackOpen, logDelivery, removeQueued, setReminderSent, setExploreSent };
}
