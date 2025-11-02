/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 90, 100],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.stripe.com https://www.googletagmanager.com https://accounts.google.com https://apis.google.com https://www.gstatic.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos",
              "connect-src 'self' ws: wss: https://firestore.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
              "font-src 'self'",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com https://*.google.com https://www.gstatic.com https://*.firebaseapp.com https://*.web.app",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
