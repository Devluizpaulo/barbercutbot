/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      [
        "script-src",
        "'self'",
        "https://js.stripe.com",
        "https://www.googletagmanager.com",
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
    ].filter(Boolean).join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
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
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'api.qrserver.com', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
