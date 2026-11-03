# Resultados de la prueba

Las dos capas se analizan por separado, contra lo definido en la [Parte 1](../../TP5-parte1.md) antes de construir. El detalle de cada observación está en [U1.md](U1.md), [U2.md](U2.md), [U3.md](U3.md) y en el [registro del servidor](registro-servidor.md).

## Capa de usabilidad

### Tareas

| Tarea | U1 | U2 | U3 |
|---|---|---|---|
| T1 Configurar | Completa, 0:41 | Completa, 1:28 | Completa, 1:05 |
| T2 Alerta → ficha | Completa, 15 s | No hubo alerta (resumen semanal) | Completa, 12 s |
| T3 Recordar un evento | Completa, 0:10 | **No completada**: Recordarme deshabilitado en ExpoProyecto | Completa, 0:08 |
| T4 Bajar interrupciones | Completa, 1:10 (55 s buscando un engranaje) | Completa, 0:35, por "Cambiar" | Completa, 0:50 |
| T5 Ver eventos marcados | Completa, 0:25 | Completa, 0:40 (lista vacía) | Completa, 0:30; no encontró cuándo le avisan |
| Pedidos de ayuda | 0 | 1 (13:00, "¿Me tenía que llegar algo?") | 0 |

En T3, U1 y U3 ya habían activado el recordatorio por su cuenta antes de que se leyera la tarea.

### Criterio de usabilidad

**Se cumple.** La Parte 1 pedía que al menos 2 de los 3 usuarios completaran la configuración inicial y llegaran de la alerta a la ficha sin ayuda.

- Los tres completaron la configuración inicial.
- U1 y U3 llegaron de la alerta a la ficha en 15 y 12 segundos, sin ayuda.
- U2 no pudo intentarlo porque la alerta no le llegó, y pidió ayuda una vez.

Contrastado con el registro del servidor, los tres abrieron al menos una ficha desde una notificación: U1 y U3 el 30/10, y U2 el 2/11, desde el resumen semanal.

### ¿Aparecieron los problemas que anticipó el TP4?

| Punto del TP4B | Qué observamos | ¿Reapareció? |
|---|---|---|
| Leyenda de cuándo avisa Recordarme (aceptado) | U1 leyó el aviso y entendió "un día antes" (12:56). U3 no lo vio porque desapareció a los 4 segundos (12:53:40), y en T5 preguntó "¿Y cuándo me avisa?". | **A medias** → N6 |
| Quitar "Descubrir"; "Inicio" como único acceso (aceptado) | Nadie se perdió al volver de una ficha. | No |
| Cambiar la carrera desde Configuración (aceptado) | Nadie lo necesitó. U3 abrió el selector de departamento en T1. | Sin observación |
| Pop-up con frecuencia y permiso después del onboarding (aceptado) | Los tres activaron las notificaciones desde el pop-up. U2 eligió el resumen semanal sin saber cuándo llega. | No, pero contribuyó al resultado de U2 |
| "Recordarme revisar la app" (aceptado) | Nadie lo activó ni lo confundió con las alertas. | No |
| Cada evento nuevo / Resumen diario / Resumen semanal (aceptado) | U2 eligió una frecuencia al configurar y U3 la cambió en T4 sin dudar. | No |
| Toda la tarjeta tocable en el celular (aceptado en parte) | U2 abrió E1 tocando la imagen de la tarjeta (13:01). | No |
| Barra lateral de otros departamentos (cuestionado) | U3 entró a Ciencias de la Salud y volvió con "Volver" sin confusión (12:40). | No |
| Carga sin vista previa, resuelta con segunda revisión (cuestionado) | Las tres cargas salieron sin errores. Pero la ficha de E1 no tenía el costo, y U1 lo encontró en UNLaM Actividades (12:55). | No como error de carga; sí como ficha incompleta (supuesto 8) |

### Problemas nuevos

Severidad en la escala de 1 a 4 del TP4: 1 cosmético, 2 menor, 3 grave, 4 catastrófico.

| # | Problema | Observación | Sev. |
|---|---|---|---|
| N1 | Un evento de varios días se muestra como pasado desde el primer día, y "Recordarme" queda deshabilitado. | U2, 12:58: "¿Pasado? Si hoy es la Teclatón." A las 13:05 no pudo marcar ExpoProyecto y T3 quedó sin completar. | 3 |
| N2 | Los resúmenes salen en un horario fijo (el semanal, los lunes a las 16:00) e incluyen eventos que ya cerraron o que empiezan enseguida. | Registro, 2/11 16:00: E2 empezaba en 3 horas y E3 había cerrado el viernes. | 3 |
| N3 | Todas las alertas dicen "Nuevo evento de tu carrera", aunque el evento sea para todo el departamento. | U1 sobre E2: "Leí 'de tu carrera' y pensé que era algo de sistemas". U3 lo repitió en la pregunta final. | 2 |
| N4 | En el celular, Configuración y Mis recordatorios solo están dentro del menú ☰. | U1 pasó 55 segundos buscando un engranaje en T4. U2 llegó a Configuración por "Cambiar". | 2 |
| N5 | "Publicado hace…" cuenta desde la carga en Nodo, no desde la publicación original. | U2, 12:35: "¿Hace 15 horas? Lo vienen anunciando hace dos semanas." | 2 |
| N6 | Cuándo llega el recordatorio solo aparece en un aviso de 4 segundos. Ni el botón ni Mis recordatorios lo repiten. | U3 no vio el aviso (12:53:40) y en T5 preguntó "¿Y cuándo me avisa?". | 2 |
| N7 | Inicio no se actualiza solo: para ver un evento nuevo hay que recargar la página. | U2 recargó desde el menú de Chrome para ver E1 (13:01). | 1 |

## Capa de negocio

### Métrica 1: alertas que fueron la primera noticia del evento

| Usuario | Evento | ¿Lo conocía antes de la alerta? | ¿Cuenta como primera noticia? |
|---|---|---|---|
| U1 | E1 | No | Sí |
| U1 | E2 | No | Sí |
| U1 | E3 | No | Sí |
| U3 | E1 | No | Sí |
| U3 | E2 | No | Sí |
| U3 | E3 | Sí, por una historia de Instagram del DIIT del 26/10 | No |
| U2 | E1, E2 y E3 | No se le notificaron antes del fin de la segunda sesión | Fuera del denominador |

**Métrica 1 = 5 de 6 = 83 %.**

### Métrica 2: alertas que terminan en una decisión sin salir de la app

| Alerta abierta | ¿Recordatorio o inscripción sin consultar otro canal? | Motivo, si no |
|---|---|---|
| U1 – E1 | Sí: Inscribirme y Recordarme | — |
| U1 – E2 | No | No le interesaba: "es de energía" |
| U3 – E1 | Sí: Recordarme | — |
| U3 – E3 | No | No le interesaba: "es para graduados" |

**Métrica 2 = 2 de 4 = 50 %.** Las dos alertas que no se abrieron (U1 – E3 y U3 – E2) quedan fuera del cálculo, y el motivo también fue que no les interesaban. En la tabla de la Parte 1, ese motivo corresponde a **segmentación**. Ningún usuario dio como motivo que faltara información, que chocara con la cursada o que llegara tarde.

### Clasificación contra el criterio

| Usuario | Caso | Por qué |
|---|---|---|
| U1 | **A favor** | E1: primera noticia por la alerta; fue a la inscripción y activó el recordatorio sin consultar otro canal. |
| U2 | **Sin datos** | No recibió ninguna alerta hasta el fin de la segunda sesión: quedaron esperando el resumen semanal. |
| U3 | **A favor** | E1: primera noticia por la alerta; activó el recordatorio sin consultar otro canal. |

**Con 2 de 3 usuarios a favor, la hipótesis se sostiene** según la regla de la Parte 1.

### Lo que las métricas no muestran

- **El evento que más les importaba no se notificó.** ExpoProyecto ya estaba en curso y los tres la conocían por otros canales: WhatsApp (U1), carteles e Instagram (U2), carteles y un docente (U3).
- **Gran parte de la métrica 1 son eventos que no querían.** Si en el numerador se cuentan solo los eventos que además le interesaban al usuario, la métrica baja a 2 de 6 (33 %).
- **Hay una barrera de agenda fuera de la métrica.** U2 abrió E1 desde Inicio y dijo "curso a esa hora. No puedo." (supuesto 7).
- **La antelación no se puede evaluar en esta prueba.** Las cargas se retrasaron a propósito. Sí se ve que la meta del 80 % de alertas con 7 días o más depende de cuándo publica el DIIT. De los cinco eventos del DIIT publicados en octubre que están en la base, con la carga a 48 horas habrían llegado 2 con 7 días o más, y cargándolos en el acto, 3.
- **No sabemos si se inscribieron ni si van a ir.** El MVP no registra el toque en "Inscribirme".

## Decisión

**Perseverar.** El fundamento y lo próximo a construir están en el punto 10 del [brief v4](../../brief.md).
