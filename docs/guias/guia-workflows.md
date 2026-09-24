# Guía transversal — Workflows e integraciones

### Propósito de este documento

- **Objetivos:** Fijar contratos de Stripe, DocuSeal, Verifactu, n8n y crons.
- **Estructura:** Panorama → reglas por integración.
- **Contenido a integrar según contexto:** No sustituyas los runbooks
  (`stripe-webhook-fallido`, `recovery-docuseal`). Los jobs CI se llaman
  `quality` / `test` / `build` / `smoke`.

Aplica a todo cambio en `src/app/api/webhooks/`, `src/app/api/cron/`, `src/lib/stripe/`, `src/lib/signing/`, `src/lib/verifactu/` y cualquier envío a n8n.

## 1. Panorama de integraciones

| Sistema | Rol | Código | Secreto |
|---------|-----|--------|---------|
| Stripe | Pagos (one-shot + suscripciones) | [src/lib/stripe/](../../src/lib/stripe/), [src/app/api/checkout/](../../src/app/api/checkout/) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| DocuSeal (self-hosted) | **Único** firmante electrónico | [src/lib/signing/](../../src/lib/signing/), [src/app/api/webhooks/docuseal/](../../src/app/api/webhooks/docuseal/) | `DOCUSEAL_API_KEY`, `DOCUSEAL_WEBHOOK_SECRET` |
| Supabase | PostgreSQL + Auth + Storage | [src/lib/supabase/](../../src/lib/supabase/), Prisma con `@prisma/adapter-pg` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` |
| Resend | Email transaccional | [src/lib/email/send.ts](../../src/lib/email/send.ts), [src/emails/](../../src/emails/) | `RESEND_API_KEY` |
| n8n | Relay de contacto + alertas normativas | [src/app/api/contact/](../../src/app/api/contact/), [src/app/api/webhooks/n8n-alerts/](../../src/app/api/webhooks/n8n-alerts/) | `N8N_CONTACT_WEBHOOK_URL`, `N8N_ALERTS_WEBHOOK_SECRET` |
| EasyVerifactu | Facturación electrónica (RD 1007/2023) | [src/lib/verifactu/](../../src/lib/verifactu/) | `EASYVERIFACTU_API_URL`, `EASYVERIFACTU_API_KEY` |
| Upstash Redis | Rate limiting | [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Vercel Cron | Tareas programadas | [vercel.json](../../vercel.json), [src/app/api/cron/](../../src/app/api/cron/) | `CRON_SECRET` |

**Documenso descartado.** Webhook y adapter eliminados en F1 (2026-04-14). DocuSeal es el único firmante activo ([src/lib/signing/](../../src/lib/signing/)). Si aparece en commits antiguos o comentarios, ignorar.

## 2. Contratos y tipos

- Tipos compartidos en [src/types/](../../src/types/) y cerca del módulo de dominio.
- Esquemas Zod por payload, reutilizados en:
  - Rutas API (`src/app/api/**/route.ts`).
  - Server Actions (`src/app/**/actions.ts`).
  - Módulos de dominio (`src/lib/orders/`, `src/lib/stripe/`).

## 3. Flujo: Compra → Pago → Factura → Firma → Entrega

```
1. Cliente añade producto → useCart (context)
2. POST /api/checkout → stripe.checkout.sessions.create
3. Stripe redirect → /pago-exitoso
4. Webhook /api/webhooks/stripe (constructEventAsync)
   ├─ checkout.session.completed
   │   ├─ Actualiza orders.status = 'processing'
   │   ├─ Trigger Verifactu → EasyVerifactuAdapter.createInvoice()
   │   │   └─ Guarda orders.invoice_id / invoice_pdf
   │   ├─ sendEmail(PaymentConfirmation)
   │   └─ (F5) revalidateTag('orders')
   └─ customer.subscription.*
       └─ Actualiza subscriptions.*
5. Ops sube PDF → /ops/pedido/[id] → Supabase Storage
6. Ops envía a DocuSeal → DocuSealAdapter.createSubmission()
7. Webhook /api/webhooks/docuseal (HMAC-SHA256)
   ├─ document.completed
   │   ├─ Descarga PDF firmado → Supabase Storage (bucket 'documents')
   │   ├─ Hash SHA-256 del PDF
   │   ├─ Actualiza documents.signed_pdf_path, hash_sha256_signed
   │   ├─ sendEmail(DocumentReady) con signed URL 1h
   │   └─ (F5) revalidateTag('orders')
8. Cliente descarga desde /portal/pedido/[id] (signed URL 1h)
```

Este flujo ya está implementado y probado. Cualquier cambio debe mantener el orden y añadir tests.

## 4. Reglas para webhooks

- Siempre verificar firma antes de parsear body.
- Respuesta 200 rápida; procesamiento pesado idealmente encolado (hoy se hace inline porque Vercel Functions tienen 30s de `maxDuration`; vigilar).
- **Idempotencia**: el mismo evento repetido no debe duplicar efectos (usar `stripe_event_id` o `docuseal_event_id` como clave única en `audit_log`).
- Logging estructurado: `{event: 'webhook.stripe.checkout_completed', ...}`.

## 5. Reglas para cron jobs

- Autenticación por `Authorization: Bearer ${CRON_SECRET}` en header.
- Rate limited (5 req/min por IP) incluso con token válido (defensa en profundidad).
- Idempotentes: cada cron debe poder ejecutarse 2 veces seguidas sin daño.
- Declarados en `vercel.json` → `crons` + `functions` (con `maxDuration`).
- Tests en `src/__tests__/api/cron-*.test.ts`.
- SLAs documentados en `docs/CRON_JOBS.md` (F2).

Crons actuales:
- `/api/cron/cleanup-expired-sessions` — diario 03:00 UTC
- `/api/cron/subscription-reminders` — lunes 09:00 UTC
- `/api/cron/intake-reminders` — diario 10:00 UTC
- `/api/cron/sla-monitor` — L-V 08:00 UTC
- `/api/cron/daily-report` — L-V 07:00 UTC

## 6. Reglas para n8n

- Payloads enviados a n8n: **mínimos**. No incluir PII innecesaria.
- Tratar input desde n8n como no confiable → validar con Zod + Bearer token.
- Reintentos exponenciales para webhooks salientes (n8n los gestiona del lado suyo, pero si Afiladocs llama n8n, controlar timeouts).
- Payloads, headers, curl de prueba y IDs de workflow viven en [docs/n8n-workflows.md](../../docs/n8n-workflows.md) — actualizar ahí al añadir/modificar workflow.

### Inventario vigente

| Workflow | Dirección | Endpoint | Trigger | Propósito |
|----------|-----------|----------|---------|-----------|
| Contact relay | Afiladocs → n8n | `N8N_CONTACT_WEBHOOK_URL` | POST `/api/contact` | Derivar leads del formulario a Notion/Email/CRM |
| Alerts ingest | n8n → Afiladocs | `POST /api/webhooks/n8n-alerts` (Bearer) | Monitores programados en n8n | Ingesta en `monitor_alerts` + email si `urgency=alta` |
| Monitor BOE/DOGV | Programado en n8n | alimenta "Alerts ingest" | `0 7 * * 1-5` CET | Disposiciones generales relevantes para áreas Afiladocs |
| Monitor AEPD | Programado en n8n | alimenta "Alerts ingest" | `0 8 * * 1-5` CET | Resoluciones y sanciones protección de datos |
| Monitor CGPJ | Programado en n8n | alimenta "Alerts ingest" | semanal lunes 06:00 | Jurisprudencia relevante (CENDOJ) |

- La ingesta marca alertas con `status='pending_review'` y ejecuta `revalidateTag('alerts')`; el panel `/ops/alertas` consume esa cache.
- Al añadir un nuevo monitor n8n: documentarlo en `docs/n8n-workflows.md` antes de activarlo en producción.

## 7. Reglas para Verifactu

- Trigger automático en `checkout.session.completed` (Stripe webhook).
- Si falla: entry en `audit_log` con `event: 'verifactu.failed'`, pedido queda en `processing` hasta resolución manual.
- Factura PDF guardada en `orders.invoice_pdf` (path Storage).
- Auditoría obligatoria por RD 1007/2023 — no modificar facturas ya emitidas; generar rectificativas.

## 8. Emails transaccionales

13 plantillas en [src/emails/](../../src/emails/). Al añadir una nueva:

1. Crear `src/emails/NombreTemplate.tsx` con React Email.
2. Export desde un índice si no existe ya.
3. Llamar vía `sendEmail({ to, subject, react: <Template {...props} /> })`.
4. Test unitario: render snapshot + validación de props requeridas.
5. Test del handler que dispara el email con `vi.mock('@/lib/email/send')`.

Plantillas existentes: `welcome`, `order-confirmation` (PaymentConfirmation), `intake-required`, `signature-required`, `document-ready`, `document-completed`, `subscription-active`, `payment-failed`, `sla-alert`, `daily-ops-report`, `review-ready`, `template-download-ready`.

## 9. Deploy y ramas (Vercel)

- `vercel.json` → `git.deploymentEnabled` controla qué ramas despliegan.
- Crons **solo en producción** (comportamiento por defecto Vercel).
- No cambiar `git.deploymentEnabled` sin coordinación y commit justificativo.

## 10. Validación al tocar workflows

- [ ] Tests unitarios del adaptador/lógica modificada.
- [ ] Test de integración en `src/__tests__/api/` si toca una API/webhook/cron.
- [ ] Test E2E si toca el flujo de usuario (checkout, firma, portal).
- [ ] Variables nuevas añadidas a `src/lib/env.ts` como lazy getter.
- [ ] Entrada nueva en `docs/ROUTES_MAP.md` o `docs/CRON_JOBS.md` según aplique.
- [ ] Idempotencia verificada con test que ejecuta el handler 2 veces y verifica no-duplicación.
