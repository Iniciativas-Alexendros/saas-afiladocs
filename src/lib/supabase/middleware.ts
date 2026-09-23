import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabasePublicConfig, publicEnv } from '@/lib/env'

export async function updateSession(
  request: NextRequest,
  requestHeaders?: Headers,
) {
  const headers = requestHeaders ?? new Headers(request.headers)

  let supabaseResponse = NextResponse.next({
    request: { headers },
  })

  // Fail closed without throwing: createServerClient() raises
  // "Your project's URL and Key are required to create a Supabase client!"
  // when either public env is empty (prod 500 / MIDDLEWARE_INVOCATION_FAILED).
  if (!hasSupabasePublicConfig()) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request: { headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh session — this call is critical for keeping the auth
  // session alive on every navigation. Return value intentionally unused.
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error(JSON.stringify({
      event: 'middleware.supabase_session_refresh_failed',
      error: error instanceof Error ? error.message : 'unknown',
      ts: new Date().toISOString(),
    }))
  }

  return supabaseResponse
}
