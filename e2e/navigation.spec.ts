import { test, expect } from '@playwright/test';

test.describe('Páginas Públicas', () => {
  const lotteryPages = [
    { path: '/megasena', name: 'Mega-Sena' },
    { path: '/lotofacil', name: 'Lotofácil' },
    { path: '/quina', name: 'Quina' },
    { path: '/lotomania', name: 'Lotomania' },
    { path: '/duplasena', name: 'Dupla Sena' },
    { path: '/diadesorte', name: 'Dia de Sorte' },
    { path: '/timemania', name: 'Timemania' },
    { path: '/maismilionaria', name: '+Milionária' },
    { path: '/supersete', name: 'Super Sete' },
    { path: '/loteca', name: 'Loteca' },
    { path: '/loteriafederal', name: 'Loteria Federal' },
  ];

  test('deve carregar a landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Meu Trevo');
  });

  test('deve carregar página da Mega-Sena', async ({ page }) => {
    await page.goto('/megasena');
    await expect(page.locator('text=Mega-Sena').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('deve carregar página da Lotofácil', async ({ page }) => {
    await page.goto('/lotofacil');
    await expect(page.locator('text=Lotofácil').first()).toBeVisible({
      timeout: 15000,
    });
  });

  for (const lottery of lotteryPages) {
    test(`deve navegar de ${lottery.name} para o login do app`, async ({
      page,
    }) => {
      await page.goto(lottery.path);
      await page
        .getByRole('link', { name: /Entrar no App/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/login\?next=%2Fapp$/, {
        timeout: 10000,
      });
    });
  }

  test('deve carregar página de termos', async ({ page }) => {
    await page.goto('/terms');
    await expect(
      page.getByRole('heading', { name: 'Termos de Uso' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('deve carregar página de privacidade', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('deve navegar da landing page para o app', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Entrar no App');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp$/, { timeout: 10000 });
  });

  test('deve retornar dados da loteria na API', async ({ request }) => {
    const response = await request.get('/api/loteria/megasena?limit=1', {
      timeout: 30000,
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.latest).toBeTruthy();
    expect(data.latest.numero).toBeGreaterThan(0);
  });

  test('deve retornar configurações na API', async ({ request }) => {
    const response = await request.get('/api/config');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });
});
