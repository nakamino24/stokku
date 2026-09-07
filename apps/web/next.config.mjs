/** @type {import('next').NextConfig} */
const apiOrigin = process.env.API_ORIGIN;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stokku/ui', 'react-hook-form'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    // Browser uses same-origin /api/v1 so refresh cookie stays first-party (Lax).
    // Vercel proxies to Render via server-only API_ORIGIN; local dev falls back to localhost.
    if (apiOrigin) {
      return [
        { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
        { source: '/backend-health', destination: `${apiOrigin}/health` },
      ];
    }
    return [
      { source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' },
      { source: '/backend-health', destination: 'http://localhost:3001/health' },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
