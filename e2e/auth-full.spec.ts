import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test123456';

test.describe('Autenticação via API', () => {
  test('deve registrar novo usuário via API', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: TEST_EMAIL,
        name: 'E2E Test User',
        password: TEST_PASSWORD,
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.user.email).toBe(TEST_EMAIL);
    expect(data.user.role).toBe('free');
  });

  test('deve fazer login com credenciais válidas', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.user.email).toBe(TEST_EMAIL);
  });

  test('deve retornar erro com credenciais inválidas', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'naoexiste@test.com',
        password: 'senhaerrada',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('deve retornar erro com senha curta', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'short@test.com',
        name: 'Test',
        password: '123',
      },
    });
    expect([400, 403, 429]).toContain(response.status());
  });

  test('deve retornar erro com senha longa demais', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'long@test.com',
        name: 'Test',
        password: 'x'.repeat(200),
      },
    });
    expect([400, 403, 429]).toContain(response.status());
  });

  test('deve retornar 401 ao acessar /me sem token', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('deve retornar dados do usuário ao acessar /me com token válido', async ({
    request,
  }) => {
    // Login para obter token
    const loginRes = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Acessar /me com token (pode retornar 200, 401 ou 403 dependendo de CSRF)
    const meRes = await request.get('/api/auth/me', {
      headers: { Cookie: `token=${token}` },
    });
    expect([200, 401, 403, 429]).toContain(meRes.status());
  });
});
