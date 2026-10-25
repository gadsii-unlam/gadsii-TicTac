# Nodo UNLaM — MVP de GADS II, TP5 (TicTac)

**Grupo TicTac:** Agustín Zabalgoitia, Florencia Berenice Licarzi, Lucas Nicolás Romero, Lucila Quiroga Piegari y Neri Martin Palacios.

Una plataforma de avisos y eventos académicos orientada, en esta validación, a estudiantes de Ingeniería en Informática del DIIT (UNLaM). Se construyeron los flujos de **alumno**, no la gestión institucional de eventos ni una integración con redes/Intraconsulta.

## Cómo ejecutarlo

Requiere **Node.js 20 o superior**. No utiliza base de datos externa, cuenta institucional, API externa ni dependencias de NPM. El servidor y el cliente están en el mismo proceso.

```bash
npm start
```

Abrir **http://localhost:3000**. Si el puerto está ocupado: `PORT=3001 npm start` (macOS/Linux; en PowerShell `$env:PORT=3001; npm start`). La primera ejecución crea `server/data/db.json` con **cuatro eventos ficticios de prueba** y `server/data/vapid.json` para las notificaciones. Estos archivos están ignorados por Git y **nunca** deben subirse, porque contienen suscripciones y claves privadas. Para continuar con los mismos dispositivos no borrar el archivo VAPID.

Ejecutar las pruebas automáticas: `npm test`.

### Probar con un teléfono real

Web Push requiere HTTPS, salvo en **localhost**. Para que el móvil acceda desde otro equipo **hay que publicar el servidor detrás de HTTPS válido** y abrir la URL HTTPS desde el teléfono. En Android compatible, permitir notificaciones del navegador/sitio. En iPhone/iPad, se requiere iOS 16.4+ y **agregar la web a la pantalla de inicio** antes de solicitar notificaciones; en iOS normal dentro de Safari no se admite el mismo flujo de Push API. El sistema operativo/navegador controla si muestra avisos en pantalla bloqueada.

**No basta con acceder por una IP local en HTTP**: el navegador puede bloquear el registro del service worker y Web Push. El servidor debe seguir encendido para emitir los avisos pendientes. No se ha desplegado una instancia pública; la sesión final con personas reales queda pendiente. La aceptación de Web Push por proveedores externos no pudo verificarse en este entorno desconectado; sí se verificó por pruebas el cifrado, VAPID y la lógica automática de colas.

### Recorrido del alumno

1. Seleccionar departamento y carrera (sin registro). Se filtran en el backend los eventos propios.
2. Aceptar el diálogo explicativo y el permiso real del sistema para notificaciones.
3. Recibir un push sobre un evento nuevo, tocarlo y abrir **directo su ficha completa** (fecha, horario, lugar, descripción y vínculo externo cuando corresponde).
4. Activar **Recordarme**, que programará el aviso dentro de las 24 h anteriores al evento, o visitar la inscripción en una página externa (el módulo de inscripciones no se construye).
5. Consultar el Inicio; en móvil toda la tarjeta abre el evento. En Configuración, cambiar carrera, activar/desactivar notificaciones y elegir **Cada evento nuevo / Resumen diario / Resumen semanal**. “Recordarme revisar la app” es un aviso periódico opcional, separado del recordatorio de eventos.

Los resúmenes se despachan en su primera ejecución **posterior a las 19:00 UTC** (16:00 de Argentina cuando rige UTC−3), a diario o lunes. El proceso ejecuta el scheduler cada 30 segundos, sin dependencia de cron. Si no hay suscripción válida o el servicio push rechaza el envío, se registra la incidencia. Un `push_accepted` **no confirma visualización en pantalla**.

### Agregar eventos manualmente (solo equipo)

La pantalla administrativa **no está incluida en la interfaz del alumno**, tal como decidió TicTac en el TP4. Con el servidor ya iniciado, otro terminal puede ejecutar:

```bash
npm run demo:event
```

Esto carga un **evento nuevo ficticio**, distinto de los cuatro iniciales, y dispara automáticamente un push a los alumnos suscriptos que corresponden a departamento/carrera. Para un evento real, preparar un archivo `.json` según `docs/configuracion/ejemplo-evento.json`, completar fecha futura, fuente verificada, información completa, y usar:

```bash
npm run add:event -- ruta/al/evento.json
```

La carga manual debe realizarse antes de 48 h de la publicación oficial y **ser revisada por otra persona antes de la ejecución del comando**, ya que publicar crea la cola de avisos. El comando obtiene la clave privada de administración desde `server/data/admin.key`, sin exponerla en el navegador. Alternativamente se puede utilizar el endpoint interno autenticado `POST /api/admin/events`, con `Authorization: Bearer <clave>`. No publicar jamás la clave ni el directorio `server/data/`.

**No usar ejemplos ficticios como evidencia** de eficacia real, anticipación de siete días o asistencia a eventos oficiales. Los ejemplos no representan actividades organizadas por la UNLaM.

## Documentación, alcance y pruebas

- [TP5 - Parte 1: métricas y umbrales PREVIOS a la construcción](docs/TP5-parte1.md) (borrador sujeto a aprobación del equipo, consigna §11).
- [TP5 - Parte 2: arquitectura, alcance y correcciones del TP4](docs/TP5-parte2.md).
- [Registro del trabajo con IA](docs/prompts.md).
- [Brief v3 (TP3)](docs/brief.md) y [decisiones de scope y flujo](docs/TP3.md).
- [Procedimiento de prueba manual y soporte de evidencia](docs/evidencia/tp5/README.md).

**Limitación arquitectónica explícita:** el TP3 anticipaba React Native. Esta copia implementa una **PWA móvil/web nativa del navegador (HTML, CSS, JavaScript, service worker y Web Push), con backend Node.js**. Se mantuvo el flujo y las funcionalidades, pero **no el framework**: no es una aplicación React Native/Expo ni un binario descargable de una tienda. Si el docente exige React Native explícitamente, habrá que portar la UI y el proveedor de notificaciones antes de dar la Parte 2 por conforme. No se describe la PWA como React Native.

**No completado:** pruebas con tres personas reales (Parte 3), interpretación de resultados (Partes 4 y 5), actualización del brief a v4, despliegue público y validación real de entrega en teléfonos. Los datos generados por código no se presentan como datos empíricos.
