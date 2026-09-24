# Soporte Afiladocs

### Propósito de este documento

- **Objetivos:** Señalar canales de soporte y los runbooks vivos sin
  sustituir su contenido operativo.
- **Estructura:** Contacto → antes de reportar → tabla de runbooks →
  guías → stack.
- **Contenido a integrar según contexto:** No reescribas los runbooks ni
  cambies los canales. Si un incidente tiene receta, enlázala; no la
  dupliques aquí.

## Canales de contacto

- **Clientes:** formulario en <https://afiladocs.com/contacto> o email a soporte.
- **Ops / incidentes:** consultar primero los runbooks de [docs/runbooks/](docs/runbooks/).
- **Desarrollo:** leer [docs/README.md](docs/README.md) y [CLAUDE.md](CLAUDE.md) antes de abrir un PR.

## Antes de reportar un bug

1. Reproducir en local con `npm run ci:local` (typecheck + lint + tests + build).
2. Comprobar si ya existe un issue en GitHub con etiqueta correspondiente.
3. Si es un incidente de producción, seguir el runbook adecuado antes de crear una tarea.

## Runbooks de incidentes

Recetas paso a paso para escenarios comunes:

| Escenario                                 | Runbook                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Go-live P0b (poblar Stripe + DocuSeal)    | [docs/runbooks/golive-stripe-live.md](docs/runbooks/golive-stripe-live.md)         |
| Revertir un deploy fallido                | [docs/runbooks/rollback-vercel.md](docs/runbooks/rollback-vercel.md)               |
| Rotación de secretos                      | [docs/runbooks/rotacion-secretos.md](docs/runbooks/rotacion-secretos.md)           |
| Recuperar PDF firmado tras fallo DocuSeal | [docs/runbooks/recovery-docuseal.md](docs/runbooks/recovery-docuseal.md)           |
| Reconciliar webhook de Stripe             | [docs/runbooks/stripe-webhook-fallido.md](docs/runbooks/stripe-webhook-fallido.md) |
| Violación RLS (cliente ve datos ajenos)   | [docs/runbooks/incidente-rls.md](docs/runbooks/incidente-rls.md)                   |

## Guías transversales

- [docs/guias/guia-seguridad.md](docs/guias/guia-seguridad.md) — CSP, Zod, RLS, RGPD.
- [docs/guias/guia-calidad.md](docs/guias/guia-calidad.md) — linters, tests, cobertura.
- [docs/guias/guia-ui-ux.md](docs/guias/guia-ui-ux.md) — accesibilidad y diseño.
- [docs/guias/guia-workflows.md](docs/guias/guia-workflows.md) — ramas, CI/CD, deploy.

## Stack y entorno

- Node.js 22.x (ver `engines` en [package.json](package.json)).
- Next.js, React, TypeScript, Tailwind, Prisma, Supabase, Stripe, DocuSeal.
- Comandos principales en [README.md](README.md#comandos).

## Reportar problemas de seguridad

No abrir un issue público. Seguir el protocolo de rotación de secretos en
[docs/runbooks/rotacion-secretos.md](docs/runbooks/rotacion-secretos.md) y
contactar al responsable del proyecto directamente.

## Versionado e historial

- Changelog: [CHANGELOG.md](CHANGELOG.md).
- Fases cerradas: [docs/archive/](docs/archive/).
- Estado actual: [docs/00-ESTADO-ACTUAL.md](docs/00-ESTADO-ACTUAL.md).
