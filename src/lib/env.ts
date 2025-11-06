import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

  // Stripe (server)
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Genkit AI
  GEMINI_API_KEY: z.string().optional(),

  // Firebase (client/public)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

  // Firebase Admin (server) - JSON string credentials (optional)
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
})

type Env = z.infer<typeof EnvSchema>

let cached: Env | null = null

export function env(): Env {
  if (cached) return cached
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Environment validation failed: ${issues}`)
  }
  const data = parsed.data
  if (data.NODE_ENV === 'production' && !data.NEXT_PUBLIC_BASE_URL) {
    throw new Error('Environment validation failed: NEXT_PUBLIC_BASE_URL: Required in production')
  }
  if (!data.NEXT_PUBLIC_BASE_URL) {
    data.NEXT_PUBLIC_BASE_URL = 'http://localhost:9002'
  }
  cached = data
  return cached
}
