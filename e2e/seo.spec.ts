import { test, expect } from '@playwright/test';

const publicLotteryRoutes = [
  '/megasena',
  '/lotofacil',
  '/quina',
  '/lotomania',
  '/duplasena',
  '/diadesorte',
  '/timemania',
  '/maismilionaria',
  '/supersete',
  '/loteca',
  '/loteriafederal',
];

test.describe('SEO técnico', () => {
  test('sitemap inclui modalidades e concursos sem áreas privadas', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');

    const xml = await response.text();
    expect(xml).toContain('https://www.meutrevo.com/loteca');
    expect(xml).toContain('https://www.meutrevo.com/loteriafederal');
    expect(xml).toMatch(/\/concurso-\d+/);
    expect(xml).not.toContain('https://www.meutrevo.com/app');
    expect(xml).not.toContain('https://www.meutrevo.com/login');
  });

  for (const route of publicLotteryRoutes) {
    test(`${route} tem um h1, canonical próprio e imagem social`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.meutrevo.com${route}`
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        new RegExp(`/og/[^?]+$`)
      );
    });
  }

  test('página de modalidade leva a um concurso indexável', async ({
    page,
  }) => {
    await page.goto('/megasena');
    const contestLink = page.locator('a[href*="/megasena/concurso-"]').first();
    await expect(contestLink).toBeVisible();
    await contestLink.click();

    await expect(page).toHaveURL(/\/megasena\/concurso-\d+$/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /index, follow/
    );
    await expect(
      page.locator('script[type="application/ld+json"]')
    ).toHaveCount(1);
  });

  test('imagem Open Graph é servida como PNG', async ({ request }) => {
    const response = await request.get('/og/megasena');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).byteLength).toBeGreaterThan(10_000);
  });

  test('navegação para concurso anterior aponta para resultado existente', async ({
    page,
    request,
  }) => {
    await page.goto('/loteriafederal');
    const latestContest = page
      .locator('a[href*="/loteriafederal/concurso-"]')
      .first();
    await expect(latestContest).toBeVisible();
    await latestContest.click();

    const previousContest = page.locator(
      '.contest-actions a[href*="/loteriafederal/concurso-"]'
    );
    if ((await previousContest.count()) === 0) return;

    const href = await previousContest.first().getAttribute('href');
    expect(href).toBeTruthy();
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
  });

  test('áreas privadas permanecem fora do índice', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow'
    );
  });
});
