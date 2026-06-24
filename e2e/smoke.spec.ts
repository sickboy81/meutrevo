import { test, expect } from '@playwright/test';

test('deve carregar a página inicial', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Meu Trevo');
});

test('deve navegar para Mega-Sena', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Mega-Sena');
  await expect(page).toHaveURL(/\/megasena/);
});

test('deve navegar para o app', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Entrar no App');
  await expect(page).toHaveURL(/\/app/);
});

test('deve carregar página de termos', async ({ page }) => {
  await page.goto('/terms');
  await expect(
    page.getByRole('heading', { name: 'Termos de Uso' })
  ).toBeVisible({ timeout: 10000 });
});

test('deve carregar página de privacidade', async ({ page }) => {
  await page.goto('/privacy');
  await expect(
    page.getByRole('heading', { name: 'Políticas de Privacidade' })
  ).toBeVisible({ timeout: 10000 });
});
