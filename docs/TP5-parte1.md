# TP5 - Parte 1

### 1. Dos métricas accionables

Para evaluar si Nodo UNLaM realmente ayuda a los estudiantes a enterarse de actividades que les interesan, elegimos dos métricas que se pueden medir en la prueba con usuarios.

#### Métrica accionable 1 — Alertas que fueron la primera noticia del evento

Capa de negocio: mide el problema de alcance.

**Cálculo:** `(eventos reales notificados de los que el usuario se enteró por primera vez por la alerta / eventos reales notificados) × 100`.

Mide la parte de la hipótesis que dice que el aviso no le llega al estudiante. En el TP2, 15 de 20 alumnos marcaron "no vi la publicación" como motivo para perderse un evento.

Para calcularla, en la sesión con el usuario mostramos la lista de eventos notificados y preguntamos por cada uno, de forma abierta: "¿Conocías este evento? ¿Cuándo y por dónde te enteraste?". Las respuestas se cruzan con el registro de envíos y aperturas de la app.

Si el resultado es alto, la app llega a donde no llegan los otros canales, y perseveramos en el alcance. Si es bajo, porque ya conocían los eventos por Instagram o WhatsApp, el problema de alcance no existe para estos usuarios. En ese caso, las opciones son un pivote de necesidad (ver la métrica 2) o un pivote de canal: llevar la alerta a donde ya están, según el supuesto 9 del brief.

#### Métrica accionable 2 — Alertas que terminan en una decisión sin salir de la app

Capa de negocio: mide la ficha completa y la antelación.

**Cálculo:** `(alertas de eventos reales abiertas tras las cuales el usuario activó el recordatorio o fue a la inscripción, sin consultar otro canal / alertas de eventos reales abiertas) × 100`.

Mide la parte de la hipótesis que promete avisar "con antelación suficiente y con la información completa para decidir". La línea de base del TP2 es la brecha entre interés y asistencia con 8 de 20 alumnos que combinan interés alto y asistencia baja.

El recordatorio ya queda registrado en la app. El toque en el enlace de inscripción hoy no se registra: hasta agregarlo, lo confirmamos en la segunda sesión. Cuando el usuario no hizo nada con la alerta, le preguntamos el motivo en esa misma sesión. Ese motivo indica qué decisión tomar:

| Motivo | Diagnóstico | Qué se hace |
|---|---|---|
| Faltaba información | Ficha insuficiente (supuesto 8) | Mejorar el contenido de la ficha |
| Choca con la cursada | Barrera de agenda (supuesto 7, U12 y U19) | La cadena causal de la hipótesis se rompe: pivote de necesidad |
| Llegó tarde | Antelación | Ver dónde estuvo la demora: si el equipo cargó el evento después de las 48 horas comprometidas en el TP3, mejorar la carga; si la universidad lo publicó tarde, registrar esa limitación |
| No le interesaba | Segmentación | Hoy se filtra solo por departamento y carrera; la hipótesis dice "carrera y año" |

### Una métrica vanidosa

Una métrica que puede parecer positiva sin demostrar que el producto cumple su objetivo es la **cantidad total de instalaciones de Nodo UNLaM**. También podrían contarse las visitas a la pantalla de inicio.

Tener muchas instalaciones no asegura que los estudiantes se enteren de los eventos que les interesan. Ese número no muestra si las alertas llegaron a tiempo, si alguien abrió la ficha ni si encontró información suficiente para decidir qué hacer. Por eso, las instalaciones no alcanzan para evaluar nuestra hipótesis de valor: necesitamos observar el uso y comprobar si el recorrido de la alerta a la ficha funciona.

### Criterio de éxito y refutación de la hipótesis

Definimos estos criterios antes de la prueba con usuarios y evaluamos por separado la usabilidad y la hipótesis de valor.

#### Usabilidad

El recorrido principal funciona si al menos 2 de los 3 usuarios completan la configuración inicial y llegan de la alerta a la ficha del evento sin ayuda. Lo observamos en la primera sesión, con una alerta real que se envía durante esa sesión, y lo contrastamos con las aperturas desde la notificación que registra la app durante los días de uso.

#### Hipótesis de valor

Al terminar la segunda sesión, clasificamos a cada usuario en uno de estos cuatro casos:

| Caso | Qué tiene que pasar |
|---|---|
| **A favor** | Tiene al menos un evento real del que se enteró por la alerta (métrica 1) y sobre el que actuó desde la ficha, activando el recordatorio o yendo a la inscripción, sin consultar otro canal (métrica 2). |
| **En contra** | No tiene ningún evento a favor, y cada evento real que se le notificó lo conocía antes por otros canales o no actuó sobre él por un motivo que la app no resuelve, como la superposición con la cursada. |
| **Problema de la solución** | No tiene ningún evento a favor, pero en al menos un evento dejó de actuar por un motivo que la app sí puede resolver: faltaba información, la alerta llegó tarde o el evento no le interesaba. |
| **Sin datos** | No recibió ninguna alerta de un evento real, porque el permiso de notificaciones estaba bloqueado, el envío falló o solo hubo eventos simulados. |

Con esa clasificación:

- **La hipótesis se sostiene** si al menos 2 de los 3 usuarios quedan a favor.
- **La hipótesis se refuta** si al menos 2 de los 3 usuarios quedan en contra. Si la causa es que ya conocían los eventos, el problema de alcance no existe para ellos (métrica 1). Si la causa es un motivo que la app no resuelve, el motivo de la hipótesis se rompe. En los dos casos, eso define el pivote que vamos a realizar.
- **La prueba es inconclusa** si al menos 2 de los 3 usuarios quedan sin datos. Una falla técnica de las notificaciones no se interpreta como una refutación de la necesidad del usuario.
- **En cualquier otro caso**, la hipótesis no se sostiene todavía, pero tampoco queda refutada. Corregimos la solución según los motivos registrados y volvemos a probar.
