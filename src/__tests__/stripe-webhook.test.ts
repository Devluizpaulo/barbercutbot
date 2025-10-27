import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks shared state
let stripeInstance: any
let subsRetrieveMock = vi.fn()
let constructEventMock = vi.fn()

vi.mock('stripe', () => {
  class MockStripe {
    webhooks = { constructEvent: constructEventMock }
    subscriptions = { retrieve: subsRetrieveMock }
    constructor() {
      stripeInstance = this
    }
  }
  return { default: MockStripe }
})

let createEventDocMock = vi.fn().mockResolvedValue(undefined)
let updateShopMock = vi.fn().mockResolvedValue(undefined)
let collectionFn = vi.fn(() => ({ doc: vi.fn(() => ({ create: createEventDocMock })) }))
let docFn = vi.fn(() => ({ update: updateShopMock }))

// Helper to safely mutate environment in tests
const ORIGINAL_ENV = { ...process.env }
function setEnv(vars: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV, ...vars } as any
}

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  cert: vi.fn(),
  App: class {},
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: collectionFn,
    doc: docFn,
  })),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000 }),
    fromMillis: (ms: number) => ({ seconds: Math.floor(ms / 1000) }),
  },
}))

const buildRequest = (body: string) =>
  new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 't' },
    body,
  })

describe('Stripe webhook', () => {
  beforeEach(() => {
    vi.resetModules()
    // reset mocks
    subsRetrieveMock = vi.fn()
    constructEventMock = vi.fn()
    createEventDocMock = vi.fn().mockResolvedValue(undefined)
    updateShopMock = vi.fn().mockResolvedValue(undefined)
    collectionFn = vi.fn(() => ({ doc: vi.fn(() => ({ create: createEventDocMock })) }))
    docFn = vi.fn(() => ({ update: updateShopMock }))
    // reset env
    process.env = { ...ORIGINAL_ENV }
  })

  it('handles checkout.session.completed and updates subscription', async () => {
    setEnv({
      NODE_ENV: 'development',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:9002',
      STRIPE_SECRET_KEY: 'sk_test_123',
    })

    // Event to return from constructEvent
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { shopId: 'shop123', userId: 'user456' },
          subscription: 'sub_123',
        },
      },
    } as any

    constructEventMock.mockReturnValue(event)
    subsRetrieveMock.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      items: { data: [{ price: { id: 'price_123' } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 3600,
      metadata: { shopId: 'shop123', userId: 'user456' },
    })

    const { POST } = await import('../app/api/webhooks/stripe/route')
    const res = await POST(buildRequest('{}'))
    expect(res.ok).toBe(true)
    expect(updateShopMock).toHaveBeenCalled()
  })

  it('is idempotent and ignores duplicate events', async () => {
    setEnv({
      NODE_ENV: 'development',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:9002',
      STRIPE_SECRET_KEY: 'sk_test_123',
    })

    const event = { id: 'evt_dup', type: 'checkout.session.completed', data: { object: {} } } as any
    constructEventMock.mockReturnValue(event)

    // First call: create ok
    const { POST } = await import('../app/api/webhooks/stripe/route')
    let res = await POST(buildRequest('{}'))
    expect(res.ok).toBe(true)

    // Simulate duplicate: Firestore .create throws ALREADY_EXISTS
    createEventDocMock.mockRejectedValueOnce(Object.assign(new Error('ALREADY_EXISTS'), { code: 6 }))
    res = await POST(buildRequest('{}'))
    const body = await res.json()
    expect(body.duplicate).toBe(true)
  })
})
