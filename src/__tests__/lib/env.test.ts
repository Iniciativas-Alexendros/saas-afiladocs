import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('env — publicEnv', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('resolveSiteUrl: uses NEXT_PUBLIC_SITE_URL when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://afiladocs.com')
    const { publicEnv } = await import('@/lib/env')
    expect(publicEnv.siteUrl).toBe('https://afiladocs.com')
    vi.unstubAllEnvs()
  })

  it('resolveSiteUrl: prepends https:// to VERCEL_URL when no custom domain', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_URL', 'afiladocs.vercel.app')
    const { publicEnv } = await import('@/lib/env')
    expect(publicEnv.siteUrl).toBe('https://afiladocs.vercel.app')
    vi.unstubAllEnvs()
  })

  it('resolveSiteUrl: falls back to localhost in development', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_URL', '')
    const { publicEnv } = await import('@/lib/env')
    expect(publicEnv.siteUrl).toBe('http://localhost:3000')
    vi.unstubAllEnvs()
  })
})

describe('env — hasSupabasePublicConfig', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('reports both public keys when they are empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    const { missingSupabasePublicEnvKeys, hasSupabasePublicConfig } =
      await import('@/lib/env')
    expect(hasSupabasePublicConfig()).toBe(false)
    expect(missingSupabasePublicEnvKeys()).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ])
    vi.unstubAllEnvs()
  })

  it('reports only the anon key when URL is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.com')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    const { missingSupabasePublicEnvKeys, hasSupabasePublicConfig } =
      await import('@/lib/env')
    expect(hasSupabasePublicConfig()).toBe(false)
    expect(missingSupabasePublicEnvKeys()).toEqual([
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ])
    vi.unstubAllEnvs()
  })

  it('is true when URL and anon key are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.com')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-placeholder')
    const { hasSupabasePublicConfig, missingSupabasePublicEnvKeys } =
      await import('@/lib/env')
    expect(hasSupabasePublicConfig()).toBe(true)
    expect(missingSupabasePublicEnvKeys()).toEqual([])
    vi.unstubAllEnvs()
  })
})

describe('env — serverEnv lazy getters', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('optional getters return empty string when not set', async () => {
    vi.stubEnv('N8N_CONTACT_WEBHOOK_URL', '')
    const { serverEnv } = await import('@/lib/env')
    expect(serverEnv.n8nContactWebhook).toBe('')
    vi.unstubAllEnvs()
  })

  it('docusealApiUrl falls back to api.docuseal.com default', async () => {
    vi.stubEnv('DOCUSEAL_API_URL', '')
    const { serverEnv } = await import('@/lib/env')
    expect(serverEnv.docusealApiUrl).toBe('https://api.docuseal.com')
    vi.unstubAllEnvs()
  })
})
