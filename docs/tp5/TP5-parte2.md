# TP5 - Parte 2

### 2. Construcción del MVP

Construimos el scope definido en el TP3, sin agregar funcionalidades fuera de él, e incorporamos las correcciones del TP4B que aceptamos. El componente propio, la app Nodo UNLaM, está construido de verdad. Lo que el TP3 decidió simular se resuelve a mano por detrás, y el alumno no se entera.

#### Qué se construyó y qué se simula

| Elemento del TP3 | Qué quedó construido | Qué se simula o se resuelve a mano |
|---|---|---|
| Alertas al celular con frecuencia configurable | El backend corre un scheduler cada 30 segundos. Envía por Web Push (VAPID y cifrado aes128gcm) a la web y por Expo Push a Android e iOS. Frecuencias: Cada evento nuevo, Resumen diario y Resumen semanal. Recordatorio dentro de las 24 horas anteriores al evento. | Nada: el envío es automático una vez que el evento existe. |
| Repositorio centralizado de eventos | App React Native con Expo (la web se genera con React Native Web), API Node.js y base JSON persistente. Inicio separa próximos y pasados. Los otros departamentos se consultan desde el menú. | Nada. |
| Filtro por departamento y carrera | Configuración inicial sin registro, con el filtro aplicado en el backend. | El año no se pide: hoy el filtro es solo por departamento y carrera. |
| Detección y carga del evento | Un cargador manual (`add-event`) que valida los campos y exige fuente HTTPS y segunda revisión (`"reviewed": true`). | Se simula. El equipo monitorea los canales oficiales y carga el JSON a mano, con el compromiso de hacerlo dentro de las 48 horas. |
| Ficha completa | Fecha, lugar, descripción, carrusel de imágenes y botón "Inscribirme". | La información la tipea el equipo a partir de la publicación original. |
| Inscripción | Un enlace a la página externa (UNLaM Actividades u otra). | El módulo propio no se construye. |

#### Correcciones del TP4B

| Punto del TP4B | Condición | Cómo quedó en el MVP |
|---|---|---|
| Recordarme no explicaba cuándo avisa | Aceptado | Al activarlo aparece "Te avisaremos dentro de las 24 horas anteriores al evento." y el botón pasa a "Recordatorio activado". |
| "Descubrir" equivalía a "Inicio" | Aceptado | Se quitó el bloque "Explorá más eventos…" con su botón. La ficha vuelve a Inicio. |
| No se podía cambiar de carrera | Aceptado | El departamento y la carrera se cambian en Configuración. El filtro de Inicio tiene un acceso "Cambiar". |
| El onboarding no confirmaba nada ni pedía el permiso | Aceptado | El pop-up "¡Último paso!" confirma departamento y carrera, pide la frecuencia y activa las notificaciones. |
| "Recordatorio de exploración" era un término del sistema | Aceptado | Ahora se llama "Recordarme revisar la app" y viene apagado. |
| La frecuencia estaba en el recordatorio y no en la alerta | Aceptado | La alerta tiene sus tres frecuencias, y el recordatorio de revisar la app tiene la suya, aparte. |
| Solo "Ver ficha completa" navegaba | Aceptado en parte | Toda la tarjeta abre la ficha: encabezado, texto, imagen y pie. |
| Barra lateral de otros departamentos | Cuestionado | Inicio mantiene el foco en la carrera. Los otros departamentos tienen eventos reales y la aclaración "Estás viendo otro departamento. Tus avisos siguen siendo de tu carrera." |
| Pantalla "+ Evento" | Cuestionado | No está en la app del alumno. La carga se hace con el cargador manual. |
| Carga sin vista previa | Cuestionado; aceptamos el riesgo operativo | Otro integrante compara cada JSON con la publicación original antes de cargarlo. El equipo puede corregir o retirar un evento directamente en la base. |

#### Decisiones estructurales que resolvió la herramienta

Están en [prompts.md](prompts.md#decisiones-estructurales-que-resolvió-la-herramienta-tp5-parte-2), separadas de las que tomó el equipo. Las más relevantes para la prueba fueron:

- el horario fijo de los resúmenes;
- guardar solo la fecha de inicio de cada evento;
- calcular "Publicado hace…" desde la carga;
- usar un único título de alerta.

Cuatro de los siete problemas nuevos de la prueba salen de esas decisiones.

#### Despliegue para la prueba

El jueves 29/10 levantamos la API, la web y Caddy (HTTPS) con Docker Compose en <https://nodounlam.zabalgoitia.ar>, según [guia-despliegue.md](../guia-despliegue.md).

- Al arrancar, el servidor publicó los eventos reales de `mvp/src/server/events/`.
- Retiramos de la base los cuatro eventos de muestra que crea la primera ejecución. Parecen reales, porque no dicen "demo", y habrían contaminado la métrica 1.
- Los tres eventos de la prueba se cargaron durante la sesión con el cargador manual dentro del contenedor ([guia-cargar-eventos.md](../guia-cargar-eventos.md)). Tenían que cargarse después de la configuración inicial, porque el servidor solo encola avisos para los perfiles que ya existen.
- El 3/11 guardamos esos tres JSON en `mvp/src/server/events/` y sumamos a las dos capacitaciones los valores informados en UNLaM Actividades.

#### Pruebas automáticas

`npm test` corre 19 pruebas del backend. Cubren, entre otras cosas:

- perfil y filtro por carrera;
- ingesta manual validada;
- envío automático solo a la carrera que corresponde;
- resúmenes que se entregan solo en el corte;
- recordatorios;
- cifrado Web Push con VAPID;
- tokens de Expo Push vencidos;
- eventos pasados que no encolan avisos;
- publicación única de los eventos de `src/server/events/`.

#### Lo que el MVP no hace, sabido antes de la prueba

- No registra el toque en "Inscribirme". La Parte 1 prevé confirmarlo en la segunda sesión.
- No filtra por año, aunque la hipótesis dice "carrera y año".
- No tiene pantalla administrativa, por la decisión del TP4.
- No se integra con Intraconsulta, las redes ni el calendario académico.
