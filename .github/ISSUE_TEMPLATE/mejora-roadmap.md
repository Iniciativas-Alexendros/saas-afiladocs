---
name: Mejora / Feature alineada con roadmap
about: Solicitar una mejora o nueva funcionalidad siguiendo el roadmap de Afiladocs
labels: ["enhancement"]
---

### Propósito de este documento

- **Objetivos:** Recoger una mejora alineada con el roadmap F1–F6 sin
  filtrar secretos.
- **Estructura:** Contexto → fase → alcance → aceptación.
- **Contenido a integrar según contexto:** Enlaza docs del repo
  (`docs/01-ROADMAP-MAESTRO.md`, `docs/guias/`). Conserva esta plantilla
  de producto; las genéricas son `bug.md` y `feature.md`.

## Contexto

Describe brevemente el problema de negocio o la necesidad operativa que se quiere cubrir.

## Fase del roadmap

Marca la fase correspondiente (ver [01-ROADMAP-MAESTRO.md](../../docs/01-ROADMAP-MAESTRO.md)):

- [ ] F1 — Seguridad y endurecimiento
- [ ] F2 — Documentación técnica
- [ ] F3 — UX/Conversión
- [ ] F4 — Ops avanzado
- [ ] F5 — Performance
- [ ] F6 — Crecimiento
- [ ] Propuesta fuera de roadmap (requiere justificación)

## Alcance técnico

Marca las áreas afectadas y enlaza a la guía transversal correspondiente:

- [ ] UI/UX ([guia-ui-ux.md](../../docs/guias/guia-ui-ux.md))
- [ ] Seguridad / errores ([guia-seguridad.md](../../docs/guias/guia-seguridad.md))
- [ ] Workflows / integraciones ([guia-workflows.md](../../docs/guias/guia-workflows.md))
- [ ] Calidad / documentación ([guia-calidad.md](../../docs/guias/guia-calidad.md))
- [ ] Base de datos / schema
- [ ] CI/CD

## Cambios propuestos

Lista de cambios a alto nivel:

- [ ] ...
- [ ] ...

## Impacto esperado

- Métricas (conversión, reducción de errores, ahorro operativo, SLA, coste Vercel, etc.):
- Riesgos conocidos:

## Criterios de aceptación

- [ ] ...
- [ ] Tests añadidos
- [ ] Docs actualizados si aplica
- [ ] `typecheck + lint + test:coverage + build` en verde

## Dependencias

- Otras issues/PRs: #
- Fase previa necesaria: Fx
- Variables de entorno nuevas:

## Checklist previo

- [ ] Fase del roadmap identificada o justificada si está fuera
- [ ] Guía transversal relevante enlazada
- [ ] Implicaciones RGPD/LOPDGDD consideradas
- [ ] Implicaciones fiscales consideradas (Verifactu/RD 1007) si toca facturación
