import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';
import { loadVapid, vapidPublicKey } from './push.js';
import { makeScheduler } from './scheduler.js';
import { DEPARTMENTS } from './catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.resolve(process.env.NODO_DATA_DIR || path.join(root, 'server', 'data'));
const store = createStore({ file: path.join(dataDir, 'db.json') });
const vapid = loadVapid(dataDir);
const secretFile = path.join(dataDir, 'admin.key');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
const adminKey = process.env.ADMIN_TOKEN || fs.readFileSync(secretFile, 'utf8').trim();
const scheduler = makeScheduler(store, vapid);
const mediaDirs = [path.join(dataDir, 'media'), path.join(root, 'server', 'media')];
const MEDIA_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
  .split(',').map(origin => origin.trim()).filter(Boolean));
const clientIdOk = s => typeof s === 'string' && /^[a-zA-Z0-9_-]{12,128}$/.test(s);
const bad = (msg, code = 400) => { const err = new Error(msg); err.status = code; throw err; };
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve,reject)=>{
    let txt = '';
    req.on('data', chunk => { txt += chunk; if (txt.length > 64000) { reject(Object.assign(new Error('Solicitud demasiado grande'), { status: 413 })); req.destroy(); } });
    req.on('end',()=>{ try { resolve(JSON.parse(txt)); } catch { reject(Object.assign(new Error('JSON inválido'), { status: 400 })); } });
    req.on('error',reject);
  });
}
function validDevice(value) { if (!clientIdOk(value)) bad('Identificador de dispositivo inválido'); return value; }
async function api(req, res, url) {
  const device = url.searchParams.get('deviceId');
  if (req.method === 'GET' && url.pathname === '/api/config') return json(res,200, { departments: DEPARTMENTS, vapidPublicKey: vapidPublicKey(vapid) });
  if (req.method === 'GET' && url.pathname === '/api/profile') {
    validDevice(device); return json(res,200, { profile: store.profileFor(device) && publicProfile(store.profileFor(device)) });
  }
  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    const data = await readJson(req); validDevice(data.deviceId);
    const p = store.updateProfile(data.deviceId,data);
    return json(res,200, { profile: publicProfile(p) });
  }
  if (req.method === 'POST' && url.pathname === '/api/subscribe') {
    const data = await readJson(req); validDevice(data.deviceId);
    if (data.subscription === null) store.detachSubscription(data.deviceId);
    else store.attachSubscription(data.deviceId, data.subscription);
    return json(res,200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/events') {
    validDevice(device);
    const department = url.searchParams.get('department');
    if (department === null) return json(res,200, { events: store.eventsFor(device) });
    if (!DEPARTMENTS[department]) bad('Departamento inválido');
    return json(res,200, { events: store.eventsByDepartment(department) });
  }
  if (req.method === 'GET' && /^\/api\/events\/[0-9a-f-]{36}$/i.test(url.pathname)) {
    validDevice(device); const eid = url.pathname.split('/').at(-1);
    const event = store.findEvent(eid);
    return json(res,event ? 200 : 404, event ? {event} : {error:'Evento no disponible'});
  }
  if (req.method === 'POST' && url.pathname === '/api/reminder') {
    const data = await readJson(req); validDevice(data.deviceId);
    if (typeof data.enabled !== 'boolean') bad('enabled debe ser booleano');
    store.markReminder(data.deviceId,data.eventId,data.enabled);
    return json(res,200,{ok:true});
  }
  if (req.method === 'GET' && url.pathname === '/api/reminders') {
    validDevice(device);
    return json(res,200,{eventIds:store.data.reminders.filter(r=>r.deviceId===device).map(r=>r.eventId),events:store.reminderEventsFor(device)});
  }
  if (req.method === 'POST' && url.pathname === '/api/analytics/open') {
    const data = await readJson(req); validDevice(data.deviceId);
    const ok = store.trackOpen(data.deviceId,data.eventId,data.source);
    return json(res,ok?200:404,{ok});
  }
  if (req.method === 'POST' && url.pathname === '/api/admin/events') {
    const bearer = req.headers.authorization || '';
    const candidate = bearer.startsWith('Bearer ') ? bearer.slice(7) : '';
    const a = Buffer.from(candidate), b = Buffer.from(adminKey);
    if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) bad('No autorizado',401);
    const data = await readJson(req);
    const event = store.addEvent(data);
    // La carga se hace a mano; la publicación en la base activa el envío automático.
    scheduler.tick().catch(err => console.error('Error enviando alertas:', err));
    return json(res,201,{event, pending:store.data.queued.length});
  }
  bad('Ruta no encontrada',404);
}
function serveMedia(res, name) {
  const file = mediaDirs.map(dir => path.join(dir, name)).find(candidate => fs.existsSync(candidate));
  if (!file) return json(res,404,{error:'Imagen no encontrada'});
  res.writeHead(200, { 'Content-Type': MEDIA_TYPES[name.split('.').pop().toLowerCase()], 'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'cross-origin' });
  fs.createReadStream(file).pipe(res);
}
function publicProfile(p) {
  return { deviceId:p.deviceId,department:p.department,career:p.career,
    frequency:p.frequency,alerts:p.alerts,explore:p.explore,exploreFrequency:p.exploreFrequency,
    subscribed:Boolean(p.subscription) };
}
const server = http.createServer(async (req,res)=>{
  try {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(origin && !allowedOrigins.has(origin) ? 403 : 204);
      res.end();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    const media = req.method === 'GET' && url.pathname.match(/^\/media\/([A-Za-z0-9._-]{1,100}\.(?:jpe?g|png|webp))$/i);
    if (media) serveMedia(res, media[1]);
    else if (url.pathname.startsWith('/api/')) await api(req,res,url);
    else json(res,404,{error:'Ruta no encontrada'});
  } catch(err) {
    if (!res.headersSent) json(res,err.status || 500,{error:err.status ? err.message : 'Error del servidor'});
    console.error(err.status ? `API ${err.status}: ${err.message}` : err);
  }
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso. Cerrá el proceso que lo está usando o elegí otro puerto en PowerShell con: $env:PORT=3001; npm start`);
    process.exitCode = 1;
    return;
  }
  throw err;
});
server.listen(PORT, () => {
  console.log(`Nodo UNLaM disponible en http://localhost:${PORT} (usar HTTPS en dispositivos externos)`);
  setInterval(() => scheduler.tick().catch(console.error), 30_000).unref();
  // Un reinicio no descarta avisos pendientes; el scheduler los reintenta.
  scheduler.tick().catch(console.error);
});
