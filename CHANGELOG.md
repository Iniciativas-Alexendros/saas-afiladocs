# Changelog

### Propósito de este documento

- **Objetivos:** Registrar cambios significativos con Keep a Changelog,
  sin borrar el historial de fases.
- **Estructura:** Unreleased → versión en preparación → histórico.
- **Contenido a integrar según contexto:** Añade entradas bajo Unreleased.
  No reescribas fases cerradas. semantic-release no está activo en este repo.

Registro de cambios significativos del proyecto Afiladocs. El formato sigue una
variante práctica de [Keep a Changelog](https://keepachangelog.com/):
versión semántica, fecha ISO y notas agrupadas por área (seguridad, features,
docs, ops, performance, deuda técnica).

## [Unreleased]

- **Plataforma (canon P1+P2)** — 2026-09-24
  - CI principal normalizado a jobs `quality`, `test`, `build`, `smoke`.
  - `Makefile` (`lint` / `test` / `build` / `smoke` / `validate`) y
    `pnpm run smoke` (`GET /api/health`).
  - Contratos: `AGENTS.md`, `ARCHITECTURE.md`, `CODE_OF_CONDUCT.md`,
    `CODEOWNERS`, ADRs en `docs/architecture/decisions/`.
  - Renovate standalone (`npm` + `github-actions`). Se conserva `SUPPORT.md`
    y los runbooks vivos.

## [1.0.0] — en preparación (P0b)

P0b es el go-live de la tienda pública con 10 SKUs. Hasta que no se completen
los pasos del runbook la tienda permanece en modo "Próximamente".

- **Fase 3 (auto-entrega)** — cerrada 2026-04-18
  - Orquestador `src/lib/orders/fulfillment.ts` y router `dispatchByProductKind`.
  - Integración DocuSeal self-hosted para firma y relleno online.
  - Webhooks de Stripe y DocuSeal con protección anti-re-entrega.
  - Portal de descarga y emails transaccionales.
  - Detalle en [docs/archive/fase-2-documentacion.md](docs/archive/fase-2-documentacion.md) y [docs/archive/fase-4-ops-avanzado.md](docs/archive/fase-4-ops-avanzado.md).

- **Fase 2 (tienda pública)** — cerrada 2026-04-14
  - Rutas `/tienda`, `/tienda/[categoria]` y `/producto/[slug]`.
  - Catálogo alimentado desde Prisma con caché ISR.
  - Componentes `ProductCard`, `CategoryFilter`, `BuyButton`, `DeliveryBadge`.

- **Fase 1 (cimientos + ops)** — cerrada 2026-04-14
  - Modelos `products` y `product_packs` en Prisma.
  - Panel `/ops/productos` con Server Actions y Zod.
  - Checkout validado contra BD en `/api/checkout`.

- **Fase 5 (performance)** — cerrada 2026-04-17
  - Bundle audit y líneas base en [docs/performance-baseline/](docs/performance-baseline/).

- **Fase 2 (documentación operativa)** — cerrada 2026-04-18
  - Índice único en [docs/README.md](docs/README.md).
  - Runbooks de incidentes y guías transversales.

### Deuda técnica — Fase 3 (fix/seguridad-fase-1)

- Desacopla `next build` de PostgreSQL: `src/lib/catalog/query.ts` devuelve
  fallbacks vacíos durante `phase-production-build`.
- Licencia explícita (`LICENSE`) y `package.json` con `license: UNLICENSED`.
- Añade `CHANGELOG.md` y `SUPPORT.md`.
- Refina `.gitleaks.toml` para el placeholder `sk_test_placeholder`.
- Añade `actionlint` y `zizmor` al CI.
- Añade Dependabot para GitHub Actions.
- Revisa vulnerabilidades reportadas por `npm audit` (ver sección de seguridad).

## [0.9.0] — pivote a tienda (2026-04-14)

Migración del modelo de negocio de consultoría legal a tienda B2C de
plantillas legales rellenables. Reemplaza el stack de landing estático por:

- Catálogo Prisma con 10 SKUs iniciales.
- Stripe Checkout + Verifactu + DocuSeal.
- Portal cliente y backoffice ops.

Legacy (VPS, Nginx, PM2, Documenso) archivado en memoria del proyecto.

## Cómo actualizar este archivo

- Cada fase cerrada genera una entrada bajo la versión en preparación.
- Los cambios de deuda técnica se registran bajo la versión activa con fecha
  de merge.
- Tras P0b, las versiones siguen semver y se etiquetan en GitHub.

---

Enlaces de referencia:

- [docs/README.md](docs/README.md) — índice de documentación.
- [docs/runbooks/golive-stripe-live.md](docs/runbooks/golive-stripe-live.md) — runbook P0b.
- [docs/guias/guia-workflows.md](docs/guias/guia-workflows.md) — flujo de ramas y PR.
