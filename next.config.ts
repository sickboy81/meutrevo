import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const cspHeader = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.live https://vercel.live https://vercel.speed-insights.com https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://em-content.zobj.net https://cdn-icons-png.flaticon.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.turso.io wss://*.turso.io https://api.resend.com https://api.pixgo.com.br http://localhost:*`,
  `frame-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
].join('; ');

function getConfig(): NextConfig {
  const config: NextConfig = {
    experimental: {
      optimizePackageImports: ['@libsql/client', 'jsonwebtoken'],
    },
    images: {
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 768, 1024, 1280, 1536],
    },
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'Content-Security-Policy', value: cspHeader },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value:
                'camera=(), microphone=(), geolocation=(), interest-cohort=()',
            },
          ],
        },
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate',
            },
          ],
        },
        {
          source:
            '/(megasena|lotofacil|quina|lotomania|diadesorte|timemania|loteca)/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value:
                'public, s-maxage=300, maxage=60, stale-while-revalidate=600',
            },
          ],
        },
        {
          source: '/(privacy|terms)(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, s-maxage=86400, maxage=3600',
            },
          ],
        },
      ];
    },
  };
  const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  });
  return withBundleAnalyzer(config);
}

export default getConfig();
