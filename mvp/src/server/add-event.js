// node server/add-event.js [ruta-a-json]; con el servidor abierto. No expone la clave en la app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const key = process.env.ADMIN_TOKEN || fs.readFileSync(path.join(process.env.NODO_DATA_DIR || base,'admin.key'),'utf8').trim();
const sample = {
  title: `Actividad de prueba ${new Date().toLocaleTimeString('es-AR')}`,
  department: 'diit', career: 'Ingeniería en Informática',
  startsAt: new Date(Date.now() + 11*86400000).toISOString(),
  place: 'Laboratorio (simulado)',
  description: 'Actividad de demostración para comprobar entrega de notificaciones, navegación a la ficha y recordatorio. No corresponde a una publicación oficial de la UNLaM.',
  sourcePublishedAt: new Date().toISOString(),
  sourceUrl: 'https://www.unlam.edu.ar/',
  registrationUrl: null, reviewed: true, demo: true
};
const data = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2],'utf8')) : sample;
const url = `${process.env.NODO_SERVER_URL || 'http://127.0.0.1:3000'}/api/admin/events`;
const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(data)});
const result = await response.json();
console.log(response.ok ? `Evento creado: ${result.event.id} · avisos en cola: ${result.pending}` : `Error (${response.status}): ${result.error}`);
if (!response.ok) process.exitCode = 1;
