import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { DEPARTMENTS, FREQUENCIES, validProfile, matches } from './catalog.js';

// fileURLToPath maneja correctamente las unidades de Windows (C:\\...), a diferencia de URL.pathname.
const dir = path.resolve(process.env.NODO_DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data'));
const dbPath = path.join(dir, 'db.json');
export const id = () => crypto.randomUUID();
const isoPlus = (days) => new Date(Date.now() + days * 86400000).toISOString();
const addHours = (n) => new Date(Date.now() + n * 3600000).toISOString();

function seed() {
  const examples = [
    { title: 'Taller introductorio de ciberseguridad', department: 'diit', career: 'Ingeniería en Informática', startsAt: isoPlus(12), place: 'Laboratorio de informática (ejemplo)', description: 'Actividad de demostración: resolución de ejercicios básicos de seguridad en redes, intercambio de ideas y espacio para consultas. No corresponde a un evento oficial confirmado.', registrationUrl: 'https://www.unlam.edu.ar/' },
    { title: 'Charla sobre inteligencia artificial responsable', department: 'diit', career: 'Ingeniería en Informática', startsAt: isoPlus(16), place: 'Aula de conferencias (ejemplo)', description: 'Evento ficticio para probar una ficha completa: charlas, preguntas y casos prácticos sobre el impacto de la IA en distintas áreas. Consultar siempre la fuente oficial antes de asistir.', registrationUrl: null },
    { title: 'Encuentro de proyectos tecnológicos', department: 'diit', career: '', startsAt: isoPlus(18), place: 'Hall del DIIT (ejemplo)', description: 'Encuentro ficticio de presentación de proyectos de diferentes carreras del departamento, con intercambio entre estudiantes.', registrationUrl: null },
    { title: 'Jornada de comunicación y medios', department: 'humanidades', career: 'Comunicación Social', startsAt: isoPlus(14), place: 'Aula de Humanidades (ejemplo)', description: 'Evento ficticio para verificar que el filtrado entre departamentos excluya avisos ajenos al perfil.', registrationUrl: null }
  ];
  return { version: 1, profiles: {}, events: examples.map(e => ({ ...e, id: id(), demo: true, publishedAt: addHours(-12), sourcePublishedAt: addHours(-20), createdAt: addHours(-12), reviewed: true })),
    queued: [], reminders: [], deliveries: [], opens: [] };
}

export function createStore({ file = dbPath, fresh = false } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let db = (!fresh && fs.existsSync(file)) ? JSON.parse(fs.readFileSync(file, 'utf8')) : seed();
  function save() {
    // Recuperar el directorio si fue omitido por la extracción del ZIP o se eliminó.
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  if (!fs.existsSync(file) || fresh) save();
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
    if (!subscription || typeof subscription.endpoint !== 'string' || !/^https:\/\//.test(subscription.endpoint) ||
      typeof subscription.keys?.p256dh !== 'string' || typeof subscription.keys?.auth !== 'string') {
      throw Object.assign(new Error('Suscripción push inválida'), { status: 400 });
    }
    db.profiles[deviceId].subscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } };
    db.profiles[deviceId].subscribedAt = new Date().toISOString(); save();
    return true;
  }
  function detachSubscription(deviceId) {
    if (db.profiles[deviceId]) delete db.profiles[deviceId].subscription;
    save();
  }
  function eventsFor(deviceId) {
    return db.events.filter(e => Date.parse(e.startsAt) > Date.now() && matches(e, profileFor(deviceId))).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
  }
  function addEvent(data) {
    const { title, department, career, startsAt, place, description, registrationUrl, sourceUrl, sourcePublishedAt, reviewed, demo = false } = data ?? {};
    const trimmed = v => typeof v === 'string' ? v.trim() : '';
    if (!trimmed(title) || title.length > 170 || !DEPARTMENTS[department] ||
      (career && !DEPARTMENTS[department].careers.includes(career)) || !Number.isFinite(Date.parse(startsAt)) ||
      Date.parse(startsAt) <= Date.now() || !trimmed(place) || !trimmed(description) || description.length > 4000 ||
      !Number.isFinite(Date.parse(sourcePublishedAt)) || !reviewed ||
      (!demo && !/^https:\/\//.test(sourceUrl || '')) ||
      (registrationUrl && !/^https:\/\//.test(registrationUrl))) {
      throw Object.assign(new Error('Evento inválido: revisar campos, fuente HTTPS, fecha futura y aprobación de segunda revisión'), { status: 400 });
    }
    const now = new Date().toISOString();
    const event = { id: id(), title: trimmed(title), department, career: career || '', startsAt: new Date(startsAt).toISOString(),
      place: trimmed(place), description: trimmed(description), registrationUrl: registrationUrl || null,
      sourceUrl: sourceUrl || null, sourcePublishedAt: new Date(sourcePublishedAt).toISOString(),
      createdAt: now, publishedAt: now, reviewed: true, demo: Boolean(demo) };
    db.events.push(event);
    for (const p of Object.values(db.profiles)) {
      if (p.alerts && p.subscription && matches(event, p)) {
        db.queued.push({ id: id(), deviceId: p.deviceId, eventId: event.id, kind: 'new', createdAt: now });
      }
    }
    save(); return event;
  }
  function markReminder(deviceId, eventId, enabled) {
    if (!eventsFor(deviceId).some(e => e.id === eventId)) throw Object.assign(new Error('Evento no disponible'), { status: 404 });
    const existing = db.reminders.find(r => r.deviceId === deviceId && r.eventId === eventId);
    if (!enabled) db.reminders = db.reminders.filter(r => r !== existing);
    else if (!existing) db.reminders.push({ id: id(), deviceId, eventId, sentAt: null, createdAt: new Date().toISOString() });
    save(); return enabled;
  }
  function trackOpen(deviceId, eventId, source) {
    if (!eventsFor(deviceId).some(e => e.id === eventId)) return false;
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
    eventsFor, addEvent, markReminder, trackOpen, logDelivery, removeQueued, setReminderSent, setExploreSent };
}
