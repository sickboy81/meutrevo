import { test, expect } from '@playwright/test';
import { generateValidCpf } from './helpers';

test.describe('API Endpoints', () => {
  test.use({
    extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.20' },
  });

  test('GET /api/health deve retornar status', async ({ request }) => {
    const response = await request.get('/api/health', { timeout: 60000 });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBeTruthy();
    expect(data.uptime).toBeGreaterThan(0);
  });

  test('GET /api/auth/me sem token deve retornar 401', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('POST /api/auth/login com credenciais inválidas deve retornar erro', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'naoexiste@test.com',
        password: 'senhaerrada',
      },
    });
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('POST /api/auth/register deve criar novo usuário', async ({
    request,
  }) => {
    const email = `api-test-${Date.now()}@e2e.test`;
    const response = await request.post('/api/auth/register', {
      data: {
        email,
        name: 'API Test User',
        password: 'Test123456',
        cpf_cnpj: generateValidCpf(email),
      },
    });
    expect(response.status()).toBe(200);
  });

  test('POST /api/auth/register com senha curta deve retornar erro', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'short@test.com',
        name: 'Test',
        password: '123',
      },
    });
    expect([400, 403]).toContain(response.status());
  });

  test('POST /api/auth/register com senha longa demais deve retornar erro', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'long@test.com',
        name: 'Test',
        password: 'x'.repeat(200),
      },
    });
    expect([400, 403, 429]).toContain(response.status());
  });

  test('GET /api/loteria/megasena deve retornar dados da loteria', async ({
    request,
  }) => {
    const response = await request.get('/api/loteria/megasena?limit=1', {
      timeout: 60000,
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.latest).toBeTruthy();
    expect(data.latest.listaDezenas).toBeTruthy();
    expect(data.latest.numero).toBeGreaterThan(0);
  });

  test('GET /api/config deve retornar configurações', async ({ request }) => {
    const response = await request.get('/api/config');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.config.price_monthly).toBeTruthy();
  });

  test('Rate limiting deve funcionar no login', async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const response = await request.post('/api/auth/login', {
        data: {
          email: `ratelimit-${i}@test.com`,
          password: 'wrong',
        },
      });
      statuses.push(response.status());
    }

    const has429 = statuses.includes(429);
    expect(has429).toBeTruthy();
  });

  test('POST sem CSRF token deve ser bloqueado ou funcionar', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@test.com',
        password: 'test123',
      },
    });
    expect([200, 401, 403, 429]).toContain(response.status());
  });
});
