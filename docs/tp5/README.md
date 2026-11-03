# TP5 — Evidencia de la prueba con usuarios

Registro de la prueba del MVP con tres usuarios reales, identificados como U1, U2 y U3, igual que en el TP2. Los nombres no se publican en el repositorio.

| Archivo | Qué contiene |
|---|---|
| [guia-de-sesion.md](guia-de-sesion.md) | Tareas, qué se observa, cómo se registra y preguntas finales, tal como se prepararon antes de la sesión. |
| [U1.md](U1.md), [U2.md](U2.md), [U3.md](U3.md) | Notas de observación de cada usuario: cronología, tiempos, citas textuales y respuestas. |
| [resultados.md](resultados.md) | Métricas, clasificación de cada usuario contra el criterio de la [Parte 1](../../TP5-parte1.md) y problemas de usabilidad. |
| [registro-servidor.md](registro-servidor.md) | Extracto anonimizado del registro de envíos, aperturas y recordatorios del servidor, del 29/10 al 3/11. |

## Datos de la prueba

- **Fecha y lugar:** viernes 30/10/2026, en el Polo Tecnológico de la UNLaM (San Justo).
- **Usuarios:** tres estudiantes de Ingeniería en Informática del DIIT, de 3.º, 4.º y 5.º año. Los tres son compañeros de trabajo nuestros en el Polo Tecnológico.
- **Dispositivo:** el celular Android de cada usuario, con Chrome, entrando a <https://nodounlam.zabalgoitia.ar>. No se instaló nada: la app se usó como web, con notificaciones Web Push.
- **Equipo:** tres integrantes observaron, uno por usuario y en salas separadas. Un cuarto integrante cargó los eventos por detrás con el cargador manual. El quinto revisó cada JSON contra la publicación original antes de la carga y siguió el registro del servidor.
- **Registro:** notas con hora, cronómetro, citas textuales y el registro del servidor. Los tres aceptaron participar y que usemos sus respuestas sin nombre. Prefirieron que no grabemos la pantalla, así que no hay grabaciones.

| Usuario | Año | Situación | Frecuencia elegida |
|---|---|---|---|
| U1 | 4.º | Trabaja y cursa | Cada evento nuevo |
| U2 | 5.º | Trabaja de día y cursa de noche | Resumen semanal |
| U3 | 3.º | Trabaja y cursa | Cada evento nuevo; en la segunda sesión pasó a Resumen diario |

## Cronología del día

| Hora | Qué pasó |
|---|---|
| Jueves 29/10, 21:35 | Despliegue del servidor. Al arrancar se publican solos los eventos de `mvp/src/server/events/`: ExpoProyecto 2026, la Charla "¿Cuánto vale tu idea?" y tres eventos de Ciencias de la Salud. Retiramos de la base los cuatro eventos de muestra que crea la primera ejecución. |
| Viernes 30/10, 12:30 – 13:15 | **Primera sesión**, en paralelo y en tres salas: consentimiento, tareas T1 a T3. |
| 12:52:21 | Carga en vivo de **E1**. |
| 13:15 – 17:30 | **Período de uso**: la jornada de trabajo. Cada usuario sigue con el celular como siempre. |
| 15:05:12 | Carga de **E2**. |
| 16:10:09 | Carga de **E3**. |
| 17:30 – 18:05 | **Segunda sesión**: preguntas por evento, tareas T4 y T5, preguntas finales. Al terminar, clasificamos a cada usuario. |
| Lunes 2/11, 16:00 | El resumen semanal le llega a U2. |
| Lunes 2/11, 18:30 | Los recordatorios de E1 les llegan a U1 y U3. |
| Martes 3/11 | Cierre del seguimiento del registro del servidor. |

## Eventos usados

Los tres eventos de la prueba son publicaciones reales del DIIT. Se cargaron durante la jornada, y no al desplegar, porque el servidor solo encola avisos para los perfiles que ya existen cuando se carga el evento: la alerta tenía que llegar después de la configuración inicial de cada usuario. Los tres JSON se guardaron en `mvp/src/server/events/` el 3/11, para que viajen con el despliegue.

| Código | Evento | Publicación del DIIT | Carga en Nodo | Inicio del evento | Margen al cargar |
|---|---|---|---|---|---|
| E1 | Capacitación: Tecnologías Aplicadas a la Comunicación Digital | 20/10 14:26 (LinkedIn) | 30/10 12:52 | 3/11 18:30 | 101,6 h (4,2 días) |
| E2 | Capacitación: Eficiencia Energética | 20/10 14:26 (LinkedIn) | 30/10 15:05 | 2/11 19:00 | 75,9 h (3,2 días) |
| E3 | Cierre de convocatoria: Becas Doctorales CICPBA | 26/10 15:15 (Instagram) | 30/10 16:10 | 30/10 23:59 | 7,8 h |

Los tres eventos están dirigidos a todo el departamento (`career: ""`), no a una carrera. Ya estaban en la base, sin generar avisos:

- **ExpoProyecto 2026**, del miércoles 28 al viernes 30/10. La app la mostraba como pasada, porque solo guarda la fecha de inicio (28/10 18:00). El viernes 30 era el día de la Teclatón.
- **Charla "¿Cuánto vale tu idea?"**, del 21/10, ya pasada.

**Ninguna carga cumplió el compromiso de 48 horas del TP3.** E1 y E2 se cargaron 10 días después de su publicación y E3, 4 días después. Fue a propósito, para que la alerta llegara durante la sesión, así que la antelación no se usa como evidencia en esta prueba.

## Cambios respecto del plan de la Parte 1

La Parte 1 preveía una primera sesión, unos días de uso y una segunda sesión. Como los tres usuarios trabajan con nosotros y ese viernes coincidíamos todos en el Polo, hicimos las dos sesiones el mismo día, y la jornada de trabajo fue el período de uso. El criterio de éxito no cambió. Este cambio tuvo tres consecuencias:

1. Solo entraron tres eventos reales en la ventana de la prueba.
2. El resumen semanal de U2 quedó fuera de la ventana. Ver [U2.md](U2.md) y el punto 9 del informe.
3. No se puede evaluar la antelación, porque la carga la cronometramos nosotros.

## Sesgos y limitaciones

- **Cercanía:** los tres son compañeros de trabajo y sabían que el producto es nuestro. Pueden haber sido más amables o haber estado más atentos al celular que un usuario cualquiera.
- **Perfil no filtrado:** la encuesta del TP2 fue anónima, así que no sabemos si respondieron. Coinciden con el perfil del TP2 (Informática, de 3.º a 5.º año, se informan por el celular), pero no verificamos que sean pasivos en la búsqueda de eventos.
- **Valores por defecto:** la configuración inicial viene con DIIT e Ingeniería en Informática ya elegidos. Por eso T1 no prueba que el usuario sepa elegir su carrera: U1 terminó sin abrir los selectores.
- **Eventos de todo el departamento:** ninguno de los tres eventos era específico de Informática. La prueba no ejercita el filtro por carrera.
- **El evento más relevante no se notificó:** ExpoProyecto estaba en curso, ya cargada y sin aviso. Los tres la conocían por otros canales.
- **Sin grabación:** todo lo que dice "hizo" sale de las notas del observador, del cronómetro y del registro del servidor.

## Privacidad

El registro del servidor se publica como extracto. Reemplazamos el identificador de cada dispositivo por U1, U2 o U3 y no incluimos endpoints, claves de suscripción ni el archivo `db.json`. Las notas no incluyen nombres, correos ni datos de contacto.
