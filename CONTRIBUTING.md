# Contribuir — afiladocs

### Propósito de este documento

- **Objetivos:** Explicar setup, flujo de rama/PR y reglas locales para
  contribuir sin romper checkout, firma, RLS ni el contrato de env vars.
- **Estructura:** Requisitos → flujo → commits → seguridad.
- **Contenido a integrar según contexto:** Adapta scripts pnpm y jobs CI
  de este SaaS. No copies un flujo npm de sitio estático. Lee
  [AGENTS.md](AGENTS.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Requisitos

- Node **22** (`engines` / CI)
- pnpm (`packageManager` en `package.json`)

## Flujo

1. Rama desde `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`).
2. Copia `.env.example` → `.env.local` (nunca commits de secretos).
3. `pnpm install && pnpm run typecheck && pnpm run lint && pnpm test`
4. `pnpm run build && pnpm run smoke` (o `make validate`).
5. PR con CI verde: jobs `quality`, `test`, `build`, `smoke` (GitHub-hosted
   `ubuntu-latest` + Vercel preview). Pide revisión a `@Alexendros`.

## Commits

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`).

## Seguridad

Vulnerabilidades: ver [SECURITY.md](SECURITY.md). No abras issues públicos con detalles explotables.
