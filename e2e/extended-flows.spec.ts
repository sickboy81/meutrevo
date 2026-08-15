import { request as playwrightRequest, test, expect } from '@playwright/test';
import { generateValidCpf } from './helpers';

type SessionUser = {
  email: string;
  userId: string;
  name: string;
  csrfToken: string;
  cookieHeader: string;
  authHeaders: Record<string, string>;
};

async function createSessionUser(label: string): Promise<SessionUser> {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
  const name = `E2E ${label}`;
  const context = await playwrightRequest.newContext({
    baseURL: 'http://localhost:3001',
    extraHTTPHeaders: {
      'x-forwarded-for': label === 'flow' ? '198.51.100.30' : '198.51.100.31',
    },
  });

  try {
    const configResponse = await context.get('/api/config');
    expect(configResponse.status()).toBe(200);

    const registerResponse = await context.post('/api/auth/register', {
      data: {
        email,
        name,
        password: 'Test123456',
        cpf_cnpj: generateValidCpf(email),
      },
    });
    expect(registerResponse.status()).toBe(200);

    // O cadastro pode não devolver sessão mesmo com confirmação desativada;
    // o login explícito valida o fluxo real e garante os cookies para os testes seguintes.
    const preLoginState = await context.storageState();
    const csrfCookie = preLoginState.cookies.find(
      (cookie) => cookie.name === 'csrf_token'
    );
    const loginResponse = await context.post('/api/auth/login', {
      headers: csrfCookie?.value
        ? { 'x-csrf-token': csrfCookie.value }
        : undefined,
      data: { email, password: 'Test123456' },
    });
    expect(loginResponse.status()).toBe(200);

    const registerData = await registerResponse.json();
    const storageState = await context.storageState();
    const token = storageState.cookies.find(
      (cookie) => cookie.name === 'sb-access-token'
    );
    const csrf = storageState.cookies.find(
      (cookie) => cookie.name === 'csrf_token'
    );

    expect(token?.value).toBeTruthy();
    expect(csrf?.value).toBeTruthy();

    const csrfToken = csrf!.value;
    const cookieHeader = `sb-access-token=${token!.value}; csrf_token=${csrfToken}`;
    return {
      email,
      userId: registerData.user.id,
      name,
      csrfToken,
      cookieHeader,
      authHeaders: {
        Cookie: cookieHeader,
        'x-csrf-token': csrfToken,
      },
    };
  } finally {
    await context.dispose();
  }
}

test.describe.configure({ mode: 'serial', timeout: 120_000 });

test('fluxo funcional completo cobre rotas autenticadas, bolao, push, recovery, webhook e guardas admin', async ({
  request,
}) => {
  const user = await createSessionUser('flow');
  const joiner = await createSessionUser('joiner');

  const meResponse = await request.get('/api/auth/me', {
    headers: { Cookie: user.cookieHeader },
  });
  expect(meResponse.status()).toBe(200);
  const meData = await meResponse.json();
  expect(meData.user.email).toBe(user.email);

  const updateResponse = await request.post('/api/auth/update', {
    headers: user.authHeaders,
    data: {
      name: 'Flow Updated',
      favorite_lottery: 'quina',
      cpf_cnpj: generateValidCpf(`${user.email}-updated`),
      city: 'Sao Paulo',
      state: 'sp',
    },
  });
  expect(updateResponse.status()).toBe(200);
  const updateData = await updateResponse.json();
  expect(updateData.user.name).toBe('Flow Updated');
  expect(updateData.user.favorite_lottery).toBe('quina');
  expect(updateData.user.state).toBe('SP');

  const createGame = await request.post('/api/games', {
    headers: user.authHeaders,
    data: {
      lottery: 'megasena',
      numbers: [1, 2, 3, 4, 5, 6],
    },
  });
  expect(createGame.status()).toBe(200);
  const gameData = await createGame.json();
  expect(gameData.success).toBeTruthy();

  const listGames = await request.get('/api/games', {
    headers: { Cookie: user.cookieHeader },
  });
  expect(listGames.status()).toBe(200);
  const listGamesData = await listGames.json();
  expect(
    listGamesData.games.some(
      (game: { id: string }) => game.id === gameData.gameId
    )
  ).toBeTruthy();

  const deleteGame = await request.delete(`/api/games?id=${gameData.gameId}`, {
    headers: user.authHeaders,
  });
  expect(deleteGame.status()).toBe(200);

  const createSimulation = await request.post('/api/simulations', {
    headers: user.authHeaders,
    data: {
      lottery: 'lotofacil',
      numbers: '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15',
      max_hits: 11,
      hits_count: 4,
    },
  });
  expect(createSimulation.status()).toBe(200);
  const simulationData = await createSimulation.json();

  const listSimulations = await request.get(
    '/api/simulations?lottery=lotofacil&sort=asc',
    {
      headers: { Cookie: user.cookieHeader },
    }
  );
  expect(listSimulations.status()).toBe(200);
  const listSimulationsData = await listSimulations.json();
  expect(
    listSimulationsData.simulations.some(
      (simulation: { id: string }) => simulation.id === simulationData.simId
    )
  ).toBeTruthy();

  const deleteSimulation = await request.delete(
    `/api/simulations?id=${simulationData.simId}`,
    {
      headers: user.authHeaders,
    }
  );
  expect(deleteSimulation.status()).toBe(200);

  const rankingInsertAsFree = await request.post('/api/ranking', {
    headers: user.authHeaders,
    data: {
      lottery: 'megasena',
      contest_num: 9999,
      numbers_played: '01,02,03,04,05,06',
      hits: 4,
      prize_won: 100,
    },
  });
  expect(rankingInsertAsFree.status()).toBe(403);

  const rankingToggle = await request.patch('/api/ranking', {
    headers: user.authHeaders,
    data: { show_in_ranking: false },
  });
  expect(rankingToggle.status()).toBe(200);

  const rankingList = await request.get(
    '/api/ranking?lottery=megasena&period=month',
    {
      headers: { Cookie: user.cookieHeader },
    }
  );
  expect(rankingList.status()).toBe(200);
  const rankingData = await rankingList.json();
  expect(rankingData.user_stats).toBeTruthy();

  const checkout = await request.post('/api/payments/checkout', {
    headers: user.authHeaders,
    data: { planType: 'monthly', provider: 'pixgo' },
  });
  expect(checkout.status()).toBe(200);
  const checkoutData = await checkout.json();
  expect(checkoutData.data.payment_id).toContain('mock_dep_');

  const paymentStatus = await request.get(
    `/api/payments/status?id=${checkoutData.data.payment_id}&confirm=true`,
    { headers: user.authHeaders }
  );
  expect(paymentStatus.status()).toBe(200);

  const meAfterUpgrade = await request.get('/api/auth/me', {
    headers: { Cookie: user.cookieHeader },
  });
  expect(meAfterUpgrade.status()).toBe(200);
  const meAfterUpgradeData = await meAfterUpgrade.json();
  expect(meAfterUpgradeData.user.role).toBe('pro');

  const rankingInsert = await request.post('/api/ranking', {
    headers: user.authHeaders,
    data: {
      lottery: 'megasena',
      contest_num: 9999,
      numbers_played: '01,02,03,04,05,06',
      hits: 4,
      prize_won: 100,
    },
  });
  expect(rankingInsert.status()).toBe(200);

  const createBet = await request.post('/api/bets', {
    headers: user.authHeaders,
    data: {
      lottery: 'megasena',
      numbers: '01,02,03,04,05,06',
      contest_num: 9999,
      cost: 6,
      prize_won: 0,
    },
  });
  expect(createBet.status()).toBe(200);
  const betData = await createBet.json();

  const listBets = await request.get('/api/bets', {
    headers: { Cookie: user.cookieHeader },
  });
  expect(listBets.status()).toBe(200);
  const listBetsData = await listBets.json();
  expect(
    listBetsData.bets.some((bet: { id: string }) => bet.id === betData.betId)
  ).toBeTruthy();

  const deleteBet = await request.delete(`/api/bets?id=${betData.betId}`, {
    headers: user.authHeaders,
  });
  expect(deleteBet.status()).toBe(200);

  const webhookPayload = {
    event: 'payment.completed',
    data: { external_id: user.userId },
  };

  const webhookFirst = await request.post('/api/payments/webhook', {
    data: webhookPayload,
  });
  expect(webhookFirst.status()).toBe(200);
  const webhookFirstData = await webhookFirst.json();
  expect(webhookFirstData.received).toBeTruthy();

  const webhookDuplicate = await request.post('/api/payments/webhook', {
    data: webhookPayload,
  });
  expect(webhookDuplicate.status()).toBe(200);
  const webhookDuplicateData = await webhookDuplicate.json();
  expect(webhookDuplicateData.duplicate).toBeTruthy();

  const createBolao = await request.post('/api/bolao', {
    headers: user.authHeaders,
    data: {
      lottery: 'megasena',
      title: 'Bolao E2E',
      games: [['01', '02', '03', '04', '05', '06']],
      cotas_total: 2,
      taxa_pct: 0,
    },
  });
  expect(createBolao.status()).toBe(200);
  const createBolaoData = await createBolao.json();
  expect(createBolaoData.shareCode).toBeTruthy();

  const listCreatedBoloes = await request.get('/api/bolao', {
    headers: { Cookie: user.cookieHeader },
  });
  expect(listCreatedBoloes.status()).toBe(200);
  const listCreatedData = await listCreatedBoloes.json();
  expect(
    listCreatedData.created.some(
      (bolao: { id: string }) => bolao.id === createBolaoData.id
    )
  ).toBeTruthy();

  const getBolaoByCode = await request.get(
    `/api/bolao?code=${createBolaoData.shareCode}`
  );
  expect(getBolaoByCode.status()).toBe(200);

  const logoutCreator = await request.post('/api/auth/logout', {
    headers: user.authHeaders,
  });
  expect(logoutCreator.status()).toBe(200);

  const joinBolao = await request.post('/api/bolao/join', {
    headers: joiner.authHeaders,
    data: { shareCode: createBolaoData.shareCode },
  });
  expect(joinBolao.status()).toBe(200);

  const listJoinedBoloes = await request.get('/api/bolao', {
    headers: { Cookie: joiner.cookieHeader },
  });
  expect(listJoinedBoloes.status()).toBe(200);
  const listJoinedData = await listJoinedBoloes.json();
  expect(
    listJoinedData.joined.some(
      (bolao: { id: string }) => bolao.id === createBolaoData.id
    )
  ).toBeTruthy();

  const pushEndpoint = `https://push.example/${Date.now()}`;
  const pushSubscribe = await request.post('/api/push/subscribe', {
    headers: joiner.authHeaders,
    data: {
      subscription: {
        endpoint: pushEndpoint,
        keys: { p256dh: 'key', auth: 'auth' },
      },
    },
  });
  expect(pushSubscribe.status()).toBe(200);

  const pushCountAfterSubscribe = await request.get('/api/push/subscribe', {
    headers: { Cookie: joiner.cookieHeader },
  });
  expect(pushCountAfterSubscribe.status()).toBe(200);
  const pushCountData = await pushCountAfterSubscribe.json();
  expect(pushCountData.count).toBeGreaterThan(0);

  const pushDelete = await request.delete('/api/push/subscribe', {
    headers: joiner.authHeaders,
    data: { endpoint: pushEndpoint },
  });
  expect(pushDelete.status()).toBe(200);

  const recoverNonexistent = await request.post('/api/auth/recover', {
    data: { email: `ghost-${Date.now()}@e2e.test` },
  });
  expect(recoverNonexistent.status()).toBe(200);

  const resetInvalid = await request.post('/api/auth/reset', {
    headers: joiner.authHeaders,
    data: {
      token: 'invalid-token',
      newPassword: 'NovaSenha123',
    },
  });
  expect(resetInvalid.status()).toBe(400);

  const adminUsersUnauthorized = await request.get('/api/admin/users');
  expect([401, 403]).toContain(adminUsersUnauthorized.status());

  const adminSeedUnauthorized = await request.get('/api/admin/seed-cache');
  expect([401, 403]).toContain(adminSeedUnauthorized.status());

  const configPostUnauthorized = await request.post('/api/config', {
    headers: joiner.authHeaders,
    data: { key: 'price_monthly', value: '99.90' },
  });
  expect([401, 403]).toContain(configPostUnauthorized.status());

  const deleteAccount = await request.post('/api/auth/delete', {
    headers: joiner.authHeaders,
  });
  expect(deleteAccount.status()).toBe(200);

  const meAfterDelete = await request.get('/api/auth/me');
  expect(meAfterDelete.status()).toBe(401);
});
