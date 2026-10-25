# TP5 — Parte 1: métricas y criterio de éxito (propuesta a validar por el equipo)

**Producto:** Nodo UNLaM — equipo TicTac.  
**Momento de registro:** antes de escribir código del MVP (este documento tiene un commit propio, anterior al de implementación).  
**Hipótesis de referencia:** brief v3, §7, revisado a partir de los 20 estudiantes de Ingeniería en Informática del DIIT encuestados en TP2. Los estudiantes se pierden eventos de **su propio departamento** porque el aviso no les llega o les llega tarde. Alertas al teléfono, segmentadas y con ficha completa, deberían reducir esa pérdida y permitirles decidir a tiempo.

## Métrica accionable 1 — Porcentaje de eventos relevantes no vistos a tiempo

- **Definición operativa:** de las oportunidades de aviso de un evento que el participante **considera relevante**, porcentaje en que **no llegó a conocer la ficha del evento antes de una ventana de 24 horas posterior a la alerta**, aun habiendo estado habilitado para recibirla.
- **Fórmula:** `(eventos relevantes sin apertura de ficha dentro de 24 h / eventos relevantes notificados) × 100`.
- **Cómo se registra:** un evento tiene ID, departamento/carrera, fecha de publicación y de realización. El sistema registra `alert_queued`, `push_accepted` (aceptación por el servicio de push, **no confirma que el usuario lo haya visto**) y `event_opened` con origen `push` y marca de tiempo. El equipo pregunta al finalizar si ese evento era de su interés; una apertura desde Inicio no cuenta como vista **por la alerta**. El denominador y las no aperturas se contrastan con observaciones/registro de sesión; sin interés confirmado, el caso se excluye.
- **Línea de base:** TP2: 15/20 alumnos (75 %) mencionaron “No vi la publicación” entre los motivos por los que se perdieron eventos. **Advertencia:** ese 75 % mide autodeclaración sobre experiencias pasadas, no aperturas instrumentadas por evento. No son porcentajes estadísticamente intercambiables; se presentan como referencia, no como comparación causal directa.
- **Umbral objetivo de uso sostenido:** **menos del 30 %** sin apertura, en consonancia con el brief §7, **solo evaluable con uso longitudinal y suficientes oportunidades reales**.
- **Decisión:** si la tasa es alta, investigar primero permiso y recepción real del push, segmentación, frecuencia, texto de alerta y fricción entre aviso y ficha. No sumar funcionalidades de inscripción antes de resolver la llegada.
- **Cuidado con lecturas engañosas:** abrir una ficha no prueba lectura, interés genuino, asistencia ni que la notificación se vio a tiempo. Separar `push_accepted` de `event_opened`, y no contar vistas de un usuario del equipo como evidencia.

## Métrica accionable 2 — Porcentaje de alertas oportunas

- **Definición operativa:** porcentaje de alertas de **eventos reales** que se ponen a disposición del usuario al menos **7 días completos antes de la hora de inicio** del evento.
- **Fórmula:** `(alertas oportunas con ≥168 horas de margen / total de alertas emitidas sobre eventos reales) × 100`.
- **Cómo se registra:** fuente original y `sourcePublishedAt`, fecha de carga interna `createdAt`, hora programada `startsAt` y fecha `push_accepted` por dispositivo. El margen se calcula desde el momento de aceptación por el servicio push, no desde la fecha original en redes. Marcar como **no verificable** cualquier push que haya fallado o cuya hora de recepción se desconozca; informar separadamente tasa de aceptación y de entrega no comprobada.
- **Umbral:** **al menos 80 %** de alertas con 7 días o más de margen (brief §7). Compromiso del equipo: cargar la ficha **dentro de las 48 horas** de la publicación fuente (TP3 §2.4); cumplir ese SLA **no garantiza** 7 días de margen si la universidad publicó tarde.
- **Decisión:** si la tasa cae, inspeccionar los tiempos: si el contenido se cargó más de 48 h después, corregir el proceso manual; si la institución publicó con menos de 7 días, registrar la limitación externa y reconsiderar la promesa de oportunidad. Si el fallo fue del push, corregir entrega/configuración, no la carga.
- **Cuidado con lecturas engañosas:** no usar eventos ficticios de ejemplo para afirmar que se alcanzó el 80 %. Los resúmenes diario/semanal pueden entregar más tarde que el momento de carga.

## Métrica vanidosa — Número de instalaciones o visitas al Inicio

Que 100 personas instalen la app, o que el feed reciba muchas visitas, puede parecer éxito. No significa que hayan conocido un evento que de otro modo se habrían perdido, que la alerta llegue a tiempo ni que la ficha ayude a decidir. No guía una decisión sobre la hipótesis. Tampoco equivale a asistencia.

## Criterio predefinido antes de probar

**Chequeo inicial de factibilidad (sesión con al menos 3 estudiantes reales):** para cada persona, el equipo prepara un evento potencialmente relevante y observa sin ayudar. Se considera que el **flujo técnico es viable** si **al menos 2 de 3** reciben una notificación REAL (no una imagen ni un clic del equipo dentro de la app), abren su ficha **desde el aviso**, identifican fecha/hora/lugar y encuentran la acción de recordatorio o el enlace externo sin indicaciones. Deben anotarse los fallos individuales, incluso si el umbral se alcanza. Se prueban además cambio de carrera/departamento y preferencias, sin intervenir.

**Hipótesis sostenida con evidencia inicial (no demostrada estadísticamente):** junto con ese recorrido viable, **al menos 2 de 3** afirman que el evento les interesaba y explican con sus propias palabras cómo habrían sabido a tiempo y cómo decidirían asistir **sin consultar otra red**, respaldado por su conducta (notificación → ficha → acción). Esta es evidencia cualitativa temprana, **no** prueba aún la reducción longitudinal del 75 % al <30 %.

**Hipótesis cuestionada en la prueba:** si **2 o más** usuarios no llegan a la ficha por el aviso sin ayuda, o si **2 o más**, aun viendo la ficha, necesitan recurrir a fuentes externas para entender de qué trata/cuándo/dónde ocurre, **no se sostiene el mecanismo de valor** tal como está diseñado. Diagnosticar por separado si fue entrega del push, usabilidad o insuficiencia real del contenido; la prueba sola no indica cuál.

**Resultado inconcluso:** si los datos mostrados son sólo simulados, no hay notificaciones push reales, el permiso está bloqueado, o los participantes no tienen interés en el evento presentado, no se puede declarar confirmada/refutada la hipótesis de valor. Registrar expresamente la limitación; no cambiar estos umbrales después de observar las sesiones.

**Medición longitudinal pendiente:** sólo un período real de uso con publicaciones verificables puede contrastar las metas de referencia del brief (<30 % pérdidas declaradas y ≥80 % alertas oportunas) y observar asistencia 4–5/5. En este TP no se inventarán cifras ni sesiones.

> **Responsabilidad académica:** el TP5 indica que la definición de métricas y criterios es decisión del equipo, no de la IA. Este archivo es un borrador estructurado para revisión y aprobación de TicTac **antes de usarlo como criterio de evaluación**. La instrumentación no sustituye la observación humana.
