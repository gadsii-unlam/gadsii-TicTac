# TP5 - Parte 1

### 1. Dos métricas accionables

Para evaluar si Nodo UNLaM realmente ayuda a los estudiantes a enterarse de actividades que les interesan, elegimos dos métricas. Las definimos antes de implementar el MVP para poder usarlas después y decidir qué conviene mejorar.

#### Métrica accionable 1 — Eventos relevantes que no se abren desde la alerta

Esta métrica nos permite ver qué proporción de las alertas sobre eventos relevantes para cada estudiante no termina en la apertura de la ficha dentro de las 24 horas siguientes.

**Cálculo:** `(alertas relevantes sin apertura de la ficha desde la notificación en 24 h / total de alertas relevantes enviadas) × 100`.

Para calcularla, registramos el evento, la carrera y el departamento a los que está dirigido, cuándo se envió la alerta y si la ficha se abrió desde esa notificación o desde el inicio de la aplicación. También contrastamos esos datos con lo observado durante las pruebas y preguntamos de manera neutral si el evento le resultaba relevante al estudiante. Que el servicio Web Push acepte un envío no significa necesariamente que la persona haya visto la notificación.

Como objetivo para un período de uso real, buscamos que menos del **30 %** de las alertas relevantes quede sin apertura. El valor toma como referencia la reducción de oportunidades perdidas planteada en el brief v3. Es una medida operativa que nos sirve como aproximación; no es exactamente la misma variable que el 75 % mencionado en el TP2.

Si no alcanzamos el objetivo, primero revisaríamos si los estudiantes dieron permiso para recibir notificaciones y si estas llegaron. Después comprobaríamos la segmentación, la claridad del mensaje y si el paso de la alerta a la ficha resulta sencillo. Si los avisos llegan pero no se abren, nos enfocaríamos en su relevancia y presentación antes de sumar nuevas funciones.

#### Métrica accionable 2 — Alertas enviadas con suficiente anticipación

Esta métrica indica qué proporción de las alertas sobre **eventos reales** se envía al menos **7 días completos (168 horas)** antes de que empiece la actividad.

**Cálculo:** `(alertas de eventos reales enviadas con al menos 168 h de anticipación / total de alertas de eventos reales enviadas) × 100`.

Para medirla, registramos cuándo publicó el evento la institución, cuándo se cargó en el sistema, a qué hora empieza y cuándo el servicio de notificaciones aceptó el envío. Durante las pruebas con estudiantes, además, comprobamos si recibieron la alerta. Informamos por separado los envíos aceptados por el servicio y las recepciones que pudimos confirmar.

El objetivo es que al menos el **80 %** de las alertas llegue con siete días de anticipación, como plantea el brief v3. De todos modos, el compromiso del TP3 de cargar los eventos dentro de las 48 horas no alcanza por sí solo para cumplirlo: si la universidad publica la actividad tarde, también se reduce el tiempo disponible para avisar.

Si el resultado queda por debajo del objetivo, identificaríamos dónde se produjo la demora. Si el equipo cargó el evento tarde, mejoraríamos el seguimiento y la carga manual; si la publicación oficial fue tardía, registraríamos esa limitación; y si el problema estuvo en el envío, revisaríamos el sistema de notificaciones. No sumaríamos funciones si la causa real es que la información llegó tarde.

**Alcance de la medición.** Para evaluar estas métricas necesitamos eventos reales y observar el uso durante un período suficiente. Los datos de prueba, las demostraciones y las primeras sesiones con tres usuarios no permiten afirmar, por sí solos, que se alcanzaron los porcentajes propuestos.

### 4. Una métrica vanidosa

Una métrica que puede parecer positiva sin demostrar que el producto cumple su objetivo es la **cantidad total de instalaciones de Nodo UNLaM**. También podrían contarse las visitas a la pantalla de inicio.

Tener muchas instalaciones no asegura que los estudiantes se enteren de los eventos que les interesan. Ese número no muestra si las alertas llegaron a tiempo, si alguien abrió la ficha ni si encontró información suficiente para decidir qué hacer. Por eso, las instalaciones no alcanzan para evaluar nuestra hipótesis de valor: necesitamos observar el uso y comprobar si el recorrido de la alerta a la ficha funciona.

### Criterio de éxito y refutación de la hipótesis

Para evaluar si Nodo UNLaM cumple su objetivo, definimos previamente qué resultados consideraríamos favorables y cuáles nos llevarían a revisar nuestra hipótesis.

En una primera instancia, realizaremos pruebas con tres estudiantes del segmento identificado en el TP2. Consideraremos que el recorrido principal funciona si al menos dos de los tres usuarios reciben una notificación real, acceden a la ficha del evento sin ayuda y encuentran la información necesaria para decidir si les interesa participar.

Para considerar que existe evidencia inicial favorable a la hipótesis de valor, también esperamos que al menos dos de los tres usuarios encuentren relevante el evento y puedan explicar cómo la información recibida les permite tomar una decisión sin consultar otros canales.

En cambio, si dos o más usuarios no consiguen acceder a la información desde la notificación o necesitan recurrir a fuentes externas para comprender el evento, consideraremos que la solución todavía no demuestra el valor esperado. Analizaremos si el problema se encuentra en las notificaciones, la interacción o la información presentada.

Estas primeras pruebas no permiten validar estadísticamente los objetivos del brief. Para eso será necesario observar el uso durante un período más prolongado, verificar los porcentajes establecidos en nuestras métricas y volver a relevar si disminuyó la cantidad de estudiantes que se pierden eventos relevantes.

Si las notificaciones fallan por problemas técnicos, no interpretaremos automáticamente el resultado como una refutación de la necesidad del usuario, sino como una prueba inconclusa del mecanismo propuesto.
