# Contribuir — afiladocs

## Requisitos

- Node **22** (`engines` / CI)
- pnpm (`packageManager` en `package.json`)

## Flujo

1. Rama desde `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`).
2. Copia `.env.example` → `.env.local` (nunca commits de secretos).
3. `pnpm install && pnpm typecheck && pnpm lint && pnpm test`
4. PR con CI verde (GitHub-hosted `ubuntu-latest` + Vercel preview).

## Commits

Conventional Commits (`feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`).

## Seguridad

Vulnerabilidades: ver [SECURITY.md](SECURITY.md). No abras issues públicos con detalles explotables.
