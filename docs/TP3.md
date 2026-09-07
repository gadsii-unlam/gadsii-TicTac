# TP3 — MVP: Nodo UNLaM

> Este documento define el MVP que testea la hipótesis de valor formulada en el TP2 y documentada en el brief.md: decide primero qué vale la pena construir, y recién después cómo se ve. Solo se diseña el mínimo necesario para aprender si la hipótesis es correcta.

---

## 1. Scope del MVP

### Incluido en el MVP

| Incluido en el MVP | Para qué parte de la hipótesis sirve |
|---|---|
| **Sistema de alertas/notificaciones directas al celular**, con frecuencia configurable (diaria o resumen semanal) | Es el corazón de la **Solución** ("se los empuja al celular... con antelación suficiente") y ataca directamente la causa de pérdida más marcada (15/20 "no vi la publicación"). Testea la **Evidencia medible**: bajar ese 75% a menos del 30%. La frecuencia configurable resuelve el supuesto #10 del brief (4/20 rechazan ser notificados) sin resignar el envío activo. |
| **Repositorio centralizado de eventos intradepartamentales** | Materializa la parte de la **Solución** que "centraliza los eventos" y responde a la única necesidad unánime del relevamiento (20/20 pidieron un único lugar), neutralizando la dispersión actual (3,7 canales por alumno, 8/20 perdidos por ella). |
| **Filtro y segmentación por departamento y carrera** | Sostiene la parte de la **Solución** que filtra "por su carrera y año" y corrige el **Problema** tal como quedó redefinido en el TP2: el interés es intradepartamental (3,60/5 propio vs. 2,20/5 ajeno, 0 alumnos priorizan lo ajeno). Es la barrera antisaturación para que el canal push no se silencie. |
| **Detección y carga del evento dentro de un plazo máximo de 2 días** desde que el DIIT o la universidad suben la publicación | Sostiene la **Solución** ("con antelación suficiente") y el motivo de inasistencia por oportunidad (11/20 "apareció demasiado cerca de la fecha"). Es el requisito operativo del lado del sistema para acercarse a la **Evidencia medible** del 80% de alertas con 7 días o más — sin confundir la latencia propia (2 días) con esa meta, que depende de cuándo publica la universidad. |
| **Carga de la ficha canónica con información completa del evento** | Sostiene la **Solución** ("con la información completa para decidir") y responde al supuesto nuevo #8 del brief (la calidad de la publicación es una barrera de decisión, U13, U22), evitando que el alumno deba cotejar con otros canales. |

### Excluido del MVP

| Excluido del MVP | Por qué se excluye |
|---|---|
| **Módulo de resolución de superposición horaria / compatibilidad de cursada** | Aunque apareció espontáneamente como barrera cualitativa (U12, U19), es un problema estructural de agenda académica y logística docente, no de comunicación. Agregaría complejidad técnica sin probar el circuito de llegada y antelación que sí se está testeando. |
| **Feed global o cartelera abierta de otros departamentos** | El interés interdepartamental quedó refutado en el grupo primario: ningún alumno prioriza eventos externos y 13/20 puntuaron 2 o menos. Incluirlo diluiría la propuesta de valor y contradice el foco en el propio departamento que sostiene la hipótesis. |
| **Módulo de inscripción integrado** | La hipótesis se acota a testear el impacto del flujo informativo (llegada a tiempo y ficha clara), no la conversión de inscripción. Al resolverse con un enlace externo dentro de la ficha, construir un motor propio sumaría costo sin ser el factor que valida si el alumno se enteró y decidió asistir. |
| **Integraciones complejas con plataformas de cursada (MIeL, Teams)** | Aunque 16/20 aceptarían Teams, el consumo habitual es predominantemente smartphone y redes (Instagram 16/20, WhatsApp 13/20 vs. Teams 3/20). Acoplarse a sistemas cerrados no valida la hipótesis central y retrasa el testeo del MVP en el entorno móvil natural del estudiante. |
| **Inicio de sesión / registro de cuenta (autenticación institucional)** | Para que la alerta y el filtro por departamento/carrera funcionen alcanza con que el alumno los configure en el dispositivo, sin identificarlo por cuenta ni credenciales. Se reevalúa si una siguiente versión necesita persistencia de cuenta entre dispositivos o funcionalidades administrativas. |

---

## 2. Qué se construye y qué se simula

> Condición: el componente de software propio (la aplicación Nodo UNLaM) tiene que estar construido de verdad. Solo se simula la ingesta de contenido desde fuentes externas — la integración con los canales donde hoy se publican los eventos —, no la experiencia que usa el alumno.

| Elemento | Se construye | Se simula / se resuelve a mano | Por qué |
|---|---|---|---|
| **2.1 Sistema de alertas/notificaciones directas al celular** | El motor de notificaciones push de la app móvil y web (React Native): disparo automático al detectar un evento nuevo que coincide con el departamento/carrera del alumno, recordatorio cuando se acerca la fecha de un evento marcado de interés, y la preferencia de frecuencia (diaria o resumen semanal). | No — el envío es 100% automático una vez que el evento existe en el sistema; lo manual está en cómo llega ese evento a la base (ver 2.4), no en el disparo de la alerta. | Es la funcionalidad core y el componente de software propio que la hipótesis pone a prueba directamente (15/20 "no vi la publicación"); por eso tiene que estar construido de verdad. |
| **2.2 Repositorio centralizado de eventos intradepartamentales** | La aplicación móvil y web (React Native) completa: pantalla de listado, base de datos y API que almacena y sirve los eventos. | No. | Es la app que el alumno descarga para recibir alertas y consultar eventos, y el destino al que lo lleva la notificación; sin esta pantalla construida no hay dónde consultar lo que la alerta anuncia. |
| **2.3 Filtro y segmentación por departamento y carrera** | La pantalla de onboarding donde el alumno elige departamento y carrera (guardado en su perfil) y la lógica de backend que filtra, según ese perfil, qué eventos y alertas le llegan. | No. | A los alumnos les interesa principalmente su propio departamento (3,60/5 contra 2,20/5 de lo ajeno); el filtro evita mezclar eventos ajenos y que el canal push se sature o se silencie. |
| **2.4 Detección y carga del evento** (< 2 días desde que el DIIT o la universidad suben la publicación) | Nada de detección automática — no hay scraper ni integración con la página de la universidad, Intraconsulta o redes sociales. | Se simula: el equipo monitorea manualmente los canales oficiales y carga el evento directamente en la base de datos dentro del compromiso de 2 días. | Es una integración con fuentes externas, no el componente propio; automatizarla llevaría semanas de desarrollo. Lo que testea la hipótesis es si el alumno reacciona a una alerta oportuna, no cómo se detecta el evento en origen. |
| **2.5 Carga de la ficha canónica con información completa del evento** | La pantalla de ficha de evento dentro de la app (fecha, hora, lugar, descripción y link de inscripción). | El equipo tipea manualmente la información completa al cargar el evento (mismo proceso manual que 2.4), en vez de extraerla automáticamente de una fuente externa. | Extraer y estructurar esa información automáticamente desde fuentes heterogéneas es una integración compleja que no aporta a validar la hipótesis; lo que se mide es si una ficha completa —aunque cargada a mano— mejora la decisión de asistencia. |

---

## 3. Flujo principal del MVP

**Flujo: recibir y consultar un evento relevante a tiempo, sin tener que buscarlo.**

Se describe como flujo disparado por la alerta (push) y no por la consulta activa, porque es el que testea directamente la hipótesis: 12 de 20 alumnos no buscan información sobre eventos por su cuenta, y el motivo de pérdida más marcado es "no vi la publicación" (15 de 20). El repositorio centralizado (punto 2.2) queda disponible como respaldo para quien sí quiera consultar por su cuenta, pero no es el recorrido que hay que validar.

0. *(Una sola vez, no es parte del recorrido recurrente)* El alumno descarga la app y configura su departamento y carrera.
1. El sistema detecta un evento nuevo de su departamento/carrera y le envía una notificación push al celular, según la frecuencia que eligió (diaria o resumen semanal).
2. El alumno toca la notificación y la app lo lleva directo a la ficha del evento, sin pasar por el listado general.
3. El alumno consulta la ficha completa: fecha, horario, lugar y los detalles necesarios para decidir si participar.
4. Si el evento requiere inscripción, el alumno se inscribe por el link externo presente en la ficha (la inscripción está fuera del scope del MVP).
5. Si todavía falta para la fecha del evento, el alumno puede activar un recordatorio adicional para 1 día* antes.

*Puede ser otro rango de tiempo, a definir.

---

## 4. Atributos de usabilidad priorizados

**Eficiencia** *(tiempo y esfuerzo mínimo para obtener la información)*

- **Por qué es prioritario:** el perfil del usuario se definió como "pasivo", apurado y con consumo meramente incidental mientras usa el celular para otra cosa. 12 de 20 no buscan información por su cuenta. Si la plataforma exige pasos de navegación, inicios de sesión engorrosos o búsquedas manuales, fracasa de inmediato.
- **Evidencia del TP2:** se necesita reducir al mínimo los clics entre la alerta y el dato. La hipótesis promete resolver la inscripción "a un toque desde esa misma alerta" porque el usuario no dedica tiempo formal a explorar eventos.

**Satisfacción** *(claridad, confiabilidad y utilidad percibida)*

- **Por qué es prioritario:** la percepción actual sobre los canales oficiales es deficiente (la eficiencia percibida promedió 2,50/5, con la mitad puntuándola en 1 o 2). El usuario manifiesta frustración explícita por publicaciones escasas, confusas o que no profundizan lo suficiente para decidir (U13, U22).
- **Evidencia del TP2:** para que el alumno rompa el techo de asistencia (actualmente clavado en 1,95/5 y con un máximo de 3), la ficha debe entregar información completa y canónica que le transmita valor real sin obligarlo a cotejar con WhatsApp o Instagram.

**Facilidad de recuerdo en el tiempo** *(memorabilidad)*

- **Por qué compite mejor que el aprendizaje:** el usuario consulta eventos de forma esporádica e incidental. No es un software que se use todos los días durante horas seguidas como un IDE de programación.
- **Evidencia del TP2:** el consumo es incidental y no tiene un momento dedicado — "mientras usan el teléfono para otra cosa, entre clases o fuera de la facultad" (TP2, contexto de uso). Como la interacción no se repite a diario ni sigue una rutina fija, la interfaz debe ser tan autoexplicativa y directa que el estudiante, al volver a abrirla tras una nueva alerta —sin que haya un ritmo de uso predecible—, no tenga que reaprender ni recordar cómo interactuar con ella.

---
## 5. Actualización brief.
---

## 6. Tres estructuras alternativas para el flujo principal, según atributo priorizado

> El flujo del punto 3 (notificación → consulta → recordatorio/inscripción) admite más de una arquitectura de navegación. Cada estructura resuelve de manera distinta el mismo tramo — qué pantalla aparece al tocar la notificación y cómo se llega desde ahí a activar el recordatorio — según cuál de los tres atributos del punto 4 prioriza:
>
> - **Eficiencia:** el esfuerzo que hace el usuario para completar una tarea puntual (se toma como caso guía "activar el recordatorio de un evento").
> - **Satisfacción:** cuán satisfecho queda el usuario al usar el producto y hacer esa tarea — es cualitativa, no se mide en pasos sino en la calidad percibida de la experiencia.
> - **Facilidad de recuerdo:** cuánto esfuerzo requiere aprender (o volver a aprender) a moverse por la app.
>
> Restricción común a las tres, ya exigida por el punto 3: **siempre tiene que existir una forma de volver a Inicio (el repositorio, 2.2)** desde cualquier punto del recorrido. Lo que cambia es cómo de directo o costoso es ese regreso, y cuántos pasos hay entre la notificación y el recordatorio activado.

### 7.1 Comparación de las tres alternativas

| Alternativa | Atributo que privilegia | Qué gana | Qué resigna | Hallazgo del TP2 que la sustenta o la descarta |
|---|---|---|---|---|
| **A** — la notificación lleva a Inicio con el evento destacado al comienzo | Eficiencia | Activar el recordatorio no exige abrir ninguna pantalla aparte de la que ya es la base de la app: dos toques (notificación → "Recordarme" sobre el ítem) y el usuario ya está parado en Inicio, sin necesidad de "volver". | Profundidad de la información en el primer vistazo: la fila del listado solo alcanza para fecha y lugar, no para la descripción completa; el evento comparte pantalla con el resto en vez de tener toda la atención. | Se descarta, dado que la información que se muestra en el inicio puede no ser suficiente para tomar la decisión de inscribirse o activar el recordatorio. Los usuarios expresaron incomodidad al tener poca información de un evento.|
| **B** — la notificación lleva a la ficha de detalle, con vuelta a Inicio | Satisfacción | El evento tiene pantalla propia con la ficha completa (2.5) antes de pedir una decisión, sin competir con otros eventos por la atención — responde de lleno a la queja de información incompleta. | Volver a Inicio deja de ser el estado por defecto y pasa a ser una acción explícita; la tarea puntual (recordatorio) queda supeditada a atravesar la ficha completa, aunque el usuario ya supiera que solo quería eso. | Se sustenta ya que muestra la información completa del evento notificado para tomar la decisión sobre inscribirse o activar el recordatorio.  |
| **C** — la notificación abre Inicio con un pop-up de información mínima sobre el evento | Facilidad de recuerdo | La tarjeta que aparece es siempre igual, sin importar el evento ni cuánto tiempo pasó desde la última vez — nada que reaprender. Volver a Inicio no exige navegar: al estar Inicio de fondo, cerrar el pop-up ya deja al usuario ahí. | Un toque más para completar la tarea guía (pop-up → ficha → recordatorio) frente a A y B, y menos información visible en el primer toque que en B (solo título y fecha en el pop-up). | El consumo es incidental y sin rutina fija (TP2, contexto de uso), sin momento diario que sostenga la memoria — sustenta priorizar la consistencia entre usos. |

### 7.2 Jerarquía de pantallas (simplificada)

- **A:** Notificación → Pantalla de Inicio, con el evento de la notificación como destacado al comienzo del listado y sus acciones (recordatorio) disponibles ahí mismo, sin abrir otra pantalla.
- **B:** Notificación → Ficha de detalle del evento, con la información completa y sus acciones → desde la ficha, el usuario puede volver a Inicio.
- **C:** Notificación → Pantalla de Inicio → Pop-up con la información mínima del evento (siempre el mismo formato); para llegar a las acciones hace falta entrar desde ahí a la ficha de detalle.

La diferencia entre las tres no está en qué contenido muestran —las tres terminan usando la misma ficha del punto 2.5— sino en **qué tan lejos está esa ficha del toque en la notificación, y qué tan directo es volver al punto de partida (Inicio)**: en A no hace falta llegar a la ficha para completar la tarea guía; en B se llega directo a la ficha pero alejándose un paso de Inicio; en C se interpone un paso intermedio (el pop-up) antes de decidir si conviene profundizar.


### 7.3 Decisión

Nos quedamos con la **Estructura B** como definición del flujo principal para el MVP.

- **Qué hace:** al tocar la notificación, el alumno llega directo a la ficha del evento notificado, con toda la información cargada sobre ese evento (fecha, hora, lugar, descripción y link de inscripción, punto 2.5). Es una pantalla autosuficiente: alcanza por sí sola para informarse y actuar —inscribirse por el link externo o activar el recordatorio— sin depender de ninguna otra pantalla de la app.
- **Por qué, según el TP2:** responde directo a la queja de información incompleta que sostiene el atributo de Satisfacción — U13 ("no profundizan tanto como para generar un interés") y U22 ("información escasa o poco clara") — y a que la eficiencia percibida de la comunicación institucional hoy es de apenas 2,50/5. Es también la apuesta más directa para cerrar la brecha entre interés (3,60/5 en el propio departamento) y asistencia real (1,95/5): si lo que frena la asistencia es no tener con qué decidir, mostrar todo en el mismo paso que la alerta ataca esa causa.
- **Qué se resigna:** volver a Inicio (el repositorio, 2.2) pasa a ser un paso extra y explícito, no el estado por defecto. El alumno puede resolver todo desde la ficha del evento notificado y cerrar la app sin llegar a ver el resto de los eventos disponibles. Esto es coherente con el punto 3, que ya define al repositorio como respaldo para quien quiera consultar por su cuenta y no como parte obligatoria del recorrido: el botón de Inicio queda igual expuesto en la ficha, como invitación a interesarse por más eventos, aunque llegar hasta ahí dependa de esa acción extra y no sea automático como en la Estructura A.



## 10.1 Anclaje

**1. Incorporar la alerta push como disparador del flujo**

- **Decisión en el wireframe:** el flujo principal arranca con una notificación (pantallas "Notif" y "Notif PC"); no depende de que el alumno abra la app a consultar.
- **Dato del TP2 que la sustenta:** 
Pregunta 10: ¿Con qué frecuencia buscás información sobre eventos de la UNLaM por tu cuenta?
de 20 respuestas de alumnos 8 afirman buscar eventos 'Esporádicamente' y 4 'Nunca' combinado con interés sobre los eventos de su departamento, por lo cual integrar las alertas funcionaría como recordatorio para informarse.
Se refuerza con el dato de encuesta: 15 de 20 alumnos marcaron "No vi la publicación" como motivo de haberse perdido un evento.

**2. Que la alerta lleve directo a la ficha completa del evento, no a un simple aviso**

- **Decisión en el wireframe:** tocar la notificación abre la ficha del evento con toda la información (fecha, lugar, flyer, descripción, inscripción), sin pasar por el listado general.
- **Dato del TP2 que la sustenta:** U22 — "la información provista en las publicaciones suelen ser escazas o poco claras, y es dificil encontrar detalles adicionales"* (TP2, punto 3.2). En la misma línea, U13 — *"no profundizan tanto como para generar un interés".

**3. Que Inicio muestre por defecto los eventos del propio departamento**

- **Decisión en el wireframe:** en la barra lateral y el feed de Inicio, el propio departamento aparece destacado y con acciones habilitadas; los demás departamentos quedan visibles pero no llevan a ningún lado.
- **Dato del TP2 que la sustenta:** la encuesta registra un interés de 3,60/5 en eventos del propio departamento contra 2,20/5 en los de otros departamentos, con el dato decisivo de que "ningún alumno declara más interés por los eventos de otros departamentos que por los del propio (0 de 20; 15 lo invierten, 5 empatan)"(TP2, punto 4, confrontación del supuesto #1).

---

## 10.2 Descarte

Propuestas de Claude que el equipo terminó rechazando durante el armado del wireframe, con el hallazgo del TP2 que las contradecía y qué se hizo en su lugar.

**1. Vista acotada del evento en el listado de Inicio — dependía de que el alumno entrara a explorar**

- **Qué propuso Claude:** en el listado de Inicio, mostrar cada evento con muy pocos datos (apenas título y fecha/lugar), dejando la descripción y la imagen ocultas detrás de un toque adicional para entrar a la ficha — el alumno tenía que explorar cada card para enterarse de qué se trataba.
- **Qué hallazgo del TP2 lo contradecía:** la necesidad relevada #1 — "un único lugar donde esté todo", 20 de 20 alumnos, la única respuesta unánime — y la #4 — "información completa, no solo el aviso", sostenida por U22: "la información provista en las publicaciones suelen ser escazas o poco claras, y es dificil encontrar detalles adicionales" y U13: "no profundizan tanto como para generar un interés". Una vista acotada que obliga a explorar reproduce exactamente lo que hoy falla: publicaciones que no alcanzan para decidir, repartidas en vez de centralizadas en un solo vistazo.
- **Con qué se reemplazó:** una card de evento enriquecida directamente en el listado, con flyer/imagen, descripción resumida, fecha, hora y título visibles sin necesidad de entrar a la ficha.

**2. Control de notificaciones: interruptor general vs. frecuencia configurable**

**Qué propuso Claude:** para gestionar a los 4 de 20 alumnos que rechazan ser notificados, un control de suscripción general tipo interruptor binario (activar/desactivar la alerta del departamento por completo).
- **Qué hallazgo del TP2 lo contradecía:** el propio brief de producto ya especificaba en la funcionalidad de alerta que "requiere frecuencia configurable y baja" — justamente por ese mismo 4 de 20 (supuesto nuevo #10 del brief). Un simple on/off no cubría la granularidad que la evidencia ya pedía; era una propuesta más pobre que lo que el propio análisis ya había establecido.
- **Con qué se reemplazó:** una frecuencia de notificación configurable por el alumno (alertas diarias o un resumen semanal), propuesta por el equipo.

---

## 10.3 El elemento crítico

**¿Cuál es el elemento que sostiene la hipótesis?**

El **repositorio centralizado de eventos** (la pantalla de Inicio, punto 2.2). Es la base de datos y la pantalla donde vive la ficha de cada evento: sin él, ni la alerta ni el recordatorio tendrían de dónde traer la información ni adónde llevar al alumno. Materializa la mitad de la **Solución** que promete la hipótesis — *"una plataforma que centraliza los eventos"* (brief §7) — y sin él no habría nada que empujar por la alerta ni nada que consultar como respaldo (punto 3). Si no estuviera construido de verdad, el MVP no tendría cómo mostrarle al alumno la información completa que necesita para decidir, y la hipótesis quedaría sin forma de confirmarse ni de refutarse.

**¿Hay algo incluido que podrían sacar sin perder esa capacidad?**

Sí, la **configuración de la alerta** (elegir frecuencia diaria o resumen semanal, y los switches de la pantalla de Configuración de alertas), no la alerta en sí. Las dos métricas de la **Evidencia medible** (brief §7) dependen de que la alerta *exista* y *llegue a tiempo* — que baje el *"no vi la publicación"*  no de que el alumno pueda elegir cómo la recibe. Con una alerta fija (por ejemplo, siempre inmediata) alcanzaría para medir exactamente lo mismo. 
Quedó adentro porque los alumnos que declaran no querer ser notificados (6 de 22)— pero eso resuelve un riesgo de abandono del canal, no la capacidad de testear la hipótesis.

