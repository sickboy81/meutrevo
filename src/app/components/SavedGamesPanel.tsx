'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import type { LotteryResult, SavedGame } from '../types';

type SortMode = 'date-desc' | 'date-asc' | 'hits-desc' | 'hits-asc';
type GroupMode = 'none' | 'lottery' | 'date';

type Props = {
  savedGames: SavedGame[];
  selectedForPool: string[];
  setSelectedForPool: Dispatch<SetStateAction<string[]>>;
  setBolaoText: (value: string) => void;
  latestResultsMap: Record<string, LotteryResult>;
  getCleanDezenas: (result: LotteryResult) => string[];
  handleDeleteGame: (gameId: string) => void;
  downloadTXT: (gamesList: number[][], suffix?: string) => void;
  downloadPDF: (gamesList: number[][], title?: string) => void;
  handlePrintGames: (gamesList: number[][]) => void;
  isPro: boolean;
  bolaoCotas: string;
  setBolaoCotas: (value: string) => void;
  bolaoTaxa: string;
  setBolaoTaxa: (value: string) => void;
  setShowUpgradeModal: (value: boolean) => void;
  handleBuildBolao: () => void;
  bolaoText: string;
  handleCopyText: (text: string, type: string) => void;
  copyFeedback: string;
  bolaoShareUrl: string;
};

type EnrichedGame = {
  game: SavedGame;
  hits: number | null;
  isWinner: boolean;
  latestResult: LotteryResult | null;
  nums: string[];
};

const SAVED_GAMES_FILTERS_KEY = 'meu-trevo-saved-games-filters';

function getMinimumWinnerHits(lottery: string) {
  if (lottery === 'lotofacil') return 11;
  if (lottery === 'megasena') return 4;
  if (lottery === 'quina') return 2;
  return 20;
}

export default function SavedGamesPanel({
  savedGames,
  selectedForPool,
  setSelectedForPool,
  setBolaoText,
  latestResultsMap,
  getCleanDezenas,
  handleDeleteGame,
  downloadTXT,
  downloadPDF,
  handlePrintGames,
  isPro,
  bolaoCotas,
  setBolaoCotas,
  bolaoTaxa,
  setBolaoTaxa,
  setShowUpgradeModal,
  handleBuildBolao,
  bolaoText,
  handleCopyText,
  copyFeedback,
  bolaoShareUrl,
}: Props) {
  const [lotteryFilter, setLotteryFilter] = useState<string>('all');
  const [numberSearch, setNumberSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [onlyWinners, setOnlyWinners] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('none');
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SAVED_GAMES_FILTERS_KEY);
    if (!raw) {
      const frame = window.requestAnimationFrame(() => {
        setFiltersHydrated(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    try {
      const parsed = JSON.parse(raw) as {
        lotteryFilter?: string;
        numberSearch?: string;
        sortMode?: SortMode;
        onlyWinners?: boolean;
        groupMode?: GroupMode;
      };

      const frame = window.requestAnimationFrame(() => {
        if (typeof parsed.lotteryFilter === 'string') {
          setLotteryFilter(parsed.lotteryFilter);
        }
        if (typeof parsed.numberSearch === 'string') {
          setNumberSearch(parsed.numberSearch);
        }
        if (parsed.sortMode) {
          setSortMode(parsed.sortMode);
        }
        if (typeof parsed.onlyWinners === 'boolean') {
          setOnlyWinners(parsed.onlyWinners);
        }
        if (parsed.groupMode) {
          setGroupMode(parsed.groupMode);
        }
        setFiltersHydrated(true);
      });

      return () => window.cancelAnimationFrame(frame);
    } catch {
      sessionStorage.removeItem(SAVED_GAMES_FILTERS_KEY);
      const frame = window.requestAnimationFrame(() => {
        setFiltersHydrated(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;

    sessionStorage.setItem(
      SAVED_GAMES_FILTERS_KEY,
      JSON.stringify({
        lotteryFilter,
        numberSearch,
        sortMode,
        onlyWinners,
        groupMode,
      })
    );
  }, [
    filtersHydrated,
    lotteryFilter,
    numberSearch,
    sortMode,
    onlyWinners,
    groupMode,
  ]);

  const enrichedGames = useMemo<EnrichedGame[]>(() => {
    return savedGames.map((game) => {
      const nums = game.numbers.split(',').map((value) => value.trim());
      const latestResult = latestResultsMap[game.lottery] ?? null;

      if (!latestResult) {
        return { game, nums, hits: null, isWinner: false, latestResult: null };
      }

      const drawnNumbers = getCleanDezenas(latestResult).map(Number);
      const gameNumbers = nums.map(Number);
      const hits = gameNumbers.filter((n) => drawnNumbers.includes(n)).length;

      return {
        game,
        nums,
        hits,
        isWinner: hits >= getMinimumWinnerHits(game.lottery),
        latestResult,
      };
    });
  }, [savedGames, latestResultsMap, getCleanDezenas]);

  const lotteryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of enrichedGames) {
      counts.set(item.game.lottery, (counts.get(item.game.lottery) || 0) + 1);
    }
    return counts;
  }, [enrichedGames]);

  const visibleGames = useMemo(() => {
    const normalizedSearch = numberSearch
      .split(/[\s,;/-]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    const filtered = enrichedGames.filter(({ game, nums, isWinner }) => {
      if (lotteryFilter !== 'all' && game.lottery !== lotteryFilter) {
        return false;
      }

      if (onlyWinners && !isWinner) {
        return false;
      }

      if (normalizedSearch.length === 0) {
        return true;
      }

      return normalizedSearch.every((term) => {
        const normalizedTerm = term.padStart(2, '0');
        return nums.some((num) => num.includes(normalizedTerm));
      });
    });

    filtered.sort((a, b) => {
      if (sortMode === 'date-asc') {
        return (
          new Date(a.game.created_at).getTime() -
          new Date(b.game.created_at).getTime()
        );
      }
      if (sortMode === 'date-desc') {
        return (
          new Date(b.game.created_at).getTime() -
          new Date(a.game.created_at).getTime()
        );
      }

      const aHits = a.hits ?? -1;
      const bHits = b.hits ?? -1;
      if (sortMode === 'hits-asc') {
        return (
          aHits - bHits ||
          new Date(a.game.created_at).getTime() -
            new Date(b.game.created_at).getTime()
        );
      }
      return (
        bHits - aHits ||
        new Date(b.game.created_at).getTime() -
          new Date(a.game.created_at).getTime()
      );
    });

    return filtered;
  }, [enrichedGames, lotteryFilter, numberSearch, sortMode, onlyWinners]);

  const visibleIds = useMemo(
    () => visibleGames.map(({ game }) => game.id),
    [visibleGames]
  );
  const visibleWinnerIds = useMemo(
    () =>
      visibleGames
        .filter(({ isWinner }) => isWinner)
        .map(({ game }) => game.id),
    [visibleGames]
  );
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedForPool.includes(id));
  const someVisibleSelected = visibleIds.some((id) =>
    selectedForPool.includes(id)
  );
  const someVisibleWinnersSelected = visibleWinnerIds.some((id) =>
    selectedForPool.includes(id)
  );

  const groupedVisibleGames = useMemo(() => {
    if (groupMode === 'none') {
      return [
        {
          key: 'all',
          label: `Todos os jogos (${visibleGames.length})`,
          winnerCount: visibleGames.filter((item) => item.isWinner).length,
          items: visibleGames,
        },
      ];
    }

    const groups = new Map<string, EnrichedGame[]>();
    for (const item of visibleGames) {
      const key =
        groupMode === 'lottery'
          ? item.game.lottery
          : new Date(item.game.created_at).toLocaleDateString('pt-BR');
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label:
        groupMode === 'lottery'
          ? `${LOTTERY_CONFIGS[key]?.name || key.toUpperCase()} (${items.length})`
          : `${key} (${items.length})`,
      winnerCount: items.filter((item) => item.isWinner).length,
      items,
    }));
  }, [groupMode, visibleGames]);

  const visibleGameLists = visibleGames.map(({ game }) =>
    game.numbers.split(',').map(Number)
  );
  const selectedGameLists = visibleGames
    .filter(({ game }) => selectedForPool.includes(game.id))
    .map(({ game }) => game.numbers.split(',').map(Number));
  const winnerCount = enrichedGames.filter((item) => item.isWinner).length;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <span
            style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}
          >
            💾 SEUS JOGOS SALVOS ({savedGames.length})
          </span>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
            }}
          >
            {visibleGames.length} exibido(s) • {winnerCount} premiado(s) no
            último concurso carregado
          </div>
        </div>

        {savedGames.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              minWidth: '260px',
              flex: 1,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => downloadTXT(visibleGameLists, 'salvos')}
              className="theme-pill-btn"
              style={{
                fontSize: '0.65rem',
                padding: '0.35rem 0.55rem',
                textAlign: 'center',
              }}
            >
              📥 TXT
            </button>
            <button
              onClick={() => downloadPDF(visibleGameLists, 'Jogos Salvos')}
              className="theme-pill-btn"
              style={{
                fontSize: '0.65rem',
                padding: '0.35rem 0.55rem',
                textAlign: 'center',
              }}
            >
              📄 PDF
            </button>
            <button
              onClick={() => handlePrintGames(visibleGameLists)}
              className="theme-pill-btn"
              style={{
                fontSize: '0.65rem',
                padding: '0.35rem 0.55rem',
                textAlign: 'center',
              }}
            >
              🖨️ IMPRIMIR
            </button>
          </div>
        )}
      </div>

      {savedGames.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.6rem',
              marginBottom: '0.75rem',
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                Filtrar por loteria
              </label>
              <select
                value={lotteryFilter}
                onChange={(e) => setLotteryFilter(e.target.value)}
                className="auth-input"
                style={{ width: '100%', padding: '0.45rem' }}
              >
                <option value="all">Todas</option>
                {Object.entries(LOTTERY_CONFIGS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} ({lotteryCounts.get(key) || 0})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                Buscar por número
              </label>
              <input
                type="text"
                value={numberSearch}
                onChange={(e) => setNumberSearch(e.target.value)}
                placeholder="Ex.: 06 17 45"
                className="auth-input"
                style={{ width: '100%', padding: '0.45rem' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                Agrupar por
              </label>
              <select
                value={groupMode}
                onChange={(e) => setGroupMode(e.target.value as GroupMode)}
                className="auth-input"
                style={{ width: '100%', padding: '0.45rem' }}
              >
                <option value="none">Sem agrupamento</option>
                <option value="lottery">Loteria</option>
                <option value="date">Data</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                Ordenar por
              </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="auth-input"
                style={{ width: '100%', padding: '0.45rem' }}
              >
                <option value="date-desc">Mais recentes</option>
                <option value="date-asc">Mais antigos</option>
                <option value="hits-desc">Mais acertos</option>
                <option value="hits-asc">Menos acertos</option>
              </select>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                color: 'white',
                paddingTop: '1.35rem',
              }}
            >
              <input
                type="checkbox"
                checked={onlyWinners}
                onChange={(e) => setOnlyWinners(e.target.checked)}
                style={{ accentColor: 'var(--accent-color)' }}
              />
              Só premiados
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              flexWrap: 'wrap',
              marginBottom: '0.75rem',
            }}
          >
            <button
              className="theme-pill-btn"
              onClick={() => setLotteryFilter('all')}
              style={{
                fontSize: '0.65rem',
                padding: '0.35rem 0.55rem',
                borderColor:
                  lotteryFilter === 'all' ? 'var(--accent-color)' : undefined,
                color: lotteryFilter === 'all' ? 'white' : undefined,
              }}
            >
              Todas ({savedGames.length})
            </button>
            {Object.entries(LOTTERY_CONFIGS)
              .filter(([key]) => (lotteryCounts.get(key) || 0) > 0)
              .map(([key, value]) => (
                <button
                  key={key}
                  className="theme-pill-btn"
                  onClick={() => setLotteryFilter(key)}
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.35rem 0.55rem',
                    borderColor:
                      lotteryFilter === key
                        ? value.color
                        : 'var(--glass-border)',
                    color: lotteryFilter === key ? 'white' : value.color,
                    boxShadow:
                      lotteryFilter === key
                        ? `0 0 10px ${value.accentColor}`
                        : 'none',
                  }}
                >
                  {value.name} ({lotteryCounts.get(key) || 0})
                </button>
              ))}
          </div>

          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              margin: '0.25rem 0 0.5rem 0',
            }}
          >
            Selecione os jogos abaixo e clique em **Criar Bolão** para exportar
            e compartilhar no WhatsApp.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '0.75rem',
            }}
          >
            <button
              className="theme-pill-btn"
              onClick={() => {
                setSelectedForPool((current) => {
                  if (allVisibleSelected) {
                    return current.filter((id) => !visibleIds.includes(id));
                  }
                  return Array.from(new Set([...current, ...visibleIds]));
                });
                setBolaoText('');
              }}
              style={{ fontSize: '0.68rem', padding: '0.35rem 0.6rem' }}
            >
              {allVisibleSelected
                ? '☑️ Limpar seleção visível'
                : '✅ Selecionar visíveis'}
            </button>
            <button
              className="theme-pill-btn"
              onClick={() => {
                setSelectedForPool((current) => {
                  const winnerSet = new Set(visibleWinnerIds);
                  if (
                    visibleWinnerIds.length > 0 &&
                    visibleWinnerIds.every((id) => current.includes(id))
                  ) {
                    return current.filter((id) => !winnerSet.has(id));
                  }
                  return Array.from(new Set([...current, ...visibleWinnerIds]));
                });
                setBolaoText('');
              }}
              disabled={visibleWinnerIds.length === 0}
              style={{
                fontSize: '0.68rem',
                padding: '0.35rem 0.6rem',
                opacity: visibleWinnerIds.length === 0 ? 0.5 : 1,
              }}
            >
              {someVisibleWinnersSelected
                ? '🏆 Limpar premiados'
                : '🏆 Selecionar premiados'}
            </button>
            <button
              className="theme-pill-btn"
              onClick={() => {
                setSelectedForPool([]);
                setBolaoText('');
              }}
              disabled={!someVisibleSelected && selectedForPool.length === 0}
              style={{
                fontSize: '0.68rem',
                padding: '0.35rem 0.6rem',
                opacity:
                  !someVisibleSelected && selectedForPool.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              🧹 Limpar seleção
            </button>
            <button
              className="theme-pill-btn"
              onClick={() => downloadTXT(selectedGameLists, 'selecionados')}
              disabled={selectedGameLists.length === 0}
              style={{
                fontSize: '0.68rem',
                padding: '0.35rem 0.6rem',
                opacity: selectedGameLists.length === 0 ? 0.5 : 1,
              }}
            >
              📥 TXT seleção
            </button>
            <button
              className="theme-pill-btn"
              onClick={() =>
                downloadPDF(selectedGameLists, 'Jogos Selecionados')
              }
              disabled={selectedGameLists.length === 0}
              style={{
                fontSize: '0.68rem',
                padding: '0.35rem 0.6rem',
                opacity: selectedGameLists.length === 0 ? 0.5 : 1,
              }}
            >
              📄 PDF seleção
            </button>
          </div>

          {visibleGames.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              {groupedVisibleGames.map((group) => (
                <div key={group.key}>
                  {groupMode !== 'none' && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        marginBottom: '0.45rem',
                        paddingBottom: '0.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: 'var(--accent-color)',
                        }}
                      >
                        {group.label}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.35rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.62rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        >
                          {group.items.length} jogos
                        </span>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '999px',
                            background:
                              group.winnerCount > 0
                                ? 'rgba(0,230,118,0.14)'
                                : 'rgba(255,255,255,0.06)',
                            color:
                              group.winnerCount > 0
                                ? '#00e676'
                                : 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          {group.winnerCount} premiados
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="saved-games-list">
                    {group.items.map(
                      ({ game, nums, hits, isWinner, latestResult }) => {
                        const configGame = LOTTERY_CONFIGS[game.lottery];

                        return (
                          <div
                            key={game.id}
                            className="saved-game-card"
                            style={{ paddingLeft: '2.5rem' }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedForPool.includes(game.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForPool((current) => [
                                    ...current,
                                    game.id,
                                  ]);
                                } else {
                                  setSelectedForPool((current) =>
                                    current.filter((id) => id !== game.id)
                                  );
                                }
                                setBolaoText('');
                              }}
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '18px',
                                height: '18px',
                                accentColor: 'var(--accent-color)',
                                cursor: 'pointer',
                              }}
                            />

                            <div className="saved-game-header">
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color:
                                    configGame?.accentColor ||
                                    'var(--accent-color)',
                                }}
                              >
                                ★{' '}
                                {configGame?.name || game.lottery.toUpperCase()}
                              </span>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '0.4rem',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.6rem',
                                    color:
                                      hits === null
                                        ? 'var(--text-muted)'
                                        : isWinner
                                          ? '#00e676'
                                          : '#fff',
                                    background:
                                      hits === null
                                        ? 'rgba(255,255,255,0.04)'
                                        : isWinner
                                          ? 'rgba(0,230,118,0.12)'
                                          : 'rgba(255,255,255,0.06)',
                                    padding: '0.15rem 0.35rem',
                                    borderRadius: '999px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {hits === null
                                    ? 'Sem leitura'
                                    : `${hits} acerto${hits !== 1 ? 's' : ''}`}
                                </span>
                                <button
                                  className="delete-game-btn"
                                  onClick={() => handleDeleteGame(game.id)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>

                            <div
                              className="balls-container"
                              style={{
                                margin: '0.25rem 0',
                                justifyContent: 'flex-start',
                              }}
                            >
                              {nums.map((n, idx) => (
                                <span
                                  key={idx}
                                  className="ball"
                                  style={
                                    {
                                      '--ball-color':
                                        configGame?.color || '#209869',
                                      width: '26px',
                                      height: '26px',
                                      fontSize: '0.75rem',
                                      borderColor:
                                        configGame?.color || '#209869',
                                    } as CSSProperties
                                  }
                                >
                                  {n}
                                </span>
                              ))}
                            </div>

                            {latestResult ? (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.35rem',
                                  padding: '0.5rem',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.04)',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    Último Concurso{' '}
                                    <strong>{latestResult.numero}</strong>:
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      color: isWinner ? '#00e676' : 'white',
                                      textShadow: isWinner
                                        ? '0 0 5px rgba(0, 230, 118, 0.4)'
                                        : 'none',
                                    }}
                                  >
                                    🎯 {hits} Acerto{hits !== 1 ? 's' : ''}{' '}
                                    {isWinner ? '🏆 (Premiado)' : ''}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.2rem',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {getCleanDezenas(latestResult).map(
                                    (dNum, dIdx) => {
                                      const isMatched = nums
                                        .map(Number)
                                        .includes(parseInt(dNum, 10));
                                      return (
                                        <span
                                          key={dIdx}
                                          style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: isMatched
                                              ? configGame?.color || '#209869'
                                              : 'rgba(255,255,255,0.03)',
                                            color: isMatched
                                              ? '#fff'
                                              : 'var(--text-muted)',
                                            fontSize: '0.55rem',
                                            fontWeight: isMatched
                                              ? 'bold'
                                              : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: isMatched
                                              ? `1px solid ${configGame?.accentColor || '#00e676'}`
                                              : '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: isMatched
                                              ? `0 0 5px ${configGame?.accentColor || '#00e676'}`
                                              : 'none',
                                          }}
                                        >
                                          {dNum}
                                        </span>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: '0.65rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.25rem',
                                }}
                              >
                                Carregando comparação Caixa...
                              </div>
                            )}

                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginTop: '0.35rem',
                              }}
                            >
                              Salvo em:{' '}
                              {new Date(game.created_at).toLocaleDateString(
                                'pt-BR'
                              )}{' '}
                              às{' '}
                              {new Date(game.created_at).toLocaleTimeString(
                                'pt-BR'
                              )}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '1rem',
              }}
            >
              Nenhum jogo corresponde aos filtros atuais. Ajuste a loteria, a
              busca por número ou a ordenação.
            </p>
          )}

          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              margin: '0.75rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                👥 DIVISÃO DE COTAS E TAXAS (BOLÃO PRO)
              </span>
              {!isPro && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: '#ffd600',
                    fontWeight: 'bold',
                    background: 'rgba(255,214,0,0.1)',
                    padding: '0.1rem 0.3rem',
                    borderRadius: '4px',
                  }}
                >
                  PRO ONLY 👑
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Participantes (Cotas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={bolaoCotas}
                  onChange={(e) => {
                    if (isPro) {
                      setBolaoCotas(e.target.value);
                    } else {
                      setShowUpgradeModal(true);
                    }
                  }}
                  className="auth-input"
                  style={{ width: '100%', padding: '0.4rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Taxa Organizador (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bolaoTaxa}
                  onChange={(e) => {
                    if (isPro) {
                      setBolaoTaxa(e.target.value);
                    } else {
                      setShowUpgradeModal(true);
                    }
                  }}
                  className="auth-input"
                  style={{ width: '100%', padding: '0.4rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              className="btn-action"
              disabled={selectedForPool.length === 0}
              onClick={handleBuildBolao}
              style={{
                background: 'linear-gradient(90deg, #ffd600, #ff9100)',
                color: 'black',
                boxShadow: '0 4px 15px rgba(255, 214, 0, 0.2)',
                opacity: selectedForPool.length === 0 ? 0.5 : 1,
                cursor:
                  selectedForPool.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              🍀 GERAR TEXTO DO BOLÃO ({selectedForPool.length})
            </button>

            {bolaoText && (
              <div className="bolao-builder-box">
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  Visualização do Bolão:
                </span>
                <textarea
                  className="bolao-textarea"
                  readOnly
                  value={bolaoText}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCopyText(bolaoText, 'bolao')}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {copyFeedback === 'bolao'
                      ? '✓ Copiado!'
                      : '📋 Copiar Texto'}
                  </button>
                  <a
                    href={bolaoShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: '#25D366',
                      color: '#000',
                      borderRadius: '8px',
                      padding: '0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 'black',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Enviar WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}
        >
          Você ainda não salvou nenhum jogo. Gere cartões e salve-os para
          visualizar aqui!
        </p>
      )}
    </div>
  );
}
