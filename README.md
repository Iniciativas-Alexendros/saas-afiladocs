# Afiladocs

Plataforma de servicios legales digitales B2C (Valencia, España) — plantillas legales rellenables vía DocuSeal + revisiones expertas humanas.

|             |                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| **Estado**  | P0 — frontal 500 por env Supabase incompleta ([issue #59](https://github.com/Iniciativas-Alexendros/saas-afiladocs/issues/59), [PRODUCCION-P0.md](PRODUCCION-P0.md)) |
| **Dominio** | [afiladocs.com](https://afiladocs.com)                                                               |
| **Stack**   | Next.js 15 · React 19 · TypeScript 5.8 · Tailwind v4 · Prisma 7 · Stripe · Supabase · DocuSeal · n8n |

---

## Desarrollo

```bash
git clone git@github.com:alexendros/afiladocs.git && cd afiladocs
npm install && cp .env.example .env.local && npm run dev
```

### Comandos

| Comando             | Uso                          |
| ------------------- | ---------------------------- |
| `npm run dev`       | Turbopack dev server `:3000` |
| `npm run build`     | Build producción             |
| `npm run typecheck` | `tsc --noEmit`               |
| `npm run lint`      | ESLint 9 flat config         |
| `npm run test`      | Vitest + coverage            |
| `npm run test:e2e`  | Playwright Chromium          |
| `npm run ci:local`  | Gate pre-push completo       |

---

## Variables de entorno (producción)

Fuente canónica: [`.env.example`](.env.example) y [`docs/DEPLOY_MANUAL.md`](docs/DEPLOY_MANUAL.md). **No commitear valores reales.**

El edge middleware (`middleware.ts` → `createServerClient`) exige **ambas** env públicas de Supabase. Si falta alguna, Vercel responde `MIDDLEWARE_INVOCATION_FAILED` / HTTP 500. El código actual falla cerrado (503 o skip del refresh) en lugar de lanzar.

Obligatorias en Vercel **Production** para que el frontal no muera en edge:

| Variable | Rol |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto **Marketplace** (`*.supabase.co`). `supabase.afiladocs.com` está descatalogado |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública; RLS). **Ausente en prod el 2026-09-23 — issue #59** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (Storage / ops). No `NEXT_PUBLIC_*` |
| `DATABASE_URL` | Pooler Prisma (runtime) |
| `DIRECT_URL` | Conexión directa (migraciones) |

Path canónico: **Vercel Marketplace Free** linkado al proyecto `afiladocs`. El código **no inventa** estas claves; las inyecta el Marketplace al linkar. No hay VPS / self-hosted.

---

## Arquitectura

```
Cliente → /tienda · /portal → POST /api/checkout → Stripe → webhook
                                                          ↓
Admin (/ops) → /ops/*                          Verifactu → orders → DocuSeal → Storage
```

Flujo completo: [CLAUDE.md § Flujo de pago](CLAUDE.md#flujo-de-pago-stripe--verifactu--docuseal).

---

## Documentación

### Core

| Doc                                                      | Contenido                                 |
| -------------------------------------------------------- | ----------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                                   | Reglas absolutas, flujo de pago, env vars |
| [docs/00-ESTADO-ACTUAL.md](docs/00-ESTADO-ACTUAL.md)     | Snapshot por eje                          |
| [docs/01-ROADMAP-MAESTRO.md](docs/01-ROADMAP-MAESTRO.md) | Fases F1–F6                               |

### Producto

| Doc                                            | Contenido                         |
| ---------------------------------------------- | --------------------------------- |
| [docs/UI_GUIDE.md](docs/UI_GUIDE.md)           | Design system, shadcn/ui, RHF+Zod |
| [docs/ROUTES_MAP.md](docs/ROUTES_MAP.md)       | Rutas `src/app/` con auth         |
| [docs/CRON_JOBS.md](docs/CRON_JOBS.md)         | 5 crons Vercel                    |
| [docs/CATALOG.md](docs/CATALOG.md)             | Ciclo de vida SKUs                |
| [docs/DEPLOY_MANUAL.md](docs/DEPLOY_MANUAL.md) | Env vars, CI, Vercel              |

### Runbooks

| Runbook                                                              | Escenario             |
| -------------------------------------------------------------------- | --------------------- |
| [golive-stripe-live.md](docs/runbooks/golive-stripe-live.md)         | Go-live P0b           |
| [rollback-vercel.md](docs/runbooks/rollback-vercel.md)               | Revertir deploy       |
| [rotacion-secretos.md](docs/runbooks/rotacion-secretos.md)           | Rotar credenciales    |
| [recovery-docuseal.md](docs/runbooks/recovery-docuseal.md)           | Recuperar PDF firmado |
| [stripe-webhook-fallido.md](docs/runbooks/stripe-webhook-fallido.md) | Reconciliar webhook   |
| [incidente-rls.md](docs/runbooks/incidente-rls.md)                   | Violación RLS         |

---

## Roadmap

| Fase             | Estado               |
| ---------------- | -------------------- |
| F1 Seguridad     | Cerrada              |
| F2 Documentación | Cerrada              |
| F3 UX/Conversión | Parcial (D en curso) |
| F4 Ops avanzado  | Cerrada              |
| F5 Performance   | Cerrada              |
| F6 Crecimiento   | Pendiente            |

---

## Licencia

[LICENSE](LICENSE) — todos los derechos reservados.
