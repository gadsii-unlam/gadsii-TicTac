# Guía: desplegar Nodo UNLaM en un servidor con Docker

Todo corre con Docker Compose desde la carpeta `mvp`. El servidor solo necesita Docker con el plugin Compose.

## Qué se levanta

| Servicio | Qué hace | Puerto |
| --- | --- | --- |
| `api` | Servidor Node: perfiles, eventos, avisos push e imágenes. Datos en el volumen `server-data`. | `127.0.0.1:3000` (solo local) |
| `web` | nginx con la web de Expo. Reenvía `/api` y `/media` a `api`, así que la web es un único origen. | `8080` |
| `https` | Caddy con certificado automático. Es opcional (perfil `https`). | `80` y `443` |

Los eventos de `mvp/src/server/events/` y las imágenes de `mvp/src/server/media/` van dentro de la imagen de `api`. Al arrancar, el servidor publica los que falte en la base (ver [guia-cargar-eventos.md](guia-cargar-eventos.md)).

## Puesta en marcha

```bash
cd mvp
cp .env.example .env      # editá VAPID_SUBJECT con un mail real
docker compose up -d --build
```

Con eso la web queda en `http://<ip-del-server>:8080`. Para comprobarlo: `docker compose ps` tiene que mostrar `api` y `web` en `healthy`.

## HTTPS (necesario para las notificaciones push)

El navegador solo permite notificaciones push en páginas HTTPS. Con un dominio que apunte al servidor y los puertos 80 y 443 abiertos:

1. En `.env`: `DOMAIN=tu-dominio.com` y `WEB_BIND_ADDRESS=127.0.0.1` (así la web no queda también en HTTP por el puerto 8080).
2. `docker compose --profile https up -d --build`

Caddy pide y renueva el certificado solo. Si ya usás otro proxy con HTTPS (Traefik, Cloudflare Tunnel, etc.), no hace falta el perfil: apuntalo a `web:80` o al `WEB_PORT`.

## Datos y claves

- La base, la clave del cargador de eventos (`admin.key`) y las claves de push (`vapid.json`) viven en el volumen `server-data`. **Hacé copia de seguridad del volumen**: si se pierde, las suscripciones push dejan de funcionar y hay que volver a activarlas.
- No compartas ni subas esos archivos. Para llegar a ellos: `docker compose exec api ls /data`.
- Las actualizaciones no borran datos: `git pull && docker compose up -d --build`. Evitá `docker compose down -v`, porque `-v` borra el volumen.
- `/api/admin/*` está bloqueado en nginx. El cargador de eventos corre dentro del contenedor (ver la guía de eventos) y no depende de la web.

## Apps nativas o API en otro dominio

La web usa su propio origen y no necesita configuración. Solo si la API queda en otro dominio, o para las apps nativas (ver `eas.json`), definí `EXPO_PUBLIC_API_URL=https://…` en `.env` antes de construir y poné el origen de la web en `CORS_ORIGINS`.

## Verificación rápida

```bash
curl -s http://localhost:8080/api/config | head -c 100                      # responde JSON
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/admin/events   # 404
```
