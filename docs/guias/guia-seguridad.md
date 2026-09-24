# Guía transversal — Seguridad y manejo de errores

### Propósito de este documento

- **Objetivos:** Fijar CSP, Zod, RLS y RGPD que todo PR debe respetar.
- **Estructura:** Controles vigentes → checklist.
- **Contenido a integrar según contexto:** No sustituyas
  `docs/runbooks/rotacion-secretos.md` ni `incidente-rls.md`. Actualiza
  esta guía si cambias middleware o `src/lib/env.ts`.

Aplica a cualquier cambio que toque `src/app/api/**`, `src/lib/**` server-side, middleware o configuración HTTP. **F1 cerrada (2026-04-14)**: CSP con nonce por request vive en [middleware.ts](../../middleware.ts); headers estáticos restantes siguen en [next.config.ts](../../next.config.ts).

## 1. Contrato de respuesta API

Todas las rutas en `src/app/api/**/route.ts` responden con JSON consistente usando helpers centralizados. Si `src/lib/http.ts` no existe, crearlo con:

```ts
export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, { status: 200, ...init })
}
export function fail(message: string, status = 400, meta?: Record<string, unknown>) {
  return Response.json({ ok: false, error: { message, ...meta } }, { status })
}
```

**Reglas:**
- Envolver toda la lógica en `try/catch`.
- Loguear errores con `src/lib/log/structured.ts` (formato JSON con `event`, `ts`, contexto).
- Nunca exponer stack traces ni detalles internos al cliente.
- Mensajes genéricos en `fail()`; detalles sólo en el log.

## 2. Validación con Zod (obligatoria)

- Body, query params y headers validados con Zod en el punto de entrada.
- Esquemas en `src/lib/schemas/` o junto al módulo de dominio (`src/lib/orders/schemas.ts`, `src/lib/catalog/schemas.ts`).
- Ante fallo: `fail('Invalid input', 400, { issues })` — nunca procesar entrada sin validar.
- RGPD: si el handler procesa datos personales, validar `rgpd_accepted === true` **server-side** antes de cualquier operación (ver [CLAUDE.md](../../CLAUDE.md) § "Reglas absolutas").

## 3. Autenticación y autorización

- `requireAuth()` en rutas que requieren sesión (redirige a `/login`).
- `requireRole(['admin','ops'])` en todo lo que toque Ops.
- Para APIs, validar explícitamente el usuario de la sesión antes de filtrar por `user_id`. Nunca confiar en un `user_id` que venga del body.
- Server Actions tienen protección CSRF integrada en Next.js 15; API routes adicionales deben validar `Origin` contra `publicEnv.siteUrl` más dominios preview Vercel.

## 4. Rate limiting

- Upstash Redis vía [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) con fallback graceful sin Redis en dev.
- Objetivos actuales:
  - `/api/checkout`: 10 req/min por IP.
  - `/api/contact`: 5 req/10 min por IP.
  - `/api/cron/*`: 5 req/min por IP (encima del Bearer token).
- Añadir tests en `src/__tests__/lib/rate-limit.test.ts` para cambios de umbral.

## 5. Webhooks y firmas

- **Stripe**: `stripe.webhooks.constructEventAsync()` con `STRIPE_WEBHOOK_SECRET`. Serverless-safe (async obligatorio en Vercel).
- **DocuSeal**: HMAC-SHA256 con `timingSafeEqual` contra `DOCUSEAL_WEBHOOK_SECRET`. Ver patrón real en [src/app/api/webhooks/docuseal/route.ts](../../src/app/api/webhooks/docuseal/route.ts).
- **n8n alerts**: Bearer token (`N8N_ALERTS_WEBHOOK_SECRET`) en header Authorization.
- **Cron Vercel**: Bearer `CRON_SECRET`.
- Nunca loguear el secreto completo ni el payload íntegro si contiene PII.

## 6. Acceso a datos (Supabase + Prisma)

- RLS en Supabase es la **primera línea de defensa**. El código no debe asumir que es la única.
- Queries multi-usuario filtran **siempre** por `user_id` de la sesión autenticada, aunque RLS ya lo haga.
- Ops puede ver datos cross-user pero cada query pasa por `requireRole(['admin','ops'])`.
- `@prisma/adapter-pg` ya configurado (serverless-safe). No introducir otros adapters.

## 7. CSP y headers

- **CSP con nonce por request** vive en [middleware.ts](../../middleware.ts) (función `buildCsp`). Se inyecta en los headers de request (`x-nonce`, `Content-Security-Policy`) para que Next.js lo propague automáticamente a sus `<script>` internos, y en el response para que el navegador lo aplique.
- `script-src` usa `'nonce-<value>' 'strict-dynamic'` — **prohibido** `'unsafe-inline'` en `script-src`. `style-src` conserva `'unsafe-inline'` mientras Tailwind v4 siga dependiendo de ello.
- Scripts inline custom deben consumir el nonce vía `headers().get('x-nonce')` en RSC y pasarlo a `<Script nonce={nonce}>`. Nada de inline scripts sin nonce.
- El resto de security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) permanecen estáticos en [next.config.ts](../../next.config.ts).
- Middleware también bloquea UA sospechosos en `/api/*` (whitelist para Googlebot/Bingbot/etc.) y aplica geo-blocking opcional vía `GEO_BLOCKED_COUNTRIES` (ISO-3166 alfa-2 separados por comas, vacío por defecto por RGPD).
- No añadir dominios a `connect-src`, `script-src` o `frame-src` sin justificación escrita en el PR.

## 8. Secretos y variables

- **Nunca** secretos en `NEXT_PUBLIC_*`.
- Todos los lookups vía `serverEnv` / `publicEnv` en [src/lib/env.ts](../../src/lib/env.ts) con lazy getters.
- SDKs (Stripe, Resend) se instancian **dentro** de funciones, nunca en module scope.
- Rotación de secretos: ver runbook `docs/runbooks/rotacion-secretos.md` (creado en F2).

## 9. CI/CD security

- Pipeline CI actualmente sin configurar tras descatalogar GitLab (2026-04-14). Cuando se reintroduzca (GitHub Actions), preservar SAST, Secret Detection y Dependency Scanning como gates no negociables.
- Nuevas dependencias: ejecutar `npm audit` y confirmar 0 vulnerabilidades *high*/*critical*.
- Si aparecen CVE en deps existentes, priorizar bump antes que merge de features.

## 10. Checklist antes de aceptar un cambio

- [ ] Errores devuelven JSON consistente (`{ ok: false, error: {...} }`), no HTML ni stack trace.
- [ ] Nuevas API routes tienen validación Zod y tests.
- [ ] Webhooks verifican firma; tests con firma inválida devuelven 400.
- [ ] Sin nuevos dominios en CSP salvo documentado.
- [ ] `npm run typecheck && npm run lint && npm run test:coverage` pasa.
- [ ] RGPD: handlers con PII validan consentimiento server-side.
