# Guía transversal — Calidad de código y documentación

### Propósito de este documento

- **Objetivos:** Fijar linters, tests, cobertura y el checklist de PR.
- **Estructura:** Stack → comandos → TypeScript → carpetas → CI.
- **Contenido a integrar según contexto:** Los jobs de CI se llaman
  `quality` / `test` / `build` / `smoke`. No reescribas runbooks.

Aplica a todo el repo. Define las normas que cualquier PR debe respetar antes de llegar a revisión.

## 1. Stack de calidad (ya configurado)

- **ESLint 9 Flat Config** — [eslint.config.mjs](../../eslint.config.mjs). Extiende `next/core-web-vitals`, `next/typescript`, `plugin:promise/recommended`, `sonarjs.configs.recommended`.
- **TypeScript strict** — [tsconfig.json](../../tsconfig.json). `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`.
- **Vitest** — [vitest.config.ts](../../vitest.config.ts). `happy-dom` environment, coverage v8.
- **Playwright** — [playwright.config.ts](../../playwright.config.ts). Chromium + screenshots on failure.

## 2. Comandos obligatorios antes de declarar una tarea completa

```bash
pnpm run typecheck   # 0 errores
pnpm run lint        # 0 errores, 0 warnings nuevos
pnpm run test:coverage
pnpm run build       # build limpio
pnpm run smoke       # GET /api/health
```

Este bloque está en [CLAUDE.md](../../CLAUDE.md) como regla absoluta. Ningún cambio se considera terminado sin pasar los 4.

## 3. TypeScript

- `any` **prohibido** (regla CLAUDE.md). Si realmente no hay forma, usar `unknown` y estrechar con type guards.
- `@ts-ignore` sólo con justificación explícita adyacente y enlace a issue si es deuda.
- Preferir `as unknown as X` sobre doble cast directo; mejor aún, cambiar la firma de la función.
- Imports absolutos con alias `@/` (mapeado a `src/` en `tsconfig.json`).

## 4. Estructura de carpetas (no modificar sin plan)

```
src/app/       rutas UI + API
src/components/ui  shadcn primitives (no tocar salvo upgrade shadcn)
src/components/    componentes específicos de dominio
src/lib/       lógica de dominio, adaptadores, helpers
src/emails/    plantillas React Email
src/hooks/     hooks cliente
src/types/     tipos compartidos
prisma/        schema + migraciones
supabase/      SQL manual (RLS, índices, storage)
```

Nuevas carpetas de dominio: mencionar en `docs/ROUTES_MAP.md` (F2) con justificación.

## 5. Testing — umbrales declarados

Cobertura **≥ 70% statements** en módulos críticos (no global):

- `src/lib/stripe/`
- `src/lib/orders/`
- `src/lib/verifactu/`
- `src/lib/signing/`
- `src/app/api/**/route.ts`

Para cada nueva API route: test del happy path + Zod rejection + rate-limit response mínimo.
Para cada webhook: payload real + firma inválida → 400.
Para Server Actions: mock de Supabase + Prisma con `vi.mock`.
E2E añadidos para flujos de negocio nuevos (checkout, intake, firma, portal billing).

## 6. Complejidad ciclomática

Reglas actuales (warning):
- `complexity: 10` máx
- `max-depth: 3`
- `max-lines: 300` por fichero

Superar cualquiera de estos requiere: refactor en el mismo PR, o issue de deuda técnica creado y enlazado. Lista de infracciones actuales: ver commit `35bc552 chore: fix lint complexity warnings`.

## 7. Logging estructurado

- En API routes y webhooks: `console.log(JSON.stringify({event, ...data, ts}))`.
- Campos estándar: `event` (kebab-case), `user_id` si aplica, `request_id` si existe, `ts` ISO.
- **No** loguear secretos ni PII completa.

## 8. Dependencias

- Añadir libs: justificar en PR + ejecutar `npm audit`.
- **Prohibido** añadir meta-frameworks UI (Mantine, Chakra, Ant) — shadcn/ui es el único sistema.
- Al quitar código: ejecutar `npx ts-prune` y `npx depcheck` para confirmar que no quedan referencias.

## 9. Documentación acompañante

Cuando un PR introduce:
- **Nueva ruta API** → actualizar `docs/ROUTES_MAP.md`.
- **Nuevo cron** → actualizar `docs/CRON_JOBS.md` + `vercel.json`.
- **Nuevo flujo UI** → actualizar `docs/UI_GUIDE.md` si usa patrones nuevos.
- **Cambio en `/portal` o `/ops`** → actualizar `docs/PORTAL_CLIENTE.md` o `docs/BACKOFFICE_OPS.md`.
- **Nueva integración externa** → añadir doc específico + variable en `src/lib/env.ts` + test.

Los docs operativos se crean en F2; hasta entonces, dejar nota en `docs/README.md` (cuando exista).

## 10. CI/CD

- Pipeline en `.github/workflows/ci.yml` con jobs `quality`, `test`,
  `build`, `smoke` (más `security`: actionlint + zizmor).
- Equivalente local: `make validate` / `pnpm run ci:local`.
- Scripts extra (`depcheck`, `ts-prune`, bundle analyzer): opcionales.

## 11. Checklist de aceptación de PR

- [ ] `typecheck` + `lint` + `test:coverage` + `build` + `smoke` en verde.
- [ ] Cobertura de módulos críticos tocados ≥ 70%.
- [ ] Sin `any`, sin `@ts-ignore` sin justificar.
- [ ] Docs actualizados si el cambio lo requiere.
- [ ] Sin nuevas dependencias sin justificación + audit limpio.
- [ ] Commit en rama siguiendo convención `fase-N/<slug>` si aplica.
