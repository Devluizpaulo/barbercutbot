import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    // Content Security Policy
    // Note: Next.js dev mode needs 'unsafe-eval' for React Refresh.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      [
        "script-src",
        "'self'",
        "https://js.stripe.com",
        "https://browser.sentry-cdn.com",
        "https://www.googletagmanager.com",
        // Allow inline/eval in dev for Next.js dev tools
        !isProd && "'unsafe-inline'",
        !isProd && "'unsafe-eval'",
      ].filter(Boolean).join(' '),
      [
        "style-src",
        "'self'",
        "'unsafe-inline'",
      ].join(' '),
      [
        "img-src",
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://placehold.co',
        'https://picsum.photos',
        'https://api.qrserver.com',
      ].join(' '),
      [
        'font-src',
        "'self'",
        'data:',
      ].join(' '),
      [
        'connect-src',
        "'self'",
        'https://firestore.googleapis.com',
        'https://www.googleapis.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://*.googleapis.com',
        'https://api.stripe.com',
        'https://r.stripe.com',
        'https://m.stripe.com',
        'https://*.sentry.io',
        'wss://*',
      ].join(' '),
      [
        'frame-src',
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://checkout.stripe.com',
      ].join(' '),
      [
        'worker-src',
        "'self'",
        'blob:',
      ].join(' '),
      isProd && 'upgrade-insecure-requests',
    ]
      .filter(Boolean)
      .join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // Core security headers
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=(self "https://js.stripe.com")',
              'fullscreen=(self)',
            ].join(', '),
          },
          // Cross-Origin policies (preserve existing intent)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });

