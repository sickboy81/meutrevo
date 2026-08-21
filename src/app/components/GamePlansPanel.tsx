'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import {
  calculateGamePlanCost,
  normalizeContestCount,
} from '@/lib/game-plan-cost';
import { getSimpleBetPrice } from '@/lib/lottery-prices';

type GeneratedGame = { numbers: number[] };
type Plan = {
  id: string;
  title: string;
  lottery: string;
  budget: number;
  contests_count: number;
  objective?: 'economy' | 'coverage' | 'balance' | 'conference';
  strategy: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  games_count: number;
  pending_count: number;
  next_contest: number | null;
};
type Schedule = {
  id: string;
  lottery: string;
  contest_num: number;
  status: 'pending' | 'checked' | 'winner' | 'cancelled';
  hits: number | null;
  prize_won: number | null;
  plan_title: string;
};
type ScheduleFilter = 'pending' | 'checked' | 'winner';
type PlanGame = {
  id: string;
  numbers: string;
  cost: number;
  schedules: Schedule[];
};

type Props = {
  lottery: string;
  generatedGames: GeneratedGame[];
  onOpenGenerator: (draft: {
    title: string;
    budget: string;
    contestsCount: string;
    lottery: string;
    objective: 'economy' | 'coverage' | 'balance' | 'conference';
    strategy: 'balanced' | 'aggressive' | 'delayed' | 'random';
  }) => void;
};

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
const statusLabels: Record<Plan['status'], string> = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
const statusColors: Record<Plan['status'], string> = {
  active: '#00e676',
  paused: '#ffd600',
  completed: '#7dd3fc',
  cancelled: '#ff6b8a',
};
const objectiveLabels: Record<NonNullable<Plan['objective']>, string> = {
  economy: 'Economizar',
  coverage: 'Cobertura',
  balance: 'Equilibrio',
  conference: 'Conferência',
};

export default function GamePlansPanel({
  lottery,
  generatedGames,
  onOpenGenerator,
}: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleFilter, setScheduleFilter] =
    useState<ScheduleFilter>('pending');
  const [title, setTitle] = useState('Meu plano de jogo');
  const [budget, setBudget] = useState('');
  const [contestsCount, setContestsCount] = useState('1');
  const [objective, setObjective] = useState<
    'economy' | 'coverage' | 'balance' | 'conference'
  >('balance');
  const [strategy, setStrategy] = useState<
    'balanced' | 'aggressive' | 'delayed' | 'random'
  >('balanced');
  const [status, setStatus] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState<
    'all' | Plan['status']
  >('all');
  const [saving, setSaving] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [planGames, setPlanGames] = useState<PlanGame[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const savingTitleRef = useRef<string | null>(null);

  const loadSchedules = async (filter: ScheduleFilter) => {
    setLoadingSchedules(true);
    setScheduleError('');
    try {
      const response = await fetchWithCsrf(`/api/schedules?status=${filter}`);
      if (!response.ok) throw new Error('Não foi possível carregar a agenda.');
      setSchedules((await response.json()).schedules || []);
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a agenda.'
      );
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    setLoadError('');
    try {
      const plansResponse = await fetchWithCsrf('/api/plans');
      if (!plansResponse.ok)
        throw new Error('Não foi possível carregar seus planos.');
      setPlans((await plansResponse.json()).plans || []);
      await loadSchedules(scheduleFilter);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar seus planos.'
      );
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadPlans();
    });
    return () => window.cancelAnimationFrame(frame);
    // loadPlans intentionally captures the initial schedule filter only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPlan = async () => {
    if (!generatedGames.length) {
      setStatus('Gere pelo menos um jogo antes de criar um plano.');
      return;
    }
    const numericBudget = Number(budget.replace(',', '.'));
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      setStatus('Informe um orçamento maior que zero.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const response = await fetchWithCsrf('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          lottery,
          budget: numericBudget,
          contestsCount: contests,
          objective,
          strategy,
          games: generatedGames.map((game) => game.numbers),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível salvar o plano.');
      setStatus('Plano criado com sucesso.');
      await loadPlans();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Erro ao criar plano.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'active' ? 'paused' : 'active';
    const response = await fetchWithCsrf(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) await loadPlans();
  };

  const deletePlan = async (plan: Plan) => {
    if (!window.confirm(`Excluir o plano "${plan.title}" e seus jogos?`))
      return;
    const response = await fetchWithCsrf(`/api/plans/${plan.id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setStatus('Plano excluído.');
      await loadPlans();
    } else {
      setStatus('Não foi possível excluir o plano.');
    }
  };

  const duplicatePlan = async (plan: Plan) => {
    const response = await fetchWithCsrf(`/api/plans/${plan.id}`, {
      method: 'POST',
    });
    if (response.ok) {
      setStatus('Plano duplicado com sucesso.');
      await loadPlans();
    } else {
      setStatus('Não foi possível duplicar o plano.');
    }
  };

  const savePlanTitle = async (plan: Plan) => {
    if (savingTitleRef.current === plan.id) return;
    const nextTitle = editingTitle.trim();
    if (!nextTitle || nextTitle === plan.title) {
      setEditingPlanId(null);
      return;
    }
    savingTitleRef.current = plan.id;
    try {
      const response = await fetchWithCsrf(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (response.ok) {
        setEditingPlanId(null);
        await loadPlans();
      } else {
        setStatus('Não foi possível renomear o plano.');
      }
    } finally {
      savingTitleRef.current = null;
    }
  };

  const togglePlanDetails = async (plan: Plan) => {
    if (expandedPlan === plan.id) {
      setExpandedPlan(null);
      return;
    }
    const response = await fetchWithCsrf(`/api/plans/${plan.id}`);
    if (!response.ok) {
      setStatus('Não foi possível carregar os jogos do plano.');
      return;
    }
    setPlanGames((await response.json()).games || []);
    setExpandedPlan(plan.id);
  };

  const exportPlan = (plan: Plan) => {
    if (!planGames.length) return;
    const rows = [
      [
        'Plano',
        'Loteria',
        'Jogo',
        'Dezenas',
        'Custo por concurso',
        'Concursos',
      ],
      ...planGames.map((game, index) => [
        plan.title,
        plan.lottery,
        String(index + 1),
        game.numbers.replace(/[\[\]"]/g, '').replaceAll(',', ' '),
        money.format(Number(game.cost || 0)),
        game.schedules.map((schedule) => schedule.contest_num).join(' '),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')
      )
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meu-trevo-plano-${plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const config = LOTTERY_CONFIGS[lottery];
  const contests = normalizeContestCount(contestsCount);
  const { costPerContest, total: estimatedTotal } = calculateGamePlanCost(
    lottery,
    generatedGames.length,
    contests
  );
  const numericBudget = Number(budget.replace(',', '.')) || 0;
  const budgetInsufficient =
    numericBudget > 0 && numericBudget < estimatedTotal;
  const totalPrize = schedules.reduce(
    (sum, schedule) => sum + Number(schedule.prize_won || 0),
    0
  );
  const totalHits = schedules.reduce(
    (sum, schedule) => sum + Number(schedule.hits || 0),
    0
  );
  const allNumbers = generatedGames.flatMap((game) => game.numbers);
  const uniqueNumbers = new Set(allNumbers).size;
  const repeatedNumbers = allNumbers.length - uniqueNumbers;
  const visiblePlans = plans.filter((plan) => {
    const matchesSearch =
      !planSearch.trim() ||
      `${plan.title} ${plan.lottery}`
        .toLowerCase()
        .includes(planSearch.trim().toLowerCase());
    const matchesStatus =
      planStatusFilter === 'all' || plan.status === planStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="glass-panel" aria-labelledby="game-plans-title">
      <h2
        id="game-plans-title"
        style={{ color: 'var(--accent-color)', marginTop: 0 }}
      >
        MEU PLANO DE JOGO
      </h2>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          lineHeight: 1.5,
        }}
      >
        Primeiro defina modalidade, objetivo e orçamento. Depois revise a
        estratégia explicada, gere os jogos e só então salve o plano. O plano
        não prevê resultados nem aumenta as chances reais.
      </p>

      <div
        style={{
          display: 'grid',
          gap: '0.65rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        }}
      >
        <label>
          Nome do plano
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />
        </label>
        <label>
          Orçamento total (R$)
          <input
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 30,00"
          />
        </label>
        <label>
          Concursos
          <input
            value={contestsCount}
            onChange={(event) => setContestsCount(event.target.value)}
            type="number"
            min="1"
            max="100"
          />
        </label>
        <label>
          Objetivo
          <select
            value={objective}
            onChange={(event) =>
              setObjective(event.target.value as typeof objective)
            }
          >
            <option value="balance">Equilibrar critérios</option>
            <option value="economy">Economizar</option>
            <option value="coverage">Ampliar cobertura</option>
            <option value="conference">Conferir histórico</option>
          </select>
        </label>
        <label>
          Estratégia
          <select
            value={strategy}
            onChange={(event) =>
              setStrategy(event.target.value as typeof strategy)
            }
          >
            <option value="balanced">Equilibrada</option>
            <option value="aggressive">Mais variação</option>
            <option value="delayed">Priorizar atraso histórico</option>
            <option value="random">Aleatória para comparação</option>
          </select>
        </label>
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          border: '1px solid rgba(0,240,255,0.16)',
          borderRadius: 10,
        }}
      >
        <strong>{config?.name || lottery}</strong>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            marginTop: 4,
          }}
        >
          Etapa 1: defina o objetivo, o orçamento e a quantidade de concursos.
          Depois avance para gerar e revisar os jogos antes de salvar o plano.
        </div>
      </div>

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          lineHeight: 1.5,
          margin: '0.65rem 0 0',
        }}
      >
        Objetivo atual:{' '}
        <strong style={{ color: 'var(--text-main)' }}>
          {objectiveLabels[objective]}
        </strong>{' '}
        {objective === 'economy'
          ? 'prioriza controlar o valor total.'
          : objective === 'coverage'
            ? 'prioriza distribuir combinações entre os jogos.'
            : objective === 'conference'
              ? 'prioriza registrar jogos para conferência posterior.'
              : 'prioriza uma composição equilibrada entre os critérios.'}{' '}
        A estratégia usa histórico descritivo e não prevê resultados.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginTop: '0.65rem',
          fontSize: '0.72rem',
        }}
      >
        <div className="metric-card">
          <strong>{uniqueNumbers}</strong>
          <span>dezenas únicas</span>
        </div>
        <div className="metric-card">
          <strong>{repeatedNumbers}</strong>
          <span>repetições entre jogos</span>
        </div>
        <div className="metric-card">
          <strong>{generatedGames.length}</strong>
          <span>jogos comparados</span>
        </div>
      </div>
      {generatedGames.length > 1 &&
        repeatedNumbers > generatedGames.length * 3 && (
          <p style={{ color: '#ffd600', fontSize: '0.72rem', marginBottom: 0 }}>
            Atenção: seus jogos têm concentração relevante de dezenas. Revise
            antes de salvar.
          </p>
        )}

      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          marginTop: '0.8rem',
        }}
      >
        <button
          type="button"
          className="theme-pill-btn"
          onClick={() =>
            onOpenGenerator({
              title,
              budget,
              contestsCount,
              lottery,
              objective,
              strategy,
            })
          }
        >
          Etapa 2: revisar e gerar jogos
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={createPlan}
          disabled={saving || !generatedGames.length || budgetInsufficient}
        >
          {saving ? 'Salvando...' : 'Criar plano'}
        </button>
      </div>
      {generatedGames.length > 0 && (
        <p
          style={{
            color: budgetInsufficient ? '#ff6b8a' : 'var(--text-muted)',
            fontSize: '0.72rem',
            marginBottom: 0,
          }}
        >
          Custo estimado: {money.format(costPerContest)} por concurso ·{' '}
          {money.format(estimatedTotal)} no total.
          {budgetInsufficient
            ? ' Aumente o orçamento para cobrir todos os jogos.'
            : ''}
        </p>
      )}
      {!generatedGames.length && (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            marginBottom: 0,
          }}
        >
          Referência: 1 jogo simples custa{' '}
          {money.format(getSimpleBetPrice(lottery))} por concurso. O total muda
          conforme a quantidade de jogos e concursos.
        </p>
      )}
      {status && (
        <p
          role="status"
          style={{
            color: status.includes('sucesso') ? '#00e676' : '#ffd600',
            fontSize: '0.75rem',
          }}
        >
          {status}
        </p>
      )}

      <div style={{ marginTop: '1.2rem' }}>
        <h3 style={{ fontSize: '0.9rem' }}>Planos salvos</h3>
        {loadingPlans && (
          <p
            role="status"
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
          >
            Carregando seus planos...
          </p>
        )}
        {!loadingPlans && loadError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center',
              color: '#ffd600',
              fontSize: '0.75rem',
            }}
          >
            <span>{loadError}</span>
            <button
              type="button"
              className="theme-pill-btn"
              onClick={() => void loadPlans()}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!loadingPlans && !loadError && plans.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '0.45rem',
              marginBottom: '0.55rem',
            }}
          >
            <input
              value={planSearch}
              onChange={(event) => setPlanSearch(event.target.value)}
              placeholder="Buscar plano ou loteria"
              aria-label="Buscar plano ou loteria"
            />
            <select
              value={planStatusFilter}
              onChange={(event) =>
                setPlanStatusFilter(
                  event.target.value as typeof planStatusFilter
                )
              }
              aria-label="Filtrar planos por status"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="completed">Concluídos</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        )}
        {!loadingPlans && !loadError && !plans.length && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Nenhum plano criado ainda.
          </p>
        )}
        {!loadingPlans &&
          !loadError &&
          plans.length > 0 &&
          !visiblePlans.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Nenhum plano corresponde ao filtro.
            </p>
          )}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {visiblePlans.map((plan) => (
            <article
              key={plan.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, auto)',
                justifyContent: 'space-between',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.7rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
              }}
            >
              <div>
                {editingPlanId === plan.id ? (
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void savePlanTitle(plan);
                      if (event.key === 'Escape') setEditingPlanId(null);
                    }}
                    onBlur={() => void savePlanTitle(plan)}
                    maxLength={80}
                    autoFocus
                    aria-label="Nome do plano"
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong>{plan.title}</strong>
                    <span
                      style={{
                        color: statusColors[plan.status],
                        border: `1px solid ${statusColors[plan.status]}55`,
                        borderRadius: 999,
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                      }}
                    >
                      {statusLabels[plan.status]}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    marginTop: 3,
                  }}
                >
                  {plan.lottery} ·{' '}
                  {objectiveLabels[plan.objective || 'balance']} ·{' '}
                  {plan.games_count} jogos · {money.format(Number(plan.budget))}{' '}
                  · {plan.contests_count} concurso(s)
                  {plan.next_contest
                    ? ` · próximo ${plan.next_contest}`
                    : ''} · {plan.pending_count} pendente(s)
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  minWidth: 0,
                }}
              >
                <button
                  type="button"
                  className="theme-pill-btn"
                  onClick={() => void updateStatus(plan)}
                >
                  {plan.status === 'active' ? 'Pausar' : 'Retomar'}
                </button>
                <button
                  type="button"
                  className="theme-pill-btn"
                  onClick={() => void togglePlanDetails(plan)}
                >
                  {expandedPlan === plan.id ? 'Fechar' : 'Ver jogos'}
                </button>
                <button
                  type="button"
                  className="theme-pill-btn"
                  onClick={() => {
                    setEditingPlanId(plan.id);
                    setEditingTitle(plan.title);
                  }}
                >
                  Renomear
                </button>
                <button
                  type="button"
                  className="theme-pill-btn"
                  onClick={() => void duplicatePlan(plan)}
                >
                  Duplicar
                </button>
                {expandedPlan === plan.id && (
                  <button
                    type="button"
                    className="theme-pill-btn"
                    onClick={() => exportPlan(plan)}
                  >
                    Exportar CSV
                  </button>
                )}
                <button
                  type="button"
                  className="theme-pill-btn"
                  onClick={() => void deletePlan(plan)}
                >
                  Excluir
                </button>
              </div>
              {expandedPlan === plan.id && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    marginTop: '0.4rem',
                    paddingTop: '0.55rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {planGames.map((game, index) => (
                    <div
                      key={game.id}
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        padding: '0.3rem 0',
                      }}
                    >
                      Jogo {index + 1}:{' '}
                      <strong style={{ color: 'white' }}>
                        {game.numbers
                          .replace(/[\[\]"]/g, '')
                          .replaceAll(',', ' · ')}
                      </strong>
                      <span>
                        {' '}
                        ·{' '}
                        {
                          game.schedules.filter(
                            (item) => item.status === 'pending'
                          ).length
                        }{' '}
                        pendente(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '1.2rem' }}>
        <h3 style={{ fontSize: '0.9rem' }}>Agenda de concursos</h3>
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            margin: '0.55rem 0',
          }}
        >
          {(['pending', 'checked', 'winner'] as ScheduleFilter[]).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                className={`theme-pill-btn ${scheduleFilter === filter ? 'active' : ''}`}
                onClick={() => {
                  setScheduleFilter(filter);
                  void loadSchedules(filter);
                }}
              >
                {filter === 'pending'
                  ? 'Pendentes'
                  : filter === 'checked'
                    ? 'Conferidos'
                    : 'Premiados'}
              </button>
            )
          )}
        </div>
        {scheduleFilter !== 'pending' && schedules.length > 0 && (
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              marginBottom: '0.55rem',
            }}
          >
            {schedules.length} registro(s) · {totalHits} acertos ·{' '}
            {money.format(totalPrize)} em prêmios
          </div>
        )}
        {loadingSchedules && (
          <p
            role="status"
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
          >
            Atualizando agenda...
          </p>
        )}
        {!loadingSchedules && scheduleError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center',
              color: '#ffd600',
              fontSize: '0.72rem',
            }}
          >
            <span>{scheduleError}</span>
            <button
              type="button"
              className="theme-pill-btn"
              onClick={() => void loadSchedules(scheduleFilter)}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!loadingSchedules && !scheduleError && !schedules.length && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Nenhum registro{' '}
            {scheduleFilter === 'pending'
              ? 'pendente'
              : scheduleFilter === 'checked'
                ? 'conferido'
                : 'premiado'}{' '}
            nos seus planos.
          </p>
        )}
        {!loadingSchedules && !scheduleError && (
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {schedules
              .slice(0, showAllSchedules ? undefined : 10)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.7rem',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    fontSize: '0.72rem',
                  }}
                >
                  <span>
                    {schedule.lottery} · concurso {schedule.contest_num}
                  </span>
                  <span
                    style={{
                      color:
                        schedule.status === 'winner' ? '#00e676' : '#ffd600',
                    }}
                  >
                    {schedule.status === 'winner'
                      ? `${schedule.hits} acertos · ${money.format(Number(schedule.prize_won || 0))}`
                      : schedule.plan_title}
                  </span>
                </div>
              ))}
            {schedules.length > 10 && (
              <button
                type="button"
                className="theme-pill-btn"
                onClick={() => setShowAllSchedules((visible) => !visible)}
              >
                {showAllSchedules
                  ? 'Mostrar menos'
                  : `Mostrar todos (${schedules.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
