
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Genkit needs to be external to the server bundle.
    serverComponentsExternalPackages: [
      '@genkit-ai/ai-sdk',
      '@genkit-ai/google-genai',
      'genkit',
      'zod',
    ],
  },
  // The following headers are required for Google Auth to work properly.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  }
};

export default nextConfig;
