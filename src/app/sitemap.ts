import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.meutrevo.com';

const publicRoutes = [
  { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
  { path: '/megasena', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/lotofacil', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/quina', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/lotomania', changeFrequency: 'daily' as const, priority: 0.9 },
  { path: '/duplasena', changeFrequency: 'daily' as const, priority: 0.85 },
  { path: '/diadesorte', changeFrequency: 'daily' as const, priority: 0.85 },
  { path: '/timemania', changeFrequency: 'daily' as const, priority: 0.85 },
  { path: '/supersete', changeFrequency: 'daily' as const, priority: 0.85 },
  {
    path: '/maismilionaria',
    changeFrequency: 'daily' as const,
    priority: 0.85,
  },
  { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
