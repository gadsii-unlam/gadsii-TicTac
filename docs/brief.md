# Brief de Producto — Nodo UNLaM

## Versión 4 — Noviembre 2026

> **Registro de cambios.** Esta versión incorpora lo aprendido en la prueba del MVP del TP5. La hicimos el viernes 30/10/2026 con tres alumnos de Ingeniería en Informática (U1 a U3). Según el criterio fijado antes de construir, dos quedaron a favor y el tercero, sin datos: **la hipótesis se sostiene y perseveramos**. El detalle está en [docs/evidencia/tp5/](evidencia/tp5/README.md).
>
> **Qué cambió y por qué.**
>
> - Al punto 7 se le suma el **estado de la hipótesis**: se sostiene con 2 de 3 usuarios a favor. La alerta fue la primera noticia en 5 de 6 eventos notificados y terminó en una decisión en 2 de 4 alertas abiertas.
> - En el punto 8 se actualiza el **estado de los supuestos** 5, 7, 8, 9 y 10, y se agregan dos supuestos nuevos:
>   - el 11: lo que el DIIT publica "para todo el departamento" no siempre es para alumnos de grado;
>   - el 12: el alumno reenvía la ficha a sus grupos.
> - La segmentación pasa a ser también **por público destinatario y por año**. Las 4 alertas que no terminaron en nada fueron eventos que no estaban dirigidos a los usuarios.
> - La frecuencia configurable tiene que **respetar la antelación**. El resumen semanal dejó a un usuario sin ninguna alerta durante la prueba y después le entregó un evento a 3 horas de empezar.
> - Se agregan notas en los puntos 3, 4 y 9, y un **punto 10 nuevo** con lo aprendido, la decisión de perseverar y su fundamento, lo próximo a construir, la próxima prueba y qué nos haría pivotar.
>
> **Qué no cambió y por qué.** El problema, el segmento y el texto de la hipótesis siguen igual que en la v3, porque la prueba no dio motivos para cambiarlos. El canal de la alerta sigue siendo una decisión abierta: el push en el celular funcionó, pero no se comparó con otra vía. Las metas de "un cuatrimestre de uso" del punto 7 siguen pendientes, porque una prueba de un día no las mide.

---

## 1. Segmento elegido

**Segmento:** Personal docente y estudiantil de la UNLaM, pertenecientes únicamente a las carreras de grado.

**Por qué ese segmento:** Porque estudiantes y docentes tienen una participación directa en las actividades académicas de la UNLaM. Los estudiantes son los principales destinatarios de estos eventos y necesitan acceder a información relevante sobre ellos, mientras que los docentes cumplen un rol importante en su difusión dentro de las comisiones.

**Tamaño aproximado:** Entre 78.000 y 79.000 estudiantes y aproximadamente 3.400 docentes.

**Qué los distingue del resto de la comunidad:** Son personas directamente vinculadas con la actividad académica de la universidad, principales participantes e interesados de la comunicación y participación de actividades complementarias a la cursada.

> **Alcance validado (nuevo en v2).** El segmento sigue siendo la aspiración del producto, pero lo único que hoy tiene respaldo empírico es el **DIIT, carrera de Ingeniería en Informática**. Ampliar el segmento con evidencia requiere relevar otras carreras.

---

## 2. Producto

**Nombre:** Nodo UNLaM

**Problema que resuelve (revisado en v2).** Los alumnos se pierden eventos **de su propio departamento** que sí les interesan. El problema tiene tres causas distintas, que el relevamiento permitió separar:

1. **De alcance** — la publicación existe y no llega: *"no vi la publicación"*, **15 de 20**. Es el motivo más frecuente.
2. **De oportunidad** — llega, pero tarde para organizarse: *"apareció demasiado cerca de la fecha"*, **11 de 20**.
3. **De dispersión** — la información está repartida en 10 canales distintos, 3,7 por alumno: **8 de 20** marcan que estaba distribuida y otros **8** que no sabían dónde buscarla.

La versión 1 nombraba solo la tercera. Las dos primeras son más frecuentes y **no se resuelven centralizando**: centralizar no sirve si el usuario nunca entra al lugar donde se centralizó.

**A quién se lo resuelve.** A los alumnos, en primer lugar. Con el agregado —confirmado por el relevamiento— de que la solución tiene que ir a buscarlos a ellos y no al revés: **12 de 20 no buscan información sobre eventos nunca o solo esporádicamente**.

---

## 3. Funcionalidades core

Reordenadas por prioridad según la evidencia. El cambio principal respecto de v1 es que la notificación deja de ser la tercera funcionalidad y pasa a ser el eje.

1. **Alerta segmentada al celular** *(era la funcionalidad 3; ahora es el núcleo)*. Envío activo de los eventos que corresponden a la carrera y el año del alumno, con antelación suficiente. Sostiene el problema de alcance (15 de 20) y el de oportunidad (11 de 20), y responde a que 19 de 20 se enteran por celular y 8 no usan ningún otro dispositivo. Requiere **frecuencia configurable y baja**: 4 de 20 declaran que no quieren ser notificados.
   > *Nota v4.* En la prueba del MVP, U1 y U3 llegaron de la alerta a la ficha en 15 y 12 segundos. Lo que falló fue la frecuencia baja: el resumen semanal dejó a U2 sin alertas durante la prueba, y el lunes le entregó un evento a 3 horas de empezar y otro ya cerrado. La frecuencia configurable no puede romper la antelación (punto 10.3).
2. **Ficha de evento completa** *(nueva en v2)*. Fecha, hora, lugar, de qué se trata y qué se necesita para participar. Surge de que la publicación actual no alcanza para decidir: **U22** — *"la información provista en las publicaciones suelen ser escazas o poco claras, y es dificil encontrar detalles adicionales"*; **U13** — *"no profundizan tanto como para generar un interés"*.
3. **Consulta centralizada de eventos**. El único punto donde está todo: **20 de 20** lo querrían. Sigue siendo necesario, pero es el destino de la alerta, no la puerta de entrada.
4. **Inscripción a un evento**, con confirmación y control de cupo. Sin cambios respecto de v1.
5. **Carga y publicación de eventos por departamento** (rol administrativo): título, descripción, fecha/hora, lugar, cupo y departamento/carrera al que se dirige. Sin cambios respecto de v1, pero **sin evidencia**: ningún administrativo fue relevado.

**Fuera del alcance inicial:** *compartir o recomendar un evento a una cátedra de otro departamento* (era la funcionalidad 4 de v1). Se apoyaba en dos cosas que no se sostienen: que los eventos de otros departamentos interesaran —refutado— y que los docentes quisieran difundirlos —sin evidencia—. No debería construirse antes de entrevistar docentes.

---

## 4. Integraciones previstas

- **Intraconsulta UNLaM:** para obtener materias, comisiones y alumnos inscriptos, y así habilitar la segmentación por carrera y año. **Sube de prioridad en v2**: si la segmentación es el núcleo, esta integración es la que la hace posible.
- **Calendario académico institucional:** para contextualizar los eventos con fechas generales del cuatrimestre, como las mesas de examen y verificación de materias.
- **Canal de la alerta — decisión abierta.** La v1 daba por sentado Teams. El relevamiento no lo confirma ni lo descarta, pero lo acota:
  - **16 de 20 aceptarían** ser notificados por Teams, pero solo **3 de 20** lo mencionan como canal actual: hay aceptación declarada, no hábito.
  - **WhatsApp es el canal no institucional más instalado** (13 de 20) y el de menor fricción de adopción.
  - **El correo es la opción más débil: ningún alumno lo menciona** entre los canales por los que hoy se entera de eventos.
  - La decisión entre aplicación móvil con push y aplicación web con WhatsApp o mail **requiere una pregunta comparativa que esta encuesta no hizo**.
  - *Nota v4.* La prueba del MVP usó push web en Android, sin instalar nada, y la alerta se abrió en segundos. No se comparó con otra vía. Lo que sí se vio es que el evento grande de la semana, ExpoProyecto, les llegó a los tres por carteles, Instagram o WhatsApp, y que U3 reenvió su cronograma al grupo de su comisión. La decisión sigue abierta. El disparador de un pivote de canal está en el punto 10.5.

---

## 5. Grupos de usuarios

### Grupo primario: Alumnos — perfil real (reemplaza al perfil hipotético de v1)

**Quién es.** Estudiante de **Ingeniería en Informática del DIIT**, de **21 a 27 años** (18 de los 20 relevados; los extremos son 17 y 39), **cursando entre 3.º y 5.º año** (17 de 20).

**Cómo se comporta.** Lo que lo define no es el desinterés sino la brecha entre lo que le interesa y lo que hace: el interés en los eventos de su propio departamento promedia **3,60 sobre 5**, la asistencia **1,95**, y **ningún alumno respondió 4 ni 5 en asistencia**. Ocho de veinte combinan interés alto con asistencia baja.

**Es pasivo en la búsqueda.** 12 de 20 buscan información sobre eventos "Nunca" o solo "Esporádicamente". **U6**: *"los medios de comunicación oficial suelen tener la información, pero es raro que los revise, más que nada porque no voy a estar revisando múltiples medios en busca de que aparezca un evento"*.

**Se informa por canales mayormente informales.** 16 de 20 por Instagram, 16 por algún canal informal —WhatsApp (13), Discord (5) o un compañero (9)—. Tres alumnos no usan **ningún** canal institucional. **U10**: *"si no fuese porque los tengo en instagram, no me enteraría de casi nada"*.

> *Qué decía la v1:* "alumnos activos de cualquier carrera de grado que hoy se enteran de eventos solo si siguen la cuenta de su propio departamento… se pierden sistemáticamente los eventos". La intuición sobre la dependencia de redes sociales resultó correcta; el alcance ("cualquier carrera") y la parte sobre eventos de otros departamentos, no.

### Grupo secundario: Docentes — sin evidencia

Los docentes no fueron objeto del relevamiento. Dos respondieron de manera espontánea, lo que no constituye evidencia sobre el grupo, y el cuestionario **no incluyó ninguna pregunta sobre difundir o compartir eventos**. Todo lo que la v1 afirmaba sobre su rol de difusores sigue siendo una hipótesis sin verificar. Requiere entrevista.

### Grupo secundario: Administrador de eventos por departamento — sin evidencia

**Ningún administrativo respondió.** El instrumento tampoco estaba diseñado para ellos. La descripción de v1 —que hoy cargan el mismo evento en Instagram y por mail, sin sistema único ni visibilidad de inscriptos— se mantiene como supuesto, no como hallazgo. Requiere entrevista y observación del proceso actual.

**Por qué los alumnos siguen siendo el grupo primario.** Son quienes muestran la brecha entre interés y asistencia y quienes reportan haberse perdido eventos (13 de 20). **Con una advertencia honesta:** el relevamiento no puede decir si otro grupo tiene el problema más fuerte, porque solo relevó al grupo primario. Mantenerlos es consistente con lo encontrado, no el resultado de haber comparado los tres grupos.

---

## 6. Necesidades, problemas y contexto de uso (nuevo en v2)

### Necesidades relevadas

1. **Un único lugar donde esté todo** — 20 de 20, la única respuesta unánime.
2. **Que la información los alcance en vez de tener que buscarla** — 12 de 20 casi nunca buscan.
3. **Enterarse con tiempo para poder ir** — antelación percibida 2,05 sobre 5.
4. **Información completa, no solo el aviso** — U13 y U22.
5. **Relevancia filtrada** — interés 3,60 en el propio departamento contra 2,20 en los demás.

### Problemas y frustraciones

**13 de 20 quisieron ir a un evento y no pudieron** porque no se enteraron a tiempo o no encontraron la información. Los motivos: *"no vi la publicación"* (15 de 20), *"apareció demasiado cerca de la fecha"* (11), *"no sabía dónde buscar"* (8) y *"la información estaba distribuida en distintos canales"* (8). La eficiencia percibida de la comunicación de la UNLaM promedia **2,50 sobre 5**, con 10 de 20 puntuándola en 1 o 2.

### Contexto de uso

- **Dispositivo:** celular, 19 de 20; **8 no usan ningún otro**. Computadora 12, tablet 1.
- **Momento:** no hay un momento dedicado. El consumo es incidental, mientras usan el teléfono para otra cosa, entre clases o fuera de la facultad.
- **Condición:** apurados y en modo pasivo. El primer impacto es decisivo: el motivo más marcado es no haber visto la publicación, no que no interesara.
- **Compañía:** la información circula por rebote social — 9 se enteran por un compañero, 8 por un docente, 13 participan de grupos de WhatsApp.
- **Conectividad:** **no relevada.** No se afirma nada sobre uso sin conexión.
- **Barrera no informativa:** dos alumnos señalaron espontáneamente que los eventos **se superponen con su horario de cursada** (U12, U19). Ninguna funcionalidad de este brief la resuelve.

---

## 7. Hipótesis de valor

> **Creemos que** el alumno de Ingeniería en Informática del DIIT que cursa entre 3.º y 5.º año, se informa por el celular y no busca información de eventos por su cuenta,
>
> **tiene el problema de** perderse eventos **de su propio departamento** que sí le interesan, porque el aviso no le llega o le llega demasiado cerca de la fecha,
>
> **Nuestra solución es** una plataforma que centraliza los eventos y **se los empuja al celular** filtrados por su carrera y año, con antelación suficiente y con la información completa para decidir, dejando la inscripción a un toque desde esa misma alerta.
>
> **Sabremos que estamos en lo correcto cuando**, tras un cuatrimestre de uso, los alumnos que reportan *"no vi la publicación"* bajen del **75 % actual a menos del 30 %**, el **80 % de las alertas** se entregue con **7 días o más** de anticipación, y aparezcan las primeras respuestas de asistencia en **4 y 5** de la escala, hoy inexistentes.

La trazabilidad de cada parte a los datos del relevamiento está en el [punto 5 del TP2](TP2.md).

### Estado de la hipótesis (nuevo en v4)

**Se sostiene**, según la prueba del MVP del 30/10/2026 y el criterio fijado antes de construir ([TP5, Parte 1](TP5-parte1.md)). U1 y U3 quedaron a favor y U2, sin datos.

| Métrica | Resultado |
|---|---|
| Alertas que fueron la primera noticia del evento | **5 de 6 (83 %)** |
| Alertas abiertas que terminaron en recordatorio o inscripción sin consultar otro canal | **2 de 4 (50 %)**. En las otras dos, y en las dos alertas que no se abrieron, el evento no les interesaba. |

Dos salvedades:

- **La primera noticia está inflada por eventos que no querían.** Si se cuentan solo los eventos que le interesaban al usuario, baja a 2 de 6. La próxima prueba la mide así (punto 10.4).
- **Las tres metas de arriba son de un cuatrimestre de uso** y una prueba de un día no las mide. Sobre la antelación, la prueba deja un dato. De los cinco eventos del DIIT publicados en octubre que están en la base, con la carga a 48 horas solo 2 habrían llegado con 7 días o más. El 80 % no depende solo de nosotros: depende también de cuándo publica el DIIT.

---

## 8. Estado de los supuestos

### Supuestos de la versión 1

| # | Supuesto | Estado | Evidencia |
|---|---|---|---|
| **1** *(crítico)* | Estudiantes y docentes tienen dificultades para enterarse de los eventos **de otros departamentos**. | **Refutado** en su recorte (alumnos) · **Sin evidencia** (docentes) | La dificultad existe, pero no ahí. Interés en otros departamentos **2,20 / 5**, 13 de 20 responden 2 o menos, ninguno responde 5, y **cero alumnos los priorizan por encima de los propios**. El problema está en los eventos propios: interés 3,60, asistencia 1,95, 13 de 20 se perdieron un evento. |
| **2** | La información está dispersa entre distintos canales. | **Confirmado** | 10 canales en uso, 3,7 por alumno, 14 de 20 usan 3 o más. 8 de 20 marcan que estaba distribuida. **U5**: *"Hay información esparcida por muchos canales diferentes"*. |
| **3** | Los docentes consideran útil compartir eventos con sus cátedras. | **Sin evidencia** | Grupo secundario, no relevado. Además el cuestionario no preguntó sobre difundir ni compartir. |
| **4** | El personal administrativo necesita una herramienta centralizada de carga y gestión. | **Sin evidencia** | Ningún administrativo respondió. |
| **5** | La información centralizada aumentaría la participación. | **Sin evidencia** | La participación no se midió antes y después. El único dato cercano —20 de 20 querrían un solo lugar— mide deseo, no conducta, y es una pregunta sin poder discriminante. |
| **6** | Los alumnos prefieren notificarse por herramientas de uso cotidiano de la cursada antes que por externas. | **Confirmado** | **16 de 20 aceptarían** ser notificados por MS Teams, que es la plataforma de uso cotidiano durante la cursada. La salvedad: el cuestionario preguntó por Teams por sí o por no, sin ofrecer una alternativa externa contra la cual compararlo, así que lo respaldado es la aceptación y no la preferencia. |

### Supuestos nuevos, surgidos del relevamiento

Todos **sin evidencia**: aparecieron en los datos pero el instrumento no estaba diseñado para medirlos. Son los candidatos a verificar en la próxima ronda.

| # | Supuesto nuevo | De dónde sale | Cómo verificarlo |
|---|---|---|---|
| **7** | Existe una barrera de **agenda**, no de información: los eventos se superponen con el horario de cursada. | U12 y U19 lo mencionaron espontáneamente, sin que se preguntara — 2 de las 9 respuestas abiertas. Además la asistencia tiene techo 3 incluso entre quienes declaran interés máximo. | Preguntar directamente por motivos de no asistencia distintos de la información. Cruzar horarios de eventos con horarios de cursada. |
| **8** | La **calidad de la publicación** es una barrera de decisión, no solo su llegada. | U13 y U22: la información es *"vaga"*, *"escaza o poco clara"* y faltan detalles. | Testear dos formatos de ficha de evento y medir cuál genera más inscripciones. |
| **9** | El **canal más efectivo para la alerta** es el celular por una vía que el alumno ya usa, no una plataforma académica. | Teams: 16 de 20 lo aceptan pero solo 3 lo usan. WhatsApp: 13 de 20 ya lo usan. Correo: 0 alumnos. | Pregunta comparativa entre push, WhatsApp, Teams y mail. |
| **10** | Una parte del público **rechaza ser notificado**, y la notificación mal calibrada expulsa usuarios. | 4 de 20 responden que no quieren notificaciones por plataforma académica. | Medir la tasa de baja y silenciamiento una vez en funcionamiento. |

### Estado después de la prueba del MVP (nuevo en v4)

Tres usuarios y un día de uso: lo que sigue son indicios, no confirmaciones. Los supuestos 1 a 4 y 6 no se pusieron a prueba y quedan como estaban.

| # | Supuesto | Estado v4 | Qué se vio en la prueba |
|---|---|---|---|
| **5** | La información centralizada aumentaría la participación. | **Sin evidencia** | La prueba no midió asistencia y el MVP no registra el toque en "Inscribirme". U1 y U3 activaron el recordatorio de E1 y lo abrieron el lunes 2/11. |
| **7** | Barrera de **agenda**. | **Con indicios** | U2 abrió E1 desde Inicio y lo descartó: *"Martes y jueves de 18:30… curso a esa hora. No puedo."* En las alertas, nadie dio este motivo. |
| **8** | **Calidad de la publicación** como barrera de decisión. | **Con indicios** | La ficha de E1 decía "arancelada", pero no el monto. U1 lo descubrió en la página de inscripción: *"Uh, es paga: ciento sesenta lucas por mes."* El 3/11 agregamos los valores a las fichas de las dos capacitaciones. |
| **9** | El canal más efectivo es el celular, por una vía que el alumno ya usa. | **Sin cambios** | El push web en Android funcionó: de la alerta a la ficha en 12 y 15 segundos. No se comparó con otra vía. |
| **10** | Una parte del público rechaza ser notificado. | **Con indicios, en otra dirección** | Nadie desactivó las alertas. Pero la frecuencia baja, que protege del rechazo, dejó a U2 sin alertas: *"Ah… ¿entonces hoy no me iba a llegar nada?"* U3 pasó a Resumen diario: *"Cada evento es mucho si me mandan cosas que no son para mí."* |
| **11** *(nuevo)* | Lo que el DIIT publica **para todo el departamento** incluye actividades que no son para alumnos de grado, como capacitaciones abiertas a la comunidad o becas para graduados. | **Con indicios** | 4 de las 6 alertas entregadas se descartaron porque no eran para ellos: E2 (eficiencia energética) y E3 (becas doctorales). Cómo verificarlo: clasificar por público las publicaciones del DIIT de un cuatrimestre. |
| **12** *(nuevo)* | El alumno **reenvía la ficha a sus grupos**, y la información sigue circulando por rebote social. | **Sin evidencia** | Una sola observación: U3 mandó el cronograma de ExpoProyecto al grupo de WhatsApp de su comisión. Cómo verificarlo: registrar cuántas fichas se comparten, cuando exista la opción. |

---

## 9. Alcance del MVP (nuevo en v3)

> El detalle completo, con trazabilidad a la evidencia, está en el [TP3.md](TP3.md). Acá se resume lo mínimo necesario para testear la hipótesis de valor del punto 7.
>
> *Nota v4.* El MVP se construyó con este alcance y las correcciones aceptadas del TP4 ([TP5, Parte 2](TP5-parte2.md)), y se probó el 30/10/2026. Lo que cambia para la próxima versión está en el punto 10.3. Corrección a lo dicho en el TP3: la configuración de la frecuencia no era neutral para la prueba, porque decide si la alerta llega dentro de la ventana de prueba y con qué antelación.

### 9.1 Scope: qué se incluye y qué se excluye

**Incluido en el MVP**

| Incluido en el MVP | Para qué parte de la hipótesis sirve |
|---|---|
| **Sistema de alertas/notificaciones directas al celular**, con frecuencia configurable (diaria o resumen semanal) | Es el corazón de la **Solución** ("se los empuja al celular... con antelación suficiente") y ataca directamente la causa de pérdida más marcada (15/20 "no vi la publicación"). Testea la **Evidencia medible**: bajar ese 75% a menos del 30%. La frecuencia configurable resuelve el supuesto #10 (punto 8, 4/20 rechazan ser notificados) sin resignar el envío activo. |
| **Repositorio centralizado de eventos intradepartamentales** | Materializa la parte de la **Solución** que "centraliza los eventos" y responde a la única necesidad unánime del relevamiento (20/20 pidieron un único lugar), neutralizando la dispersión actual (3,7 canales por alumno, 8/20 perdidos por ella). |
| **Filtro y segmentación por departamento y carrera** | Sostiene la parte de la **Solución** que filtra "por su carrera y año" y corrige el **Problema** tal como quedó redefinido en el TP2: el interés es intradepartamental (3,60/5 propio vs. 2,20/5 ajeno, 0 alumnos priorizan lo ajeno). Es la barrera antisaturación para que el canal push no se silencie. |
| **Detección y carga del evento dentro de un plazo máximo de 2 días** desde que el DIIT o la universidad suben la publicación | Sostiene la **Solución** ("con antelación suficiente") y el motivo de inasistencia por oportunidad (11/20 "apareció demasiado cerca de la fecha"). Es el requisito operativo del lado del sistema para acercarse a la **Evidencia medible** del 80% de alertas con 7 días o más — sin confundir la latencia propia (2 días) con esa meta, que depende de cuándo publica la universidad. |
| **Carga de la ficha canónica con información completa del evento** | Sostiene la **Solución** ("con la información completa para decidir") y responde al supuesto nuevo #8 (punto 8, la calidad de la publicación es una barrera de decisión, U13, U22), evitando que el alumno deba cotejar con otros canales. |

**Excluido del MVP**

| Excluido del MVP | Por qué se excluye |
|---|---|
| **Módulo de resolución de superposición horaria / compatibilidad de cursada** | Aunque apareció espontáneamente como barrera cualitativa (U12, U19), es un problema estructural de agenda académica y logística docente, no de comunicación. Agregaría complejidad técnica sin probar el circuito de llegada y antelación que sí se está testeando. |
| **Feed global o cartelera abierta de otros departamentos** | El interés interdepartamental quedó refutado en el grupo primario: ningún alumno prioriza eventos externos y 13/20 puntuaron 2 o menos. Incluirlo diluiría la propuesta de valor y contradice el foco en el propio departamento que sostiene la hipótesis. |
| **Módulo de inscripción integrado** | La hipótesis se acota a testear el impacto del flujo informativo (llegada a tiempo y ficha clara), no la conversión de inscripción. Al resolverse con un enlace externo dentro de la ficha, construir un motor propio sumaría costo sin ser el factor que valida si el alumno se enteró y decidió asistir. |
| **Integraciones complejas con plataformas de cursada (MIeL, Teams)** | Aunque 16/20 aceptarían Teams, el consumo habitual es predominantemente smartphone y redes (Instagram 16/20, WhatsApp 13/20 vs. Teams 3/20). Acoplarse a sistemas cerrados no valida la hipótesis central y retrasa el testeo del MVP en el entorno móvil natural del estudiante. |
| **Inicio de sesión / registro de cuenta (autenticación institucional)** | Para que la alerta y el filtro por departamento/carrera funcionen alcanza con que el alumno los configure en el dispositivo, sin identificarlo por cuenta ni credenciales. Se reevalúa si una siguiente versión necesita persistencia de cuenta entre dispositivos o funcionalidades administrativas. |

### 9.2 Qué se construye y qué se simula

> Condición: el componente de software propio (la aplicación Nodo UNLaM) tiene que estar construido de verdad. Solo se simula la ingesta de contenido desde fuentes externas — la integración con los canales donde hoy se publican los eventos —, no la experiencia que usa el alumno.

| Elemento | Se construye | Se simula / se resuelve a mano | Por qué |
|---|---|---|---|
| **Sistema de alertas/notificaciones directas al celular** | El motor de notificaciones push de la app móvil y web (React Native): disparo automático al detectar un evento nuevo que coincide con el departamento/carrera del alumno, recordatorio cuando se acerca la fecha de un evento marcado de interés, y la preferencia de frecuencia (diaria o resumen semanal). | No — el envío es 100% automático una vez que el evento existe en el sistema; lo manual está en cómo llega ese evento a la base (ver detección y carga), no en el disparo de la alerta. | Es la funcionalidad core y el componente de software propio que la hipótesis pone a prueba directamente (15/20 "no vi la publicación"); por eso tiene que estar construido de verdad. |
| **Repositorio centralizado de eventos intradepartamentales** | La aplicación móvil y web (React Native) completa: pantalla de listado, base de datos y API que almacena y sirve los eventos. | No. | Es la app que el alumno descarga para recibir alertas y consultar eventos, y el destino al que lo lleva la notificación; sin esta pantalla construida no hay dónde consultar lo que la alerta anuncia. |
| **Filtro y segmentación por departamento y carrera** | La pantalla de onboarding donde el alumno elige departamento y carrera (guardado en su perfil) y la lógica de backend que filtra, según ese perfil, qué eventos y alertas le llegan. | No. | A los alumnos les interesa principalmente su propio departamento (3,60/5 contra 2,20/5 de lo ajeno); el filtro evita mezclar eventos ajenos y que el canal push se sature o se silencie. |
| **Detección y carga del evento** (< 2 días desde que el DIIT o la universidad suben la publicación) | Nada de detección automática — no hay scraper ni integración con la página de la universidad, Intraconsulta o redes sociales. | Se simula: el equipo monitorea manualmente los canales oficiales y carga el evento directamente en la base de datos dentro del compromiso de 2 días. | Es una integración con fuentes externas, no el componente propio; automatizarla llevaría semanas de desarrollo. Lo que testea la hipótesis es si el alumno reacciona a una alerta oportuna, no cómo se detecta el evento en origen. |
| **Carga de la ficha canónica con información completa del evento** | La pantalla de ficha de evento dentro de la app (fecha, hora, lugar, descripción y link de inscripción). | El equipo tipea manualmente la información completa al cargar el evento (mismo proceso manual que la detección y carga), en vez de extraerla automáticamente de una fuente externa. | Extraer y estructurar esa información automáticamente desde fuentes heterogéneas es una integración compleja que no aporta a validar la hipótesis; lo que se mide es si una ficha completa —aunque cargada a mano— mejora la decisión de asistencia. |

### 9.3 Flujo principal del MVP

**Flujo: recibir y consultar un evento relevante a tiempo, sin tener que buscarlo.**

Se describe como flujo disparado por la alerta (push) y no por la consulta activa, porque es el que testea directamente la hipótesis: 12 de 20 alumnos no buscan información sobre eventos por su cuenta, y el motivo de pérdida más marcado es "no vi la publicación" (15 de 20). El repositorio centralizado (9.1) queda disponible como respaldo para quien sí quiera consultar por su cuenta, pero no es el recorrido que hay que validar.

0. *(Una sola vez, no es parte del recorrido recurrente)* El alumno descarga la app y configura su departamento y carrera.
1. El sistema detecta un evento nuevo de su departamento/carrera y le envía una notificación push al celular, según la frecuencia que eligió (diaria o resumen semanal).
2. El alumno toca la notificación y la app lo lleva directo a la ficha del evento, sin pasar por el listado general.
3. El alumno consulta la ficha completa: fecha, horario, lugar y los detalles necesarios para decidir si participar.
4. Si el evento requiere inscripción, el alumno se inscribe por el link externo presente en la ficha (la inscripción está fuera del scope del MVP).
5. Si todavía falta para la fecha del evento, el alumno puede activar un recordatorio adicional para 1 día* antes.

*Puede ser otro rango de tiempo, a definir.

### 9.4 Atributos de usabilidad priorizados

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

## 10. Aprendizaje de la prueba del MVP (nuevo en v4)

> El detalle de la prueba está en [docs/evidencia/tp5/](evidencia/tp5/README.md), y el criterio con que se evaluó, en la [Parte 1 del TP5](TP5-parte1.md).

### 10.1 Qué se probó

El viernes 30/10/2026, en el Polo Tecnológico de la UNLaM, tres alumnos de Ingeniería en Informática de 3.º, 4.º y 5.º año (U1 a U3) usaron el MVP en su celular durante una jornada, con dos sesiones observadas. Recibieron alertas de tres eventos reales del DIIT, cargados durante la jornada: dos capacitaciones (E1 y E2) y el cierre de una convocatoria a becas doctorales (E3).

### 10.2 Qué aprendimos

1. **En los eventos chicos, la alerta llega antes que los otros canales.** Fue la primera noticia en 5 de los 6 eventos notificados. Lo grande les llega igual: los tres conocían ExpoProyecto por carteles, Instagram o WhatsApp. U2: *"De lo grande, como la Expo, me entero porque está en todos lados; lo chico se me pasa."*
2. **El ruido no viene de otros departamentos, sino de otro público.** Las 4 alertas que no terminaron en nada eran eventos que no estaban dirigidos a ellos: una capacitación en eficiencia energética abierta a la comunidad y una convocatoria para graduados. Filtrar por departamento y carrera no alcanza (supuesto 11).
3. **La frecuencia baja puede romper la antelación.** U2 eligió el resumen semanal para no saturarse y no recibió nada durante la prueba. El lunes le llegó un evento a 3 horas de empezar y otro ya cerrado.
4. **Un evento de varios días no entra en el modelo.** ExpoProyecto figuró como pasada el día de la Teclatón y no se pudo marcar.
5. **Cuando la alerta le sirve, el alumno decide desde la ficha.** U1 y U3 activaron el recordatorio de E1 sin consultar otro canal, y los dos lo abrieron el lunes 2/11.

### 10.3 Decisión: perseverar

**Fundamento.**

- La hipótesis se sostiene según el criterio fijado antes de construir: 2 de 3 usuarios a favor y ninguno en contra.
- Ninguna alerta quedó sin usar por un motivo que la app no pueda resolver. El único motivo fue la relevancia, y eso es un problema de segmentación de la solución, no del problema elegido.
- No hay señal para un pivote. Nadie conocía de antes los eventos chicos que le interesaron, y la barrera de agenda apareció una sola vez, fuera de las alertas.

**Qué construimos ahora, en este orden:**

1. **Resúmenes que respetan la antelación.** Si un evento empieza antes del próximo resumen, se avisa en el acto. Los eventos vencidos no entran en el resumen, y Configuración muestra el día y la hora en que sale.
2. **Segmentación por público y por año.** Cada evento se carga con su público (alumnos de grado, graduados o comunidad) y, si corresponde, con el año. El perfil pide el año.
3. **Eventos de varios días**, con fecha de fin, estado "En curso" y recordatorio disponible mientras duren.
4. **Textos y accesos:**
   - "Nuevo evento del DIIT" cuando el evento es para todo el departamento;
   - la fecha de la publicación original, en lugar de la de la carga;
   - cuándo llega el recordatorio, en el botón y en Mis recordatorios;
   - un acceso a Configuración visible en el celular;
   - Inicio que se actualiza al volver a la app;
   - el costo en la ficha, que ya agregamos a las dos capacitaciones el 3/11.
5. **Registrar el toque en "Inscribirme"**, para medir la métrica 2 sin depender de la entrevista.

**Qué no construimos todavía:**

- compartir a WhatsApp, porque es una sola observación (supuesto 12);
- la integración con Intraconsulta;
- el módulo propio de inscripción.

### 10.4 Próxima prueba

- Al menos 5 alumnos de Informática **fuera de nuestro círculo**, que no sean compañeros de trabajo, elegidos entre quienes buscan eventos "Nunca" o "Esporádicamente" (pregunta 10 del TP2).
- Dos semanas de uso, para que entre al menos un resumen semanal, con la carga dentro de las 48 horas de cada publicación.
- La métrica 1 se cuenta **solo sobre los eventos que le interesan** al usuario, incluidos los eventos grandes.
- Al final se pregunta si fue al evento.

### 10.5 Qué nos haría pivotar

Lo dejamos escrito antes de la próxima prueba:

- Si la mayoría queda **en contra porque ya conocía** los eventos que le interesan → **pivote de canal**: llevar la alerta a donde ya están (supuesto 9).
- Si la mayoría no actúa porque **se superpone con la cursada** → **pivote de necesidad**: el problema deja de ser enterarse y pasa a ser poder ir (supuesto 7).

