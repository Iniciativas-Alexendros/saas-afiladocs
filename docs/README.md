# Documentación Afiladocs

### Propósito de este documento

- **Objetivos:** Indexar la documentación operativa, ADRs, guías y runbooks
  y apuntar a los contratos de la raíz.
- **Estructura:** Índice operativo → runbooks (enlace, no reescritura) →
  roadmap → umbrales → cómo contribuir.
- **Contenido a integrar según contexto:** No muevas ni reescribas
  runbooks vivos. Las guías canónicas siguen en `docs/guias/`;
  `docs/guides/` es el alias de flota.

**Última revisión:** 2026-09-24
**Próxima re-auditoría:** al cierre de la siguiente fase.

Hub único de la documentación técnica y operativa del proyecto. Sustituye al viejo `docs-INDEX.md`. Los docs viven organizados en 3 ejes: **operativos** (cómo funciona el sistema hoy), **runbooks** (qué hacer cuando algo va mal) y **roadmap** (qué falta por hacer).

En la raíz: [README.md](../README.md), [AGENTS.md](../AGENTS.md),
[ARCHITECTURE.md](../ARCHITECTURE.md), [CONTRIBUTING.md](../CONTRIBUTING.md),
[SECURITY.md](../SECURITY.md), [SUPPORT.md](../SUPPORT.md).

## Tabla de contenidos

- [Índice operativo](#índice-operativo)
- [Runbooks de incidentes](#runbooks-de-incidentes)
- [Roadmap y guías transversales](#roadmap-y-guías-transversales)
- [Umbrales de calidad](#umbrales-de-calidad)
- [Cómo contribuir](#cómo-contribuir)
- [Fuentes de verdad](#fuentes-de-verdad)

## Índice operativo

Describen la arquitectura vigente. Primer sitio al que acudir antes de tocar código.

| Doc | Tema |
|-----|------|
| [UI_GUIDE.md](UI_GUIDE.md) | Design system: tokens, tipografía, componentes, patrones RHF+Zod, accesibilidad |
| [ROUTES_MAP.md](ROUTES_MAP.md) | Mapa completo de rutas `src/app/` con auth y propósito |
| [CRON_JOBS.md](CRON_JOBS.md) | Los 5 crons de Vercel: schedule, SLA, payload, alertas |
| [PORTAL_CLIENTE.md](PORTAL_CLIENTE.md) | Journey del cliente en `/portal/*` (intake, documentos, suscripciones) |
| [BACKOFFICE_OPS.md](BACKOFFICE_OPS.md) | Journey ops en `/ops/*` (KPIs, pedidos, productos, alertas, auditoría) |
| [CATALOG.md](CATALOG.md) | Ciclo de vida de los 10 SKUs: draft → DocuSeal → Stripe → live + script `audit-catalog.ts` |
| [n8n-workflows.md](n8n-workflows.md) | Los 5 workflows n8n: monitores normativos, contact relay, error router |
| [DEPLOY_MANUAL.md](DEPLOY_MANUAL.md) | Matriz de env vars, contrato CI, requisitos Vercel, fallos frecuentes |
| [architecture/](architecture/) | ADRs y capas (`ARCHITECTURE.md`) |
| [guides/](guides/) | Alias de flota → `guias/` (sin duplicar cuerpo) |
| [estado.html](estado.html) | Playground interactivo del estado y go-live (checklist P0-P3, DNS, catálogo, autoridad repo↔Notion) |

## Runbooks de incidentes

Recetas paso a paso para respuesta a incidencias. Un externo debe poder ejecutarlos sin contexto previo.

| Runbook | Escenario |
|---------|-----------|
| [runbooks/golive-stripe-live.md](runbooks/golive-stripe-live.md) | Go-live P0b: poblar 10 SKUs en Stripe LIVE + DocuSeal + activar |
| [runbooks/rollback-vercel.md](runbooks/rollback-vercel.md) | Revertir un deploy fallido (CLI/dashboard) |
| [runbooks/rotacion-secretos.md](runbooks/rotacion-secretos.md) | Rotar Stripe, Supabase, DocuSeal, Resend, CRON_SECRET sin downtime |
| [runbooks/recovery-docuseal.md](runbooks/recovery-docuseal.md) | Recuperar un PDF firmado si falla el webhook DocuSeal |
| [runbooks/stripe-webhook-fallido.md](runbooks/stripe-webhook-fallido.md) | Reconciliar un `checkout.session.completed` no procesado |
| [runbooks/incidente-rls.md](runbooks/incidente-rls.md) | Cliente ve datos de otro cliente (violación RLS) |

## Roadmap y guías transversales

Estado del producto y hoja de ruta a 6 fases. Sólo contienen trabajo pendiente — lo ya entregado se confirma en `00-ESTADO-ACTUAL.md`.

- [00-ESTADO-ACTUAL.md](00-ESTADO-ACTUAL.md) — snapshot validado por eje (hecho / parcial / pendiente).
- [01-ROADMAP-MAESTRO.md](01-ROADMAP-MAESTRO.md) — secuencia y dependencias F1–F6.
- [fase-3-ux-conversion.md](fase-3-ux-conversion.md) — 🟡 parcial (F3/A+B+C cerradas; F3/D tienda+portal en curso).
- [fase-6-crecimiento.md](fase-6-crecimiento.md) — ❌ pendiente (feature flags, MDX blog, i18n).

**Fases cerradas (archivadas en [archive/](archive/)):** histórico read-only, no reeditables. Si algo queda obsoleto se mueve a una nueva fase, no se edita en sitio.

| Fase | Cerrada | Doc |
|------|---------|-----|
| F1 Seguridad | 2026-04-14 | [archive/fase-1-seguridad.md](archive/fase-1-seguridad.md) |
| F2 Documentación | 2026-04-18 | [archive/fase-2-documentacion.md](archive/fase-2-documentacion.md) |
| F4 Ops avanzado | 2026-04-15 | [archive/fase-4-ops-avanzado.md](archive/fase-4-ops-avanzado.md) |
| F5 Performance (+ ex `F5-performance-audit.md` fusionado) | 2026-04-17 | [archive/fase-5-performance.md](archive/fase-5-performance.md) |

**Guías transversales** (reglas que aplican a todas las fases):

- [guias/guia-seguridad.md](guias/guia-seguridad.md) — CSP nonce, Zod, RLS, RGPD.
- [guias/guia-calidad.md](guias/guia-calidad.md) — linters, tests, cobertura, convenciones de commit.
- [guias/guia-ui-ux.md](guias/guia-ui-ux.md) — checklist de diseño y accesibilidad.
- [guias/guia-workflows.md](guias/guia-workflows.md) — ramas, PRs, CI/CD, deploy.

## Umbrales de calidad

**Cobertura mínima obligatoria** (`npm run test:coverage`, statements):

| Ámbito | Umbral |
|--------|--------|
| `src/lib/stripe/**` | **≥ 70%** |
| `src/lib/orders/**` | **≥ 70%** |
| `src/lib/verifactu/**` | **≥ 70%** |
| `src/app/api/**` | **≥ 70%** |

Son áreas con lógica de negocio crítica (pagos, pedidos, facturación RD 1007/2023, API de frontera). El resto del código no tiene gate global — se prioriza calidad enfocada en dominios sensibles.

**Gates obligatorios antes de declarar una tarea completa** (definidos en [CLAUDE.md](../CLAUDE.md) y CI `quality` / `test` / `build` / `smoke`):

1. `pnpm run typecheck` — 0 errores.
2. `pnpm run lint` — 0 errores.
3. `pnpm run test:coverage` — 100 % verde + umbrales críticos.
4. `pnpm run build` — build limpio.
5. `pnpm run smoke` — `GET /api/health` ok.

Detalles operativos y roles de revisor en [guias/guia-calidad.md](guias/guia-calidad.md).

## Cómo contribuir

1. **Crear rama** con nomenclatura `fase-N/<slug-corto>` (p.ej. `fase-2/docs-runbooks`). Si el cambio no encaja en una fase, usar `chore/<slug>` o `fix/<slug>`.
2. **Leer las guías aplicables** antes de tocar código:
   - Seguridad → [guias/guia-seguridad.md](guias/guia-seguridad.md).
   - UI/UX → [guias/guia-ui-ux.md](guias/guia-ui-ux.md) + [UI_GUIDE.md](UI_GUIDE.md).
   - Calidad y tests → [guias/guia-calidad.md](guias/guia-calidad.md).
   - Workflow (ramas, PR, CI) → [guias/guia-workflows.md](guias/guia-workflows.md).
3. **Abrir PR** con plantilla de `.github/` — obliga a declarar a qué fase contribuye y marcar los gates superados.
4. **Sincronizar tras merge.** Afiladocs mantiene dos remotos (regla en [CLAUDE.md](../CLAUDE.md) § "Repositorios remotos"):

   ```bash
   git push github main   # GitHub (remoto único)
   ```

5. **Actualizar docs.** Cualquier cambio que modifique rutas, crons, componentes UI base, variables de entorno o flujos de cliente/ops debe actualizar el doc operativo correspondiente en el mismo PR. Los docs sin código en 30 días de inactividad se revisan en la re-auditoría mensual.

## Fuentes de verdad

- [CLAUDE.md](../CLAUDE.md) — reglas absolutas del stack (lo que no se negocia).
- [MEMORY.md](../../.claude/projects/-var-home-soyalexendros-Apps-afiladocs-website/memory/MEMORY.md) — memoria persistente de Claude Code.
- [reference/roadmap-enterprise/](../../.claude/projects/-var-home-soyalexendros-Apps-afiladocs-website/reference/roadmap-enterprise/) — mirror protegido read-only de los docs de roadmap, por si `docs/` queda desalineado.
- `~/.claude/CARTERA.md` — estado vivo de las demás apps de Alexendros (sustituye al antiguo `PROYECTOS.md` desde 2026-04-15).

Legacy (VPS, Nginx, PM2, Documenso) archivado en [reference/legacy-stack/](../../.claude/projects/-var-home-soyalexendros-Apps-afiladocs-website/reference/legacy-stack/). Si aparece en commits antiguos o comentarios, ignorar: el stack vigente es el descrito en [CLAUDE.md](../CLAUDE.md).
