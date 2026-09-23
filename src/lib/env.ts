// Validación y tipado centralizado de variables de entorno.
// Patrón: T3 Env lite — sin dependencia externa, falla en build si falta variable crítica.
// NUNCA importar serverEnv en client components ('use client').

function getEnvVar(key: string, required = true): string {
  const value = process.env[key]
  if (!value && required) {
    // En producción: lanza error que detiene el build/startup.
    // En desarrollo: advertencia para no bloquear el flujo local sin todas las vars.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    console.warn(`⚠️  Missing env variable: ${key} (required in production)`)
    return ''
  }
  return value ?? ''
}

// Resolución de URL base en tres niveles de prioridad:
//   1. NEXT_PUBLIC_SITE_URL — dominio propio (configurar cuando se adquiera)
//   2. VERCEL_URL — subdominio gratuito inyectado por Vercel en build time (sin protocolo https)
//   3. localhost:3000 — desarrollo local sin ninguna variable definida
//
// NOTA: VERCEL_URL no lleva prefijo https://, por eso se añade explícitamente.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// Variables server-only — NUNCA importar en componentes con 'use client'.
//
// Lazy getters: la validación ocurre en el momento de acceso (request time),
// no en la carga del módulo (build time). Esto evita que next build falle
// por variables no disponibles en el entorno de build de CI/Vercel.
export const serverEnv = {
  // Stripe
  get stripeSecretKey() { return getEnvVar('STRIPE_SECRET_KEY') },
  get stripeWebhookSecret() { return getEnvVar('STRIPE_WEBHOOK_SECRET') },
  // Email
  get resendApiKey() { return getEnvVar('RESEND_API_KEY') },
  get resendFromEmail() { return getEnvVar('RESEND_FROM_EMAIL', false) || 'noreply@afiladocs.com' },
  // Base de datos
  get databaseUrl() { return getEnvVar('DATABASE_URL') },
  // Supabase server-only
  get supabaseServiceRoleKey() { return getEnvVar('SUPABASE_SERVICE_ROLE_KEY') },
  // Webhooks externos — opcionales
  get n8nContactWebhook() { return getEnvVar('N8N_CONTACT_WEBHOOK_URL', false) },
  get n8nAlertsWebhookSecret() { return getEnvVar('N8N_ALERTS_WEBHOOK_SECRET', false) },
  // Error alerting — n8n Error Router webhook (opcional)
  get n8nErrorWebhookUrl() { return getEnvVar('N8N_ERROR_WEBHOOK_URL', false) },
  // Redis — opcionales (rate limiting graceful fallback sin Redis)
  get upstashRedisUrl() { return getEnvVar('UPSTASH_REDIS_REST_URL', false) },
  get upstashRedisToken() { return getEnvVar('UPSTASH_REDIS_REST_TOKEN', false) },
  // Firma electrónica — DocuSeal
  get docusealApiUrl() { return getEnvVar('DOCUSEAL_API_URL', false) || 'https://api.docuseal.com' },
  get docusealApiKey() { return getEnvVar('DOCUSEAL_API_KEY', false) },
  get docusealWebhookSecret() { return getEnvVar('DOCUSEAL_WEBHOOK_SECRET', false) },
  // Storage — bucket privado de Supabase con los masters rellenables
  get templatesBucket() { return getEnvVar('TEMPLATES_BUCKET', false) || 'templates' },
  // Revisiones expertas — SLA en horas (default 72h)
  get reviewSlaHours() { return Number(getEnvVar('REVIEW_SLA_HOURS', false) || '72') },
  // Facturación electrónica (EasyVerifactu — RD 1007/2023)
  get easyVerifactuApiUrl() { return getEnvVar('EASYVERIFACTU_API_URL', false) },
  get easyVerifactuApiKey() { return getEnvVar('EASYVERIFACTU_API_KEY', false) },
  // Cron jobs — Vercel Cron
  get cronSecret() { return getEnvVar('CRON_SECRET', false) },
  // Ops email — destinatario de alertas y reportes internos
  get opsEmail() { return getEnvVar('OPS_EMAIL', false) || 'ops@afiladocs.com' },
  // Geo-blocking — lista ISO-3166 alpha-2 separada por comas. Vacío por defecto (RGPD).
  get geoBlockedCountries() {
    return (getEnvVar('GEO_BLOCKED_COUNTRIES', false) || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  },
}

// Variables públicas — seguro para usar en client y server.
// NOTA: NEXT_PUBLIC_* son inlineadas por Next.js en build time.
// Los getters mantienen consistencia de importación en el codebase.
// supabaseUrl y supabaseAnonKey son seguras como variables públicas (RLS en Supabase).
export const publicEnv = {
  siteUrl: resolveSiteUrl(),
  get supabaseUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL ?? '' },
  get supabaseAnonKey() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
  // Vercel runtime env — inyectado automáticamente por Vercel en cada deployment.
  // 'production' | 'preview' | 'development'
  // En desarrollo local sin Vercel: undefined → se trata como 'development'.
  get vercelEnv() {
    return (process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development') as
      | 'production'
      | 'preview'
      | 'development'
  },
  get vercelGitBranch() { return process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? '' },
  get vercelGitSha() {
    return (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7)
  },
} as const

/** Nombres de env públicas de Supabase ausentes o vacías. No devuelve valores. */
export function missingSupabasePublicEnvKeys(): string[] {
  const missing: string[] = []
  if (!publicEnv.supabaseUrl.trim()) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!publicEnv.supabaseAnonKey.trim()) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return missing
}

export function hasSupabasePublicConfig(): boolean {
  return missingSupabasePublicEnvKeys().length === 0
}
