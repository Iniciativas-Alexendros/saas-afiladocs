# Manual de Deploy — Afiladocs

**Última revisión:** 2026-04-15

Documento único con los requisitos que exige cada entorno (local, CI, Vercel Preview y Vercel Prod), el checklist obligatorio antes de hacer push, y el registro vivo de fallos frecuentes. Si un PR rompe este contrato, CI debe detectarlo antes del merge.

## 1. Matriz de entornos

Las variables se agrupan por el papel que cumplen. Columnas:

- **Local** → `.env.local`, valores reales del desarrollador.
- **CI** → placeholders en [.github/workflows/ci.yml](../.github/workflows/ci.yml). Nunca secretos reales.
- **Preview** → deploys de rama en Vercel. Valores reales de entorno `preview`.
- **Prod** → `main` en Vercel, valores reales de entorno `production`.

| Variable | Local | CI | Preview | Prod |
|---|:-:|:-:|:-:|:-:|
| `DATABASE_URL` (pooler 6543) | real | placeholder | real | real |
| `DIRECT_URL` (5432, sólo migrate) | real | placeholder | real | real |
| `NEXT_PUBLIC_SUPABASE_URL` | real | placeholder | real | real |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | real | placeholder | real | real |
| `SUPABASE_SERVICE_ROLE_KEY` | real | placeholder | real | real |
| `STRIPE_SECRET_KEY` (`sk_test_*` en preview) | test | placeholder | test | **live** |
| `STRIPE_WEBHOOK_SECRET` | test | placeholder | test | **live** |
| `RESEND_API_KEY` | real | placeholder | real | real |
| `RESEND_FROM_EMAIL` | opt | — | opt | opt |
| `DOCUSEAL_API_URL` / `_API_KEY` / `_WEBHOOK_SECRET` | opt | — | opt | real |
| `EASYVERIFACTU_API_URL` / `_API_KEY` | opt | — | opt | real |
| `N8N_CONTACT_WEBHOOK_URL` | opt | — | opt | real |
| `N8N_ALERTS_WEBHOOK_SECRET` | opt | — | opt | real |
| `N8N_ERROR_WEBHOOK_URL` | opt | — | opt | real |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | opt | — | opt | real |
| `CRON_SECRET` | opt | placeholder | opt | **real** |
| `OPS_EMAIL` | opt | — | opt | real |
| `GEO_BLOCKED_COUNTRIES` | opt | — | opt | opt |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://afiladocs.com` | **no definir** (noindex) | `https://afiladocs.com` |
| `OBSERVABILITY_SENTRY_AUTH_TOKEN` | — | — | auto | auto |

Fuente canónica: [src/lib/env.ts](../src/lib/env.ts). El script [scripts/check-env-example.ts](../scripts/check-env-example.ts) valida en CI que cada variable referenciada ahí esté en [.env.example](../.env.example).

`opt` = opcional (lazy getter con fallback). `—` = no aplica. `real` = valor de producción o preview. `placeholder` = valor no funcional usado sólo para que `prisma generate` y `next build` no aborten.

## 2. Pre-push checklist

Obligatorio antes de abrir o actualizar un PR (regla declarada en [CLAUDE.md](../CLAUDE.md)):

```bash
npm run ci:local
```

Equivale a: `check:env → typecheck → lint → test:coverage → build`. Es exactamente lo que el workflow [ci.yml](../.github/workflows/ci.yml) ejecuta, menos el paso de `npm ci`. Si esto pasa en local, CI debería pasar en el primer intento.

Si el PR toca el esquema Prisma: además `npx prisma migrate dev` contra BD local o Supabase dev.

## 3. Qué verifica CI (contrato)

El workflow [.github/workflows/ci.yml](../.github/workflows/ci.yml) es la fuente única de verdad. Steps actuales:

| # | Step | Detecta |
|---|------|---------|
| 1 | `Install dependencies` (`npm ci`) | Lockfile desincronizado; `postinstall` de Prisma falla si falta `DATABASE_URL` o `DIRECT_URL` |
| 2 | `Validate .env.example coverage` | Env var nueva referenciada en código pero sin documentar |
| 3 | `Typecheck` | Errores de tipos |
| 4 | `Lint` | ESLint 9 flat config (0 errores, 0 warnings nuevos) |
| 5 | `Tests` (`test:coverage`) | Regresiones unitarias + umbrales de cobertura |
| 6 | `Build` (`next build`) | Rutas App Router rotas, server components mal tipados, CSP inválida, bundles que no compilan |

`concurrency: ci-<ref>` con `cancel-in-progress: true` cancela runs anteriores de la misma rama cuando llega un push nuevo.

**Runner:** `ubuntu-latest` (GitHub-hosted). El label `[self-hosted, ts]` se retiró porque el runner de la org no estaba online y los jobs quedaban en cola indefinida (p. ej. [run 35818279495](https://github.com/Iniciativas-Alexendros/saas-afiladocs/actions/runs/35818279495)). No volver a `self-hosted` hasta confirmar un runner registrado con esas labels.

**Regla**: si este workflow cambia, esta tabla cambia en el mismo PR.

## 4. Requisitos Vercel

- **Región**: `cdg1` (París, PoP más cercano a ES — Vercel no tiene Madrid). Declarada en [vercel.json](../vercel.json).
- **`maxDuration`**: 30 s para checkout/webhooks, 60 s para crons, 10 s para contact, 5 s para health.
- **Crons**: sólo se ejecutan en `production`. Preview no dispara crons.
- **`NEXT_PUBLIC_SITE_URL`**: sólo definida en `production` (`https://afiladocs.com`). Previews la omiten a propósito para que [robots.ts](../src/app/robots.ts) devuelva `Disallow: /` y `sitemap.ts` responda `noindex`.
- **Secretos**: todo `*_SECRET_KEY`, `*_API_KEY`, `*_WEBHOOK_SECRET`, `CRON_SECRET` sólo en scope "Production" + "Preview" (nunca "Development" en Vercel — esos se inyectan vía `.env.local`).
- **Prisma**: `postinstall: prisma generate` corre en el build de Vercel; `DATABASE_URL` y `DIRECT_URL` deben existir como env vars del proyecto.
- **Sentry**: la integración Vercel+Sentry inyecta `OBSERVABILITY_SENTRY_AUTH_TOKEN`, `_ORG`, `_PROJECT` y `NEXT_PUBLIC_OBSERVABILITY_SENTRY_DSN`. No definirlos a mano.

## 5. Fallos frecuentes y remedio inmediato

Registro vivo. Cuando CI falle por un motivo no listado aquí, añade la entrada en el mismo PR que lo corrige.

| Síntoma | Causa | Remedio |
|---|---|---|
| `prisma.config.ts: define DIRECT_URL o DATABASE_URL` en `npm ci` | `postinstall` corre `prisma generate` y falta env | En CI: placeholder en `env:` del job (ya aplicado). En local: poblar `.env.local` |
| `MISSING DEPENDENCY @vitest/coverage-v8` | Vitest 4 no lo incluye transitivamente | Añadir `@vitest/coverage-v8` a `devDependencies` con la **misma versión** que `vitest` |
| `Missing required environment variable: X` en build de Vercel | Env nueva en `src/lib/env.ts` sin añadir al proyecto Vercel | Añadir a Preview + Prod desde el dashboard, redeploy |
| CSP bloquea script en prod | `script-src` sin el nonce correcto tras cambio en [next.config.ts](../next.config.ts) | Ver `guias/guia-seguridad.md` § CSP nonce |
| Webhook Stripe firma inválida | `STRIPE_WEBHOOK_SECRET` apunta al endpoint equivocado | [runbooks/stripe-webhook-fallido.md](runbooks/stripe-webhook-fallido.md) |
| Build Vercel OK pero preview devuelve 500 en `/` | Env runtime-only ausente (ej. `SUPABASE_SERVICE_ROLE_KEY`) | Los lazy getters sólo fallan en request time — revisar env vars del entorno Preview |

## 6. Política de merge

Un CI en verde es condición **necesaria** pero no **suficiente**:

- ❌ No merge a `main` sin CI verde.
- ❌ No merge si el PR modifica `.env.example` / `src/lib/env.ts` y no actualiza la §1 (matriz) de este manual.
- ❌ No merge si el PR cambia [vercel.json](../vercel.json), [next.config.ts](../next.config.ts), [prisma.config.ts](../prisma.config.ts) o [.github/workflows/ci.yml](../.github/workflows/ci.yml) sin una sección "Impacto en deploy" en la descripción del PR.
- ✅ Merge squash por defecto. Fast-forward sólo para hotfixes de una sola commit bien formada.

## 7. Rollback

Ante un deploy malo en producción: [runbooks/rollback-vercel.md](runbooks/rollback-vercel.md). Tiempo objetivo de recuperación: < 5 min vía dashboard Vercel ("Promote to Production" sobre el deploy anterior).

Para secretos comprometidos: [runbooks/rotacion-secretos.md](runbooks/rotacion-secretos.md).
