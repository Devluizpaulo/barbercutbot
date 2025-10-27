import { describe, it, expect, beforeEach, vi } from 'vitest'

// Utility to set env and load module fresh
async function loadEnvWith(vars: Record<string, string | undefined>) {
  const original = process.env
  process.env = { ...original, ...vars } as any
  vi.resetModules()
  const { env } = await import('../lib/env')
  const value = env()
  // restore
  process.env = original
  return value
}

describe('env() validation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('parses required variables successfully', async () => {
    const e = await loadEnvWith({
      NODE_ENV: 'development',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:9002',
      STRIPE_SECRET_KEY: 'sk_test_123',
    })
    expect(e.NODE_ENV).toBe('development')
    expect(e.NEXT_PUBLIC_BASE_URL).toBe('http://localhost:9002')
    expect(e.STRIPE_SECRET_KEY).toBe('sk_test_123')
  })

  it('throws with missing STRIPE_SECRET_KEY', async () => {
    await expect(loadEnvWith({
      NODE_ENV: 'development',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:9002',
      STRIPE_SECRET_KEY: undefined,
    })).rejects.toThrow(/Environment validation failed/)
  })
})
