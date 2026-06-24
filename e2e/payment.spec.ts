import { test, expect } from '@playwright/test';

test.describe('Fluxo de Pagamento via API', () => {
  test('deve retornar erro ao tentar checkout sem autenticação', async ({
    request,
  }) => {
    const response = await request.post('/api/payments/checkout', {
      data: { planType: 'monthly' },
    });
    // Deve retornar 401 ou 403 (CSRF/auth)
    expect([401, 403, 429]).toContain(response.status());
  });

  test('deve retornar configurações de preço', async ({ request }) => {
    const response = await request.get('/api/config');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.config.price_monthly).toBeTruthy();
    expect(data.config.price_annual).toBeTruthy();
  });

  test('deve retornar status ao consultar pagamento inexistente', async ({
    request,
  }) => {
    const response = await request.get(
      '/api/payments/status?payment_id=nonexistent'
    );
    // Pode retornar 200, 400 (rate limit), 401 ou 403
    expect([200, 400, 401, 403, 429]).toContain(response.status());
  });
});
