/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@genkit-ai/google-genai', 'genkit'],
  // Define explicitamente a raiz para o file tracing e silenciar o aviso de múltiplos lockfiles
  outputFileTracingRoot: process.cwd(),
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
            // Em dev, desabilite COEP para permitir cross-origin (e.g. imagens do Firebase Storage)
            // Em produção, mantenha 'require-corp' apenas se você realmente precisar de SAB/wasm com COEP
            value: process.env.NODE_ENV === 'production' ? 'require-corp' : 'unsafe-none',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
