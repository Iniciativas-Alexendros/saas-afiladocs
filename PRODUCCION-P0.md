# PRODUCCION-P0 — Producción caída

## Estado actual

Sondeo verificado el **2026-09-23 ~16:40 UTC** (no restaurado):

- `afiladocs.com` (frontal Next.js en Vercel): **no saludable**. DNS resuelve (`64.29.17.65` / `216.198.79.65`). HTTPS responde **500** con `server: Vercel` y `x-vercel-error: MIDDLEWARE_INVOCATION_FAILED`. El edge está vivo; el middleware de la app falla.
- `www.afiladocs.com`: mismo **500** / `MIDDLEWARE_INVOCATION_FAILED`.
- `supabase.afiladocs.com` (Supabase self-hosted con Kong + Let's Encrypt): **caído**. DNS resuelve (`191.96.53.6`). HTTPS y `/auth/v1/health` **timeout** (~15 s, HTTP 000).
- Este incidente es **P0** y **no se puede restaurar desde el código** de este repositorio. La recuperación es out-of-band (dashboard Vercel + host de Supabase).

## Impacto de negocio

- Tienda B2C de plantillas legales inaccesible.
- Portal cliente, backoffice `/ops`, API routes, webhooks y crons fuera de servicio.
- No se procesan pagos (Stripe), firmas (DocuSeal) ni facturas (Verifactu).

## Checklist de recuperación de infraestructura

### 1. Vercel (`afiladocs.com`)

- [ ] Acceder al proyecto en el dashboard de Vercel.
- [ ] Revisar últimos deploys, builds fallidos y errores de runtime.
- [ ] Re-desplegar manualmente desde `main` si el último deploy es inestable.
- [ ] Comprobar dominios personalizados: `afiladocs.com` y `www.afiladocs.com`.
- [ ] Verificar certificados SSL y renovación automática en Vercel.
- [ ] Revisar Edge Config / variables de entorno si el arranque falla.

### 2. Supabase self-hosted (`supabase.afiladocs.com`)

- [ ] Acceder al servidor host del despliegue self-hosted.
- [ ] Revisar estado de los contenedores/servicios: `kong`, `auth`, `rest`, `postgrest`, `realtime`, `storage`, `postgres`, `vector`, etc.
- [ ] Inspeccionar logs de Docker Compose / Kubernetes.
- [ ] Verificar certificados Let's Encrypt y su renovación (`kong` / reverse proxy).
- [ ] Comprobar salud de PostgreSQL: conectividad, espacio en disco, locks, WAL.
- [ ] Validar variables de entorno y secretos en el host (`env`, vault, etc.).
- [ ] Revisar firewall y puertos expuestos: 443 (Kong), 5432 (directa), 6543 (pooler) según topología.

### 3. DNS / CDN

- [ ] Confirmar registros A/CNAME de `afiladocs.com` y `supabase.afiladocs.com`.
- [ ] Verificar TTL, propagación y resolución DNS.
- [ ] Comprobar reglas de firewall / WAF si aplica.

### 4. Observabilidad y alertas

- [ ] Revisar Sentry, Vercel Analytics y cualquier monitor de uptime.
- [ ] Comprobar alertas de n8n y canales de notificación configurados.

### 5. Validación post-recuperación

- [ ] Smoke test de home, tienda, ficha de producto, checkout (modo test), login y portal.
- [ ] Verificar recepción y procesamiento de webhooks de Stripe y DocuSeal.
- [ ] Comprobar ejecución de crons en Vercel.
- [ ] Validar conectividad de la app a Supabase Auth y base de datos.

## Nota

Este archivo se crea en la rama `fix/seguridad-fase-1` como **documentación del incidente P0**. Los fixes de seguridad de esta rama no restauran la infraestructura; requieren intervención manual directa en Vercel y en el host de Supabase.
