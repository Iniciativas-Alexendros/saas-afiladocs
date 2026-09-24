# 0001 — Catálogo en Prisma, no en env vars

### Propósito de este documento

- **Objetivos:** Registrar por qué el catálogo de SKUs vive en la tabla
  `products` y no en una whitelist de variables de entorno.
- **Estructura:** Contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** No copies ADRs de otro SaaS. El
  alta/edición operativa se hace en `/ops/productos`.

## Estado

Aceptada (2026-04-14, Fase 1 del pivote a tienda).

## Contexto

El checkout validaba SKUs contra una whitelist en env vars. Eso impedía
activar productos sin redeploy y mezclaba secretos de plataforma con datos
de catálogo.

## Decisión

El catálogo canónico es la tabla Prisma `products` (más `product_packs`).
`/api/checkout` resuelve el SKU contra BD. `stripe_price_id` y
`docuseal_template_id` se pueblan en `/ops/productos`. `is_active` solo
cuando ambos IDs están presentes.

## Consecuencias

- Seed y ops CRUD son la vía de alta, no un cambio de Vercel env.
- CI no necesita IDs LIVE para typecheck/lint/test/build/smoke.
- Notion es autoritativo solo para Status/Notas; el repo
  (`catalog/manifest.json` + BD) manda IDs y versiones.
