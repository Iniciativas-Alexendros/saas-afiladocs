import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const createServerClient = vi.fn()
const mockPublicEnv = { supabaseUrl: '', supabaseAnonKey: '' }

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}))

vi.mock('@/lib/env', () => ({
  publicEnv: {
    get supabaseUrl() {
      return mockPublicEnv.supabaseUrl
    },
    get supabaseAnonKey() {
      return mockPublicEnv.supabaseAnonKey
    },
  },
  hasSupabasePublicConfig() {
    return Boolean(
      mockPublicEnv.supabaseUrl.trim() && mockPublicEnv.supabaseAnonKey.trim(),
    )
  },
}))

function makeRequest(url = '/') {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('updateSession', () => {
  beforeEach(() => {
    createServerClient.mockReset()
    mockPublicEnv.supabaseUrl = ''
    mockPublicEnv.supabaseAnonKey = ''
  })

  it('does not construct a Supabase client when public env is missing', async () => {
    const { updateSession } = await import('@/lib/supabase/middleware')
    const res = await updateSession(makeRequest('/'))
    expect(createServerClient).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('refreshes the session when URL and anon key are present', async () => {
    mockPublicEnv.supabaseUrl = 'https://example.supabase.co'
    mockPublicEnv.supabaseAnonKey = 'anon-key'
    const getUser = vi.fn().mockResolvedValue({ data: { user: null } })
    createServerClient.mockReturnValue({ auth: { getUser } })

    const { updateSession } = await import('@/lib/supabase/middleware')
    await updateSession(makeRequest('/'))
    expect(createServerClient).toHaveBeenCalledTimes(1)
    expect(getUser).toHaveBeenCalledTimes(1)
  })

  it('does not throw when getUser fails', async () => {
    mockPublicEnv.supabaseUrl = 'https://example.supabase.co'
    mockPublicEnv.supabaseAnonKey = 'anon-key'
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error('network')) },
    })

    const { updateSession } = await import('@/lib/supabase/middleware')
    const res = await updateSession(makeRequest('/'))
    expect(res.status).toBe(200)
  })
})
