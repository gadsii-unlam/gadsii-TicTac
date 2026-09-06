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
