#!/usr/bin/env tsx
// Smoke del SaaS: arranca `next start` si no hay SMOKE_BASE_URL y comprueba
// GET /api/health. El middleware bloquea UA `curl`/`wget` en /api/* — usamos
// un UA propio. /api/health es infra y no exige sesión Supabase.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'

const PORT = process.env.SMOKE_PORT ?? '3000'
const BASE = (process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${PORT}`).replace(
  /\/$/,
  '',
)
const HEALTH = `${BASE}/api/health`
const UA = 'Afiladocs-Smoke/1.0'
const MANAGE_SERVER = process.env.SMOKE_BASE_URL === undefined
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? '60000')

function isHealthOk(body: unknown): body is { status: 'ok' } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'status' in body &&
    (body as { status: unknown }).status === 'ok'
  )
}

async function checkHealth(): Promise<void> {
  const res = await fetch(HEALTH, { headers: { 'user-agent': UA } })
  if (!res.ok) {
    throw new Error(`smoke: ${HEALTH} → HTTP ${res.status}`)
  }
  const body: unknown = await res.json()
  if (!isHealthOk(body)) {
    throw new Error(`smoke: ${HEALTH} body inesperado: ${JSON.stringify(body)}`)
  }
}

async function waitForHealth(): Promise<void> {
  const started = Date.now()
  let lastError: unknown
  while (Date.now() - started < TIMEOUT_MS) {
    try {
      await checkHealth()
      return
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`smoke: timeout ${TIMEOUT_MS}ms esperando ${HEALTH} (${detail})`)
}

async function main(): Promise<void> {
  let child: ChildProcess | undefined

  if (MANAGE_SERVER) {
    if (!existsSync('.next')) {
      throw new Error('smoke: falta .next — ejecuta `pnpm run build` primero')
    }
    child = spawn('pnpm', ['exec', 'next', 'start', '-p', PORT], {
      stdio: 'inherit',
      env: { ...process.env, PORT, NODE_ENV: 'production' },
    })
    child.on('exit', (code, signal) => {
      if (code && code !== 0 && code !== 143) {
        console.error(
          JSON.stringify({
            event: 'smoke.server-exit',
            code,
            signal,
            ts: new Date().toISOString(),
          }),
        )
      }
    })
  }

  try {
    await waitForHealth()
    console.log(
      JSON.stringify({
        event: 'smoke.ok',
        path: '/api/health',
        base: BASE,
        ts: new Date().toISOString(),
      }),
    )
  } finally {
    if (child?.pid) {
      child.kill('SIGTERM')
    }
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(JSON.stringify({ event: 'smoke.fail', message, ts: new Date().toISOString() }))
  process.exit(1)
})
