# Afiladocs — targets canónicos P1+P2 (lint / test / smoke / validate).
# Requiere pnpm y Node 22. `smoke` espera un `.next` de `pnpm run build`.

.PHONY: lint test build smoke validate

lint:
	pnpm run check:env
	pnpm run typecheck
	pnpm run lint

test:
	pnpm run test:coverage

build:
	pnpm run build

smoke:
	pnpm run smoke

validate: lint test build smoke
