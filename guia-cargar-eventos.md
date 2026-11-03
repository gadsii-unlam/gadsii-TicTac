# Guía: publicar eventos con la app en ejecución

La app no incluye una pantalla administrativa para publicar eventos. El equipo puede agregarlos desde otra terminal mientras el backend está corriendo; no hace falta reiniciar la app.

## Preparar el evento

Para publicar un evento real, completá un JSON tomando como base [`docs/configuracion/ejemplo-evento.json`](docs/configuracion/ejemplo-evento.json). Verificá todos los datos en una fuente oficial y pedí a otra persona del equipo que revise el contenido antes de publicarlo: la operación guarda el evento y crea notificaciones pendientes.

Completá el título, departamento, carrera, fecha y hora, lugar o modalidad, descripción, fecha de publicación de la fuente y URL oficial. Usá `""` en `career` si el evento es para todo el departamento. `startsAt` va en formato ISO 8601 con zona horaria, por ejemplo (también se aceptan fechas pasadas: el evento aparece en la lista de pasados y no genera avisos):

```json
"startsAt": "2027-02-10T19:00:00-03:00"
```

Después de la revisión, usá `"reviewed": true` y `"demo": false`. La URL de la fuente oficial debe usar HTTPS. No agregues claves ni credenciales al archivo.

## Inscripción

Hay tres casos, y se eligen con dos campos del JSON:

| Caso | Campos | Qué muestra la ficha |
| --- | --- | --- |
| Tiene enlace de inscripción | `"registrationUrl": "https://…"` | Botón **Inscribirme**, que abre la página externa. |
| No hace falta inscribirse | `"noRegistration": true` y `"registrationUrl": null` | El texto **No requiere inscripción**, en lugar del botón. |
| No se informó nada | `"registrationUrl": null` (y `noRegistration` en `false` u omitido) | "Este evento no tiene un enlace de inscripción informado." |

`noRegistration` y `registrationUrl` no se pueden usar juntos: el cargador lo rechaza. El enlace tiene que usar HTTPS.

## Departamentos y carreras válidos

En el JSON, `department` lleva la clave de la tabla y `career` el nombre exacto de la carrera (o `""` para todo el departamento). Cualquier otro valor es rechazado.

| `department` | Unidad académica | `career` |
| --- | --- | --- |
| `diit` | Departamento de Ingeniería e Investigaciones Tecnológicas | Ingeniería en Informática · Ingeniería Mecánica · Ingeniería Civil · Ingeniería Electrónica · Ingeniería Industrial · Ingeniería en Energías Renovables |
| `salud` | Departamento de Ciencias de la Salud | Licenciatura en Nutrición · Odontología · Licenciatura en Kinesiología y Fisiatría · Medicina · Licenciatura en Enfermería |
| `humanidades` | Departamento de Humanidades y Ciencias Sociales | Licenciatura en Relaciones Laborales · Licenciatura en Comunicación Social · Licenciatura en Relaciones Públicas · Licenciatura en Trabajo Social · Profesorado de Educación Física · Licenciatura en Educación Física |
| `economicas` | Departamento de Ciencias Económicas | Licenciatura en Administración · Contador Público · Licenciatura en Comercio Internacional · Licenciatura en Economía |
| `derecho` | Departamento de Derecho y Ciencia Política | Abogacía · Licenciatura en Ciencia Política |
| `arquitectura` | Escuela de Arquitectura, Urbanismo y Diseño | Arquitectura |

La lista vive en `mvp/src/server/catalog.js`. Si una carrera cambia de nombre, agregá el nombre anterior a `CAREER_RENAMES` en ese archivo para que los perfiles y eventos ya guardados se actualicen solos.

## Ejecución local con Node

Dejá el servidor corriendo. Abrí otra terminal, cambiá a la carpeta `mvp` y ejecutá el cargador con la ruta al JSON:

```bash
cd mvp
npm run add:event -- ../ruta/al/evento.json
```

Para probar el flujo sin publicar información real, el comando siguiente crea un evento ficticio marcado como demo:

```bash
npm run demo:event
```

## Ejecución con Docker Compose

Dejá los servicios de Docker Compose corriendo. Desde la carpeta `mvp`, copiá el JSON al contenedor API y ejecutá el cargador:

```bash
cd mvp
docker compose cp ../ruta/al/evento.json api:/tmp/evento.json
docker compose exec -T api node src/server/add-event.js /tmp/evento.json
```

Para crear un evento ficticio de prueba directamente en el contenedor:

```bash
docker compose exec -T api node src/server/add-event.js
```

El contenedor usa su base persistente y la clave administrativa configurada en el volumen; no copies ni publiques la clave. En ejecución local, la base y las claves están en `mvp/src/server/data/`. En Docker, los datos viven en el volumen `server-data`. No compartas ni subas esos datos.

## Comprobar publicación y avisos

El comando informa el identificador del evento y cuántos avisos quedaron pendientes. Ante un error, verificá que el backend esté disponible, que el JSON sea válido, y que los campos requeridos estén completos.

La app muestra el evento a los perfiles que coincidan con el departamento y, si corresponde, la carrera cuando actualicen su lista. Para recibir notificaciones push, esos perfiles también deben tener alertas activadas y una suscripción válida. La frecuencia instantánea intenta enviar el aviso enseguida; los resúmenes diarios y semanales esperan su próximo horario programado. La aceptación del push no confirma que la persona lo haya visto.

No uses eventos ficticios como evidencia de eficacia, anticipación o asistencia a actividades oficiales.
