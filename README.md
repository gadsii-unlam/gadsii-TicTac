# Nodo UNLaM — MVP de GADS II, TP5 (TicTac)

**Grupo TicTac:** Agustín Zabalgoitia, Florencia Berenice Licarzi, Lucas Nicolás Romero, Lucila Quiroga Piegari y Neri Martin Palacios.

Una plataforma de avisos y eventos académicos orientada, en esta validación, a estudiantes de Ingeniería en Informática del DIIT (UNLaM). Se construyeron los flujos de **alumno**, no la gestión institucional de eventos ni una integración con redes/Intraconsulta.

## Cómo ejecutarlo

Requiere **Node.js 20 o superior**. En `mvp` hay un solo proyecto con el backend Node (API, datos y avisos) y la app **React Native con Expo** (pantallas del alumno).

Para abrir la app en el navegador de esta PC, desde la raíz del repositorio:

```powershell
cd .\mvp
npm run web
```

Abrí **http://localhost:8081**. Este comando inicia juntos Expo web y Node. Para iniciar Expo junto al backend para un dispositivo o emulador:

```powershell
cd .\mvp
npm start
```

El backend queda disponible en **http://localhost:3000**. Si aparece `EADDRINUSE`, el puerto ya está ocupado: cerrá la otra instancia o elegí otro puerto y actualizá la URL que usará Expo, por ejemplo `$env:PORT=3001; $env:EXPO_PUBLIC_API_URL="http://localhost:3001"; npm run web`. La primera ejecución crea `mvp/src/server/data/db.json` con **cuatro eventos ficticios de prueba** y archivos locales para las claves y suscripciones. La carpeta de datos está ignorada por Git y **no debe compartirse ni subirse**.

### Ejecutar en Android o iOS

Para un emulador Android, configurar la URL de la API antes de arrancar:
```powershell
cd .\mvp
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:3000"
npm start
```

`10.0.2.2` permite que el emulador Android llegue al servidor de la PC. En un teléfono físico, usar la dirección IP local de la PC, por ejemplo `$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:3000"`, y permitir la conexión en el firewall. El teléfono y la PC deben estar en la misma red. Para distribución y uso fuera de la red local, configurar una URL HTTPS del backend.

Para crear el cliente de desarrollo, iniciar sesión y vincular EAS desde `mvp`:

```powershell
cd .\mvp
npx eas-cli@latest login
npx eas-cli@latest init
$env:EXPO_PUBLIC_EAS_PROJECT_ID="<id-del-proyecto>"
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:3000"
npx eas-cli@latest build --profile development --platform android
```

Instalar la compilación en el emulador o teléfono y luego ejecutar `npm start` desde `mvp`. Para iOS, usar `--platform ios` y configurar un endpoint accesible desde el dispositivo. Las notificaciones push remotas requieren además las credenciales de Android/iOS correspondientes; Expo Go no sustituye esta compilación para probarlas. Sin el ID y las credenciales del proyecto se pueden probar los flujos de la app, pero no registrar un token push válido.

Ejecutar las pruebas del backend desde `mvp`: `npm test`.

### Probar con un teléfono real

Las notificaciones se entregan a través de Expo Push. El sistema operativo controla su presentación y los permisos. El backend debe permanecer encendido para enviar las alertas programadas. No hay un backend público desplegado; el uso desde otros dispositivos requiere configurar una dirección accesible y HTTPS para un entorno estable.

### Notificaciones de escritorio

En la versión web, "Activar notificaciones" registra el service worker `mvp/public/sw.js` y suscribe el navegador por Web Push con la clave VAPID del backend. El navegador solo lo permite en `localhost` o con HTTPS. Si se cambia de backend (otra clave VAPID), la app renueva la suscripción al volver a activarlas.

### Recorrido del alumno

1. Seleccionar departamento y carrera (sin registro). Se filtran en el backend los eventos propios.
2. Activar las notificaciones desde la app y aceptar el permiso del sistema.
3. Recibir un push sobre un evento nuevo, tocarlo y abrir **directo su ficha completa** (fecha, horario, lugar, descripción y vínculo externo cuando corresponde).
4. Activar **Recordarme**, que programará el aviso dentro de las 24 h anteriores al evento, o visitar la inscripción en una página externa (el módulo de inscripciones no se construye).
5. Consultar los eventos y, en Configuración, cambiar carrera, elegir la frecuencia (**Cada evento nuevo / Resumen diario / Resumen semanal**) y configurar el aviso opcional “Recordarme revisar la app”.

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

La carga manual debe realizarse antes de 48 h de la publicación oficial y **ser revisada por otra persona antes de la ejecución del comando**, ya que publicar crea la cola de avisos. El comando obtiene la clave privada de administración desde `src/server/data/admin.key`, sin exponerla en el navegador. Alternativamente se puede utilizar el endpoint interno autenticado `POST /api/admin/events`, con `Authorization: Bearer <clave>`. No publicar jamás la clave ni el directorio `server/data/`.

En esta distribución, los archivos locales del servidor están en `mvp/src/server/data/`; no compartir ni subir esa carpeta.

**No usar ejemplos ficticios como evidencia** de eficacia real, anticipación de siete días o asistencia a eventos oficiales. Los ejemplos no representan actividades organizadas por la UNLaM.

## Documentación, alcance y pruebas

- [TP5 - Parte 1: métricas y umbrales PREVIOS a la construcción](docs/TP5-parte1.md) (borrador sujeto a aprobación del equipo, consigna §11).
- [TP5 - Parte 2: arquitectura, alcance y correcciones del TP4](docs/TP5-parte2.md).
- [Registro del trabajo con IA](docs/prompts.md).
- [Brief v3 (TP3)](docs/brief.md) y [decisiones de scope y flujo](docs/TP3.md).
- [Procedimiento de prueba manual y soporte de evidencia](docs/evidencia/tp5/README.md).

**Arquitectura actual:** un solo proyecto en `mvp/`, con frontend React Native/Expo (`App.js`, `app/`, `assets/`) y backend Node.js (`src/server/`), compartiendo `package.json` y `package-lock.json`. La PWA anterior fue retirada; la vista web local se renderiza desde la misma app React Native mediante React Native Web, sin mantener un frontend aparte. Para probar notificaciones nativas hay que compilar e instalar la app en un dispositivo y configurar Expo Push. No se ha publicado en una tienda ni se ha desplegado un backend público.

**No completado:** pruebas con tres personas reales (Parte 3), interpretación de resultados (Partes 4 y 5), actualización del brief a v4, despliegue público y validación real de entrega en teléfonos. Los datos generados por código no se presentan como datos empíricos.
