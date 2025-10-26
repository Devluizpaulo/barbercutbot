import { NextRequest, NextResponse } from 'next/server'

type StoreValue = { timestamps: number[] }

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, StoreValue> | undefined
}

const store: Map<string, StoreValue> = global.__rateLimitStore || new Map()
if (!global.__rateLimitStore) global.__rateLimitStore = store

function getKey(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const path = new URL(req.url).pathname.startsWith('/api/webhooks') ? 'webhook' : 'api'
  return `${ip}:${path}`
}

function getPolicy(pathname: string) {
  if (pathname.startsWith('/api/webhooks')) {
    return { limit: 30, windowMs: 60_000 }
  }
  return { limit: 100, windowMs: 60_000 }
}

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url)
  const policy = getPolicy(pathname)
  const key = getKey(req)
  const now = Date.now()

  const entry = store.get(key) || { timestamps: [] }
  const windowStart = now - policy.windowMs
  const recent = entry.timestamps.filter((t) => t > windowStart)

  if (recent.length >= policy.limit) {
    const retryAfterSec = Math.ceil((recent[0] + policy.windowMs - now) / 1000)
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(retryAfterSec) } })
  }

  recent.push(now)
  store.set(key, { timestamps: recent })

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
