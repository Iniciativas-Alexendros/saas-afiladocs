<!-- canon-managed: true -->

### Propósito de este documento

- **Objetivos:** Plantilla de PR para describir el cambio y exigir las comprobaciones de calidad, tests y jobs `quality` / `test` / `build` / `smoke`.
- **Estructura:** Tipo → qué cambia → fase → checklist de CI y RGPD.
- **Contenido a integrar según contexto:** Adapta el checklist a los scripts de este SaaS (`pnpm`). No copies plantillas de un sitio estático. Conserva el bloque RGPD: no hay secretos en `NEXT_PUBLIC_*`.

## 1. Tipo de cambio

- [ ] Fix (bug)
- [ ] Feature
- [ ] Refactor
- [ ] Docs
- [ ] Chore / Dev-ex
- [ ] Seguridad

## 2. Qué cambia

Explica brevemente **qué** hace este PR y **por qué**. Enlaza a issue o a la fase del roadmap si aplica.

## 3. Fase del roadmap

Marca la fase que cubre este PR (ver [docs/01-ROADMAP-MAESTRO.md](../docs/01-ROADMAP-MAESTRO.md)):

- [ ] F1 — Seguridad y endurecimiento
- [ ] F2 — Documentación técnica
- [ ] F3 — UX/Conversión
- [ ] F4 — Ops avanzado
- [ ] F5 — Performance
- [ ] F6 — Crecimiento
- [ ] Fuera de roadmap (justificar)

## 4. Guías transversales aplicables

- [ ] [Seguridad](../docs/guias/guia-seguridad.md) — si toca `api/`, `lib/` server-side, middleware o CSP
- [ ] [Calidad](../docs/guias/guia-calidad.md) — siempre
- [ ] [UI/UX](../docs/guias/guia-ui-ux.md) — si toca UI
- [ ] [Workflows](../docs/guias/guia-workflows.md) — si toca Stripe/DocuSeal/Supabase/Resend/n8n/Verifactu/cron

## 5. Lista de comprobación

- [ ] `pnpm run typecheck && pnpm run lint && pnpm run check:env`
- [ ] `pnpm run test:coverage`
- [ ] `pnpm run build && pnpm run smoke`
- [ ] CI `quality` / `test` / `build` / `smoke` en verde
- [ ] `pnpm run test:e2e` si el cambio toca UI o checkout
- [ ] Docs actualizadas (README, ARCHITECTURE, ADR, runbook) si cambia el contrato
- [ ] He revisado [docs/DEPLOY_MANUAL.md](../docs/DEPLOY_MANUAL.md) y este PR no rompe la matriz de env vars
- [ ] Sin secretos/credenciales en el código
- [ ] Sigue [Código de Conducta](../CODE_OF_CONDUCT.md) y [contribución](../CONTRIBUTING.md)

## 6. Seguridad / RGPD

- [ ] Sin nuevos secretos en `NEXT_PUBLIC_*`
- [ ] Sin nuevos dominios en CSP sin justificación
- [ ] Handlers con PII validan `rgpd_accepted` server-side
- [ ] Variables nuevas añadidas a `src/lib/env.ts` como lazy getter

## 7. Riesgos y rollback

- Riesgos conocidos:
- Estrategia de rollback: (revertir commit / rollback Vercel / runbook en `docs/runbooks/`)

## 8. Notas para revisión

Puntos que el revisor debería mirar con especial atención.
