# TP5 — Parte 2: Construcción del MVP de Nodo UNLaM

> **Estado:** implementación preparada y probada localmente a nivel de API y lógica de envío; **pendiente** probar Web Push en dispositivos reales y contar con URL HTTPS pública. **Desviación conocida:** PWA móvil/web en lugar de React Native previsto en el TP3. Ver el README antes de afirmar conformidad completa.

## 1. Del TP3 al software

| Compromiso del TP3 | Implementación | Construido o simulado |
|---|---|---|
| 2.1 Alertas directas al teléfono, según segmento y frecuencia | `server/scheduler.js` identifica eventos nuevos filtrados por departamento/carrera; `server/push.js` cifra Web Push con VAPID; `public/sw.js` muestra notificaciones y navega a la ficha. Admite cada evento, resumen diario o semanal. | **Construido**. La entrega final depende de navegador/permiso, HTTPS, servicio externo de push y servidor encendido. No se usa una imagen que imite un push. |
| 2.2 Repositorio centralizado de eventos | `server/store.js` persiste eventos, preferencias y registros en JSON; `/api/events` devuelve solo los correspondientes al usuario; `public/app.js` muestra listado responsive. | **Construido**. Persistencia local de MVP, no escalable a producción sin cambios. |
| 2.3 Selección de departamento y carrera | Onboarding sin cuenta, configuración editable y validación de combinaciones admitidas; filtros tanto en API como en cola de avisos. | **Construido**. La carrera es elegida libremente por el estudiante, no validada con Intraconsulta. |
| 2.4 Detectar y cargar un evento dentro de 48 horas | El equipo monitorea fuentes y ejecuta `npm run add:event -- archivo.json` tras doble verificación; `sourcePublishedAt` registra hora de publicación original, `createdAt` hora de carga. | **Simulado manualmente**: no scraper, conexión a la universidad ni importación automática de redes. La **creación en base y disparo posterior del aviso sí son código real**. |
| 2.5 Ficha canónica completa | Detalle de fecha, hora, lugar, descripción y eventual enlace externo; el contenido se proporciona manualmente y se valida. | **Construido** el flujo de consulta; **simulado manualmente** el origen de datos. |
| Recordatorio 1 día antes | `/api/reminder` almacena la decisión del alumno. Scheduler envía el aviso cuando faltan ≤24 horas y la fecha aún es futura. | **Construido**. Requiere suscripción Web Push y servidor disponible al cumplirse el plazo. |

El recorrido **notificación → ficha completa → recordatorio o enlace externo** mantiene la Estructura B del TP3. El repositorio de eventos sigue accesible como alternativa, pero no se impone antes de la ficha. Todos los ejemplos iniciales se presentan como **ficticios**, no como eventos reales de la universidad.

## 2. Correcciones aceptadas del TP4B (RooMeet)

| Hallazgo aceptado | Cómo se incorporó |
|---|---|
| Ambigüedad en “Recordarme” | Texto explícito “Te avisamos 1 día antes del evento”, confirmado al activarlo. La UI refleja el estado guardado; recordatorio programado, no un efecto visual. |
| Botón “Descubrir” redundante en la ficha | Se retiró: solo queda “← Volver a Inicio”. |
| Cambio de carrera/departamento | Dos selectores editables desde Configuración, con actualización real de filtro y avisos pendientes. |
| Falta de confirmación/permiso tras onboarding | Cuadro explicativo en Inicio tras guardar perfil; pide permiso nativo **solo si el alumno acepta**. Si lo rechaza se explica cómo activarlo después. |
| “Recordatorio de exploración de eventos” poco claro | Etiqueta “Recordarme revisar la app”, desactivado por defecto para evitar saturar. Es independiente del recordatorio por evento. |
| Frecuencia de alertas principales mal ubicada | Selector **Cada evento nuevo / Resumen diario / Resumen semanal** corresponde a los nuevos eventos; el aviso opcional de revisión tiene su propio selector. |
| Tarjetas no tocables en mobile | Toda la tarjeta del feed permite ingresar, incluido teclado; el botón de texto es una pista visual. En escritorio también se habilitó (beneficio sin nuevo paso). |

**Hallazgos cuestionados del TP4:** no se construyó feed interdepartamental, pantalla “+ Evento” dentro del alumno ni panel administrativo de vista previa. Se mantiene la carga con revisión doble **externa a la app**. Una persona del equipo debe validar el JSON y la fuente original antes de ejecutar el comando; el servidor exige `reviewed: true`, lo cual por sí solo **no acredita** que esa revisión humana realmente ocurrió.

## 3. Arquitectura y decisiones técnicas

- **Frontend:** PWA responsive (`public/index.html`, `app.js`, `styles.css`) con service worker, manifest instalable y navegación por URL `/?evento=<id>`. Sin login/registro institucional.
- **Backend:** servidor HTTP en Node.js sin librerías de terceros (`server/index.js`). Endpoints limitados al perfil local, catálogo y fichas filtradas, suscripción push, recordatorio y aperturas. Endpoint administrativo con secreto en archivo excluido de Git.
- **Persistencia:** `server/data/db.json` mediante escrituras atómicas locales. Claves VAPID P-256 generadas y almacenadas en `server/data/vapid.json`, mantenidas entre reinicios. No apta sin modificaciones para varios procesos/instancias simultáneos.
- **Notificaciones:** Web Push real, implementado con las primitivas criptográficas nativas de Node (`aes128gcm` RFC 8291 y autorización VAPID RFC 8292) en `server/push.js`. No depende de Firebase/Expo. Navegador/OS pueden rechazar solicitudes o silenciar notificaciones; la API de push solo informa aceptación por parte de su servidor intermediario.
- **Frecuencias:** cola por dispositivo; envío inmediato al cargar, o resumen en primer ciclo del scheduler a partir de 19:00 UTC cada día/lunes. Un usuario puede desactivar alertas, cambiar carrera o frecuencia; eso modifica qué se despacha. Recordatorios por evento se programan en las últimas 24 h. La revisión periódica es optativa y separada.
- **Discrepancia técnica respecto del TP3:** React Native se había planificado, pero se eligió PWA + Node para ejecutar el MVP sin dependencias externas en este entorno. **Esto requiere aprobación del equipo/docente; no equivale a haber implementado React Native.** El comportamiento clave sí se implementó; para una entrega estricta con ese framework habría que portarlo.
- **Limitaciones:** no hay notificaciones en segundo plano si el navegador no soporta Web Push/permiso, no hay instancia HTTPS publicada, no hay Intraconsulta, scrapers, datos de usuarios institucionales ni inscripción propia; no está diseñada para disponibilidad 24/7 ni carga elevada.

## 4. Evidencia técnica disponible

`npm test` ejecuta pruebas de perfil, segmentación, carga con revisión, registro de aperturas, scheduler inmediato, resúmenes y **cifrado real del cuerpo del push más verificación de la firma VAPID**. Se puede usar `npm run demo:event` mientras el servidor está iniciado para crear automáticamente la cola al cargar un evento. `README.md` documenta reproducción y compatibilidad.

La base registra: `sourcePublishedAt`, `createdAt`, evento/segmento, `deliveries` (estado de solicitud a proveedor y margen temporal), `opens` (apertura desde aviso o feed) y recordatorios. Estos registros permiten reconstruir oportunidades de medición, **pero no sustituyen** los datos observados por el equipo sobre visualización, interés o asistencia.

La prueba en navegador gráfico quedó impedida por una política del entorno de ejecución (`ERR_BLOCKED_BY_ADMINISTRATOR` para navegación Chromium), aunque los endpoints responden por HTTP local. **No se afirma haber validado la experiencia visual o la recepción de un push en Android/iOS**; deben comprobarse antes de la sesión con usuarios.

## 5. Antes de avanzar a la Parte 3

1. TicTac revisa y aprueba los umbrales de `docs/TP5-parte1.md`, como exige la consigna académica.
2. Despliega la app en HTTPS, en una única instancia que conserve la carpeta `server/data/`, y verifica notificaciones reales en teléfonos compatibles con permisos del sistema.
3. Reemplaza los ejemplos ficticios por publicaciones reales verificadas y cargadas manualmente dentro de 48 h, con doble revisión.
4. Prepara las sesiones y registra pruebas con tres estudiantes reales; los resultados y la evaluación de hipótesis pertenecen a las siguientes partes del TP5, no a este documento.
