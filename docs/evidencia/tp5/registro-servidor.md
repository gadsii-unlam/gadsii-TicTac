# Extracto del registro del servidor (29/10 – 3/11)

Extracto de la base del servidor de la prueba (<https://nodounlam.zabalgoitia.ar>), filtrado a los tres dispositivos de la prueba. Se excluyen los perfiles de prueba del equipo.

- El identificador de cada dispositivo se reemplazó por U1, U2 o U3.
- No se incluyen endpoints, claves de suscripción ni el archivo `db.json`.
- El servidor guarda las horas en UTC. Acá están convertidas a hora argentina (UTC−3).
- Se omiten las aperturas repetidas de una ficha ya abierta en la misma sesión.

## Eventos (`events`)

`createdAt` y `publishedAt` coinciden: los dos son el momento de la carga en Nodo, no el de la publicación original. La app usa `publishedAt` para el texto "Publicado hace…".

| Evento | `career` | Carga en Nodo | Publicación de la fuente (`sourcePublishedAt`) | Inicio (`startsAt`) |
|---|---|---|---|---|
| ExpoProyecto 2026 (22.ª edición) | `""` | 29/10 21:35:06 (al arrancar) | 21/10 16:47 | 28/10 18:00 |
| Charla abierta: ¿Cuánto vale tu idea? | `""` | 29/10 21:35:06 (al arrancar) | 16/10 16:30 | 21/10 19:00 |
| Tres eventos de Ciencias de la Salud | `""` | 29/10 21:35:06 (al arrancar) | — | — |
| **E1** Capacitación: Tecnologías Aplicadas a la Comunicación Digital | `""` | 30/10 12:52:21 (cargador manual) | 20/10 14:26 | 3/11 18:30 |
| **E2** Capacitación: Eficiencia Energética | `""` | 30/10 15:05:12 (cargador manual) | 20/10 14:26 | 2/11 19:00 |
| **E3** Cierre de convocatoria: Becas Doctorales CICPBA | `""` | 30/10 16:10:09 (cargador manual) | 26/10 15:15 | 30/10 23:59 |

## Perfiles (`profiles`)

| Dispositivo | Departamento y carrera | Frecuencia | Suscripción |
|---|---|---|---|
| U1 | DIIT · Ingeniería en Informática | `instantanea` | Web Push, 30/10 12:32:41 |
| U2 | DIIT · Ingeniería en Informática | `semanal` | Web Push, 30/10 12:33:08 |
| U3 | DIIT · Ingeniería en Informática | `instantanea`; `diaria` desde el 30/10 17:52:00 | Web Push, 30/10 12:33:15 |

Los tres tienen `alerts: true` y `explore: false` ("Recordarme revisar la app" apagado, que es el valor por defecto).

## Cola de avisos (`queued`)

Para U1 y U3, cada aviso salió en la siguiente pasada del scheduler, que corre cada 30 segundos. Para U2, los tres quedaron en cola hasta el corte semanal.

| Dispositivo | Evento | Encolado | Salió de la cola |
|---|---|---|---|
| U2 | E1 | 30/10 12:52:21 | 2/11 16:00:24, en el resumen |
| U2 | E2 | 30/10 15:05:12 | 2/11 16:00:24, en el resumen |
| U2 | E3 | 30/10 16:10:09 | 2/11 16:00:24, en el resumen; el evento había cerrado el 30/10 a las 23:59 |

## Envíos (`deliveries`)

`push_accepted` significa que el servicio de push aceptó el paquete (HTTP 201). No confirma que la persona lo haya visto. `marginHours` es el tiempo que faltaba para el inicio del evento al momento del envío.

| Hora | Dispositivo | Tipo | Evento | Título y texto | Estado | `marginHours` |
|---|---|---|---|---|---|---|
| 30/10 12:52:38 | U1 | `new` | E1 | Nuevo evento de tu carrera — Capacitación: Tecnologías Aplicadas a la Comunicación Digital | `push_accepted` | 101,6 |
| 30/10 12:52:38 | U3 | `new` | E1 | ídem | `push_accepted` | 101,6 |
| 30/10 15:05:38 | U1 | `new` | E2 | Nuevo evento de tu carrera — Capacitación: Eficiencia Energética | `push_accepted` | 75,9 |
| 30/10 15:05:38 | U3 | `new` | E2 | ídem | `push_accepted` | 75,9 |
| 30/10 16:10:38 | U1 | `new` | E3 | Nuevo evento de tu carrera — Cierre de convocatoria: Becas Doctorales CICPBA | `push_accepted` | 7,8 |
| 30/10 16:10:38 | U3 | `new` | E3 | ídem | `push_accepted` | 7,8 |
| 2/11 16:00:24 | U2 | `digest` | E1 (+ E2 y E3) | 3 eventos de tu carrera — Capacitación: Tecnologías Aplicadas a la Comunicación Digital y 2 más | `push_accepted` | 26,5 para E1; E2 empezaba en 3,0 h; E3 había cerrado hacía 64 h |
| 2/11 18:30:14 | U1 | `reminder` | E1 | Tu evento se acerca — Capacitación: Tecnologías Aplicadas a la Comunicación Digital · mañana o dentro de las próximas 24 h | `push_accepted` | 24,0 |
| 2/11 18:30:14 | U3 | `reminder` | E1 | ídem | `push_accepted` | 24,0 |

No hubo envíos rechazados ni errores de push para estos tres dispositivos.

## Aperturas (`opens`)

El origen es `push` cuando la ficha se abrió desde una notificación, y `feed` cuando se abrió desde Inicio o desde otra lista.

| Hora | Dispositivo | Evento | Origen |
|---|---|---|---|
| 30/10 12:45:20 | U3 | ExpoProyecto | `feed` |
| 30/10 12:52:55 | U1 | E1 | `push` |
| 30/10 12:53:05 | U3 | E1 | `push` |
| 30/10 12:58:10 | U2 | ExpoProyecto | `feed` |
| 30/10 13:01:25 | U2 | E1 | `feed` |
| 30/10 15:20:12 | U1 | E2 | `push` |
| 30/10 16:25:40 | U3 | E3 | `push` |
| 2/11 18:31:02 | U1 | E1 | `push` (recordatorio) |
| 2/11 18:36:10 | U3 | E1 | `push` (recordatorio) |
| 2/11 18:42:27 | U2 | E1 | `push` (resumen) |

## Recordatorios (`reminders`)

| Dispositivo | Evento | Creado | Enviado (`sentAt`) |
|---|---|---|---|
| U3 | E1 | 30/10 12:53:40 | 2/11 18:30:14 |
| U1 | E1 | 30/10 12:56:21 | 2/11 18:30:14 |

## Qué se puede leer y qué no

- **Sí se puede leer:** cuándo se cargó cada evento, cuándo salió cada aviso, con qué margen y si la ficha se abrió desde la notificación.
- **No se puede leer:**
  - Si la persona vio una notificación que no abrió: U1 descartó E3 y U3 descartó E2, y eso sale de la segunda sesión.
  - Si tocó "Inscribirme": el MVP no lo registra.
  - Si ya conocía el evento. Por eso la métrica 1 necesita la pregunta de la segunda sesión.
- **Aperturas desde la notificación, contrastadas con la observación:** el criterio de usabilidad de la Parte 1 pide contrastar lo observado con estas aperturas. Los tres usuarios abrieron al menos una ficha desde una notificación (U1 y U3 el 30/10, U2 el 2/11).
