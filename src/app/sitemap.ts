import type { MetadataRoute } from 'next';
import {
  getLatestLotteryResult,
  getRecentLotteryResults,
} from '@/lib/lottery-results';
import { LOTTERY_SEO_LIST } from '@/lib/lottery-seo';

const SITE_URL = 'https://www.meutrevo.com';
const SEO_RELEASE_DATE = new Date('2026-07-31T12:00:00.000Z');

export const revalidate = 3600;

function parseBrazilDate(date: string | undefined): Date | undefined {
  if (!date) return undefined;
  const [day, month, year] = date.split('/').map(Number);
  if (!day || !month || !year) return undefined;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recentByLottery = await Promise.all(
    LOTTERY_SEO_LIST.map(async (lottery) => {
      const cachedResults = await getRecentLotteryResults(lottery.id, 30);
      const latest =
        cachedResults.length === 0
          ? await getLatestLotteryResult(lottery.id)
          : null;

      return {
        lottery,
        results: latest ? [latest] : cachedResults,
      };
    })
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: SEO_RELEASE_DATE,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: SEO_RELEASE_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: SEO_RELEASE_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const lotteryPages: MetadataRoute.Sitemap = recentByLottery.map(
    ({ lottery, results }) => ({
      url: `${SITE_URL}${lottery.path}`,
      lastModified:
        parseBrazilDate(results[0]?.dataApuracao) ?? SEO_RELEASE_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    })
  );

  const contestPages: MetadataRoute.Sitemap = recentByLottery.flatMap(
    ({ lottery, results }) =>
      results
        .filter((result) => Number.isSafeInteger(result.numero))
        .map((result) => ({
          url: `${SITE_URL}${lottery.path}/concurso-${result.numero}`,
          lastModified:
            parseBrazilDate(result.dataApuracao) ?? SEO_RELEASE_DATE,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
  );

  return [...staticPages, ...lotteryPages, ...contestPages];
}
