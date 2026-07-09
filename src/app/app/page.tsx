'use client';

import React from 'react';
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/fetch';
import { LOTTERY_CONFIGS, type GameMetrics } from '../../lib/lottery-math';
import { useSound } from '../hooks/useSound';
import {
  getCleanDezenas as getCleanDezenasHelper,
  toggleFilterStatus,
} from '@/lib/lottery-helpers';
import {
  downloadTXT as downloadTXTFn,
  downloadPDF as downloadPDFFn,
  printGames as printGamesFn,
  buildBolaoText,
} from '@/lib/lottery-exports';

let _mathMod: typeof import('../../lib/lottery-math') | null = null;
async function loadMath() {
  if (!_mathMod) _mathMod = await import('../../lib/lottery-math');
  return _mathMod;
}

function comb(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
function inlineWheelCount(
  n: number,
  k: number,
  g: 'full' | 'quadra' | 'quina'
): number {
  if (n < k) return 0;
  if (g === 'full') return comb(n, k);
  const t = g === 'quina' ? k - 1 : k - 2;
  return Math.ceil(comb(n, t) / comb(k, t));
}

// Lazy-loaded components — only downloaded when tab/modal is opened
const TutorialModal = lazy(() => import('../components/TutorialModal'));
const AdminPanel = lazy(() => import('../components/AdminPanel'));
const ResultsTab = lazy(() => import('../components/ResultsTab'));
const StatsTab = lazy(() => import('../components/StatsTab'));
const FinanceTab = lazy(() => import('../components/FinanceTab'));
const LandingPage = lazy(() => import('../components/LandingPage'));
const RankingPanel = lazy(() => import('../components/RankingPanel'));
const BolaoPanel = lazy(() => import('../components/BolaoPanel'));
const MysticGenerator = lazy(() => import('../components/MysticGenerator'));
const ExportImportModal = lazy(() => import('../components/ExportImportModal'));
const CameraScanner = lazy(() => import('../components/CameraScanner'));
const QuickSimulator = lazy(() => import('../components/QuickSimulator'));
const SavedGamesPanel = lazy(() => import('../components/SavedGamesPanel'));
const SettingsPanel = lazy(() => import('../components/SettingsPanel'));
const PaymentSection = lazy(() => import('../components/PaymentSection'));
import VolanteGrid from '../components/VolanteGrid';
import JsonLd from '../components/JsonLd';

// Lightweight fallback for lazy-loaded tabs
function TabFallback() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
      }}
    >
      <span className="loader" />
    </div>
  );
}

import type { LotteryResult, User, SavedGame, ThemeType } from '../types';

type ActiveTab =
  | 'results'
  | 'generator'
  | 'games'
  | 'simulator'
  | 'stats'
  | 'profile'
  | 'admin'
  | 'finance'
  | 'ranking';
type GeneratorTab = 'smart' | 'wheeling' | 'mystic' | 'bolao';

export default function Home() {
  const [activeLottery, setActiveLottery] = useState<string>('megasena');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('app');
  const [landingQuickNums, setLandingQuickNums] = useState<number[]>([]);
  const [landingQuickResult, setLandingQuickResult] = useState<string>('');

  // Real-time analysis for landing quick test board
  const landingQuickStats = useMemo(() => {
    if (landingQuickNums.length === 0) {
      return { sum: 0, even: 0, odd: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
    }
    const sum = landingQuickNums.reduce((a, b) => a + b, 0);
    const even = landingQuickNums.filter((n) => n % 2 === 0).length;
    const odd = landingQuickNums.length - even;

    // Calculate quadrantes
    let q1 = 0,
      q2 = 0,
      q3 = 0,
      q4 = 0;
    if (activeLottery === 'megasena') {
      landingQuickNums.forEach((n) => {
        const row = Math.floor((n - 1) / 10);
        const col = (n - 1) % 10;
        if (row < 3 && col < 5) q1++;
        else if (row < 3 && col >= 5) q2++;
        else if (row >= 3 && col < 5) q3++;
        else q4++;
      });
    } else if (activeLottery === 'lotofacil') {
      landingQuickNums.forEach((n) => {
        if (n <= 13) {
          if (n % 5 <= 2 && n % 5 > 0) q1++;
          else q2++;
        } else {
          if (n % 5 <= 2 && n % 5 > 0) q3++;
          else q4++;
        }
      });
    }
    return { sum, even, odd, q1, q2, q3, q4 };
  }, [landingQuickNums, activeLottery]);

  const [result, setResult] = useState<LotteryResult | null>(null);
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [customConcurso, setCustomConcurso] = useState<string>('');
  const [latestResultsMap, setLatestResultsMap] = useState<
    Record<string, LotteryResult>
  >({});

  // Tab navigation: 'results' | 'generator' | 'simulator' | 'stats' | 'profile'
  // Restore from sessionStorage in initializer to avoid useEffect setState
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window === 'undefined') return 'results';
    const validTabs: ActiveTab[] = [
      'results',
      'generator',
      'games',
      'simulator',
      'stats',
      'profile',
      'admin',
      'finance',
      'ranking',
    ];
    const stored = sessionStorage.getItem('meu-trevo-activetab');
    return stored && validTabs.includes(stored as ActiveTab)
      ? (stored as ActiveTab)
      : 'results';
  });
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Sub-tab for generator: 'smart' | 'wheeling' | 'mystic' | 'bolao'
  const [genSubTab, setGenSubTab] = useState<GeneratorTab>(() => {
    if (typeof window === 'undefined') return 'smart';
    const validGenTabs: GeneratorTab[] = [
      'smart',
      'wheeling',
      'mystic',
      'bolao',
    ];
    const stored = sessionStorage.getItem('meu-trevo-gensubtab');
    return stored && validGenTabs.includes(stored as GeneratorTab)
      ? (stored as GeneratorTab)
      : 'smart';
  });

  // Persist tab state across hot reloads
  useEffect(() => {
    sessionStorage.setItem('meu-trevo-activetab', activeTab);
  }, [activeTab]);
  useEffect(() => {
    sessionStorage.setItem('meu-trevo-gensubtab', genSubTab);
  }, [genSubTab]);

  // Wheeling state
  const [wheelSelectedNums, setWheelSelectedNums] = useState<number[]>([]);
  const [wheelGuarantee, setWheelGuarantee] = useState<
    'quadra' | 'quina' | 'full'
  >('quadra');
  const [wheelGeneratedGames, setWheelGeneratedGames] = useState<number[][]>(
    []
  );

  // Accordion Toggles
  const [showRateio, setShowRateio] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // --- PREMIUM FREEMIUM MODAL ---
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [priceMonthly, setPriceMonthly] = useState<number>(14.9);
  const [priceAnnualEquivalent, setPriceAnnualEquivalent] =
    useState<number>(129.9);

  // --- PREMIUM FASE 3: THEME & SETTINGS ---
  const [theme, setTheme] = useState<ThemeType>('meganeon');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [historyLimit, setHistoryLimit] = useState<number>(30);
  const [enableSounds, setEnableSounds] = useState<boolean>(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Toggle number in the quick test board
  const handleToggleLandingNum = (num: number) => {
    playSound('click');
    const maxSel = activeLottery === 'lotofacil' ? 15 : 6;
    if (landingQuickNums.includes(num)) {
      setLandingQuickNums((prev) => prev.filter((x) => x !== num));
      setLandingQuickResult('');
    } else {
      if (landingQuickNums.length >= maxSel) {
        return;
      }
      setLandingQuickNums((prev) => [...prev, num]);
      setLandingQuickResult('');
    }
  };

  // Run the quick test against latest result
  const handleTestLandingGame = () => {
    playSound('click');
    if (!result) return;
    const cleanDrawn = getCleanDezenas(result).map((x) => parseInt(x, 10));
    const hits = landingQuickNums.filter((n) => cleanDrawn.includes(n));

    let message = '';
    if (landingQuickNums.length === 0) {
      message = 'Selecione dezenas no volante acima para testar!';
    } else {
      message = `Você marcou ${landingQuickNums.length} números e acertou ${hits.length} no Concurso ${result.numero} (${
        hits.length > 0
          ? hits
              .sort((a, b) => a - b)
              .map((x) => String(x).padStart(2, '0'))
              .join(', ')
          : 'Nenhum'
      }). Quer testar contra todo o histórico de sorteios da Caixa? Inicie no app!`;
    }
    setLandingQuickResult(message);
  };

  // Generate a quick smart game on the landing page using actual logic
  const handleGenerateLandingSmart = async () => {
    playSound('click');
    const math = await loadMath();
    const game = math.generateSmartGame(
      config,
      [],
      [],
      'balanced',
      [],
      [],
      [],
      {}
    );
    setLandingQuickNums(game.numbers);
    setLandingQuickResult(
      'Números gerados pela nossa IA! Clique em "Testar Jogo" para conferir contra o último concurso.'
    );
  };

  const handleGenerateSmart = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    playSound('click');
    const math = await loadMath();
    const fixed = Object.entries(filtersMap)
      .filter(([, v]) => v === 'fixed')
      .map(([k]) => Number(k));
    const excluded = Object.entries(filtersMap)
      .filter(([, v]) => v === 'excluded')
      .map(([k]) => Number(k));
    const hotNums = (statsData?.hotNumbers || []).map((h) => h.num);
    const coldNums = (statsData?.coldNumbers || []).map((c) => c.num);
    const lastDraw = (
      result?.listaDezenas ||
      result?.dezenasSorteadasOrdemSorteio ||
      []
    ).map(Number);
    const delayData =
      (statsData as { delays?: Record<number, number> })?.delays || {};
    const advFilters = {
      avoidConsecutive: avoidConsecutive || undefined,
      customSumMin: customSumMin ? parseInt(customSumMin) : undefined,
      customSumMax: customSumMax ? parseInt(customSumMax) : undefined,
      maxRepeats: maxRepeats ? parseInt(maxRepeats) : undefined,
    };
    const games: { numbers: number[]; metrics: GameMetrics }[] = [];
    for (let i = 0; i < gameQuantity; i++) {
      const game = math.generateSmartGame(
        config,
        hotNums,
        coldNums,
        intensity,
        lastDraw,
        fixed,
        excluded,
        delayData,
        advFilters
      );
      games.push({ numbers: game.numbers, metrics: game.metrics });
    }
    setGeneratedGames(games);
  };

  const handleGenerateWheel = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    playSound('click');
    if (wheelSelectedNums.length < config.drawCount) return;
    const math = await loadMath();
    const games = math.generateWheelingGames(
      config,
      wheelSelectedNums,
      wheelGuarantee
    );
    setWheelGeneratedGames(games);
  };

  const handleSaveGeneratedGame = async (numbers: number[]) => {
    if (!user) {
      redirectToLogin();
      return;
    }
    const numsStr = numbers
      .sort((a, b) => a - b)
      .map((n) => String(n).padStart(2, '0'))
      .join(', ');
    try {
      const payload = {
        lottery: activeLottery,
        numbers: numsStr,
      };
      const res = await fetchWithCsrf('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSound('success');
        setSavedGames((current) => [
          {
            id: data.gameId,
            ...payload,
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Programmatic Synthesizer Audio Context
  const playSound = useSound(enableSounds);

  // --- AUTH / USER STATES ---
  const [user, setUser] = useState<User | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<boolean>(false);
  const [showInRanking, setShowInRanking] = useState<boolean>(true);

  const redirectToLogin = () => {
    if (typeof window === 'undefined') return;
    window.location.assign('/login?next=/app');
  };

  // --- GERADOR INTELIGENTE STATES ---
  const [intensity, setIntensity] = useState<
    'balanced' | 'aggressive' | 'surpresa' | 'delayed'
  >('balanced');
  const [gameQuantity, setGameQuantity] = useState<number>(1);

  // Advanced filters map: number -> 'fixed' | 'excluded' | 'none'
  const [filtersMap, setFiltersMap] = useState<
    Record<number, 'fixed' | 'excluded' | 'none'>
  >({});

  // Generated games from smart generator (with metrics for display)
  const [generatedGames, setGeneratedGames] = useState<
    { numbers: number[]; metrics: GameMetrics }[]
  >([]);

  // --- BOLÃO STATES ---
  const [selectedForPool, setSelectedForPool] = useState<string[]>([]);
  const [bolaoText, setBolaoText] = useState<string>('');
  const [bolaoShareUrl, setBolaoShareUrl] = useState<string>('');
  const [bolaoCotas, setBolaoCotas] = useState<string>('5');
  const [bolaoTaxa, setBolaoTaxa] = useState<string>('0');

  const [copyFeedback, setCopyFeedback] = useState<string>(''); // Holds feedback text

  // --- ADVANCED FILTERS STATES ---
  const [avoidConsecutive, setAvoidConsecutive] = useState<boolean>(false);
  const [customSumMin, setCustomSumMin] = useState<string>('');
  const [customSumMax, setCustomSumMax] = useState<string>('');
  const [maxRepeats, setMaxRepeats] = useState<string>('');

  // --- ONBOARDING TUTORIAL STATES ---
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  // New features: export/import, camera, push notifications
  const [showExportImport, setShowExportImport] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);

  const config = LOTTERY_CONFIGS[activeLottery];
  const isPro = user?.role === 'pro' || user?.role === 'admin';

  // Fetch saved games from DB
  const fetchSavedGames = async () => {
    try {
      const res = await fetchWithCsrf('/api/games');
      if (res.ok) {
        const data = await res.json();
        setSavedGames(data.games || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch logged in user status
  const checkAuthStatus = async () => {
    try {
      const res = await fetchWithCsrf('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowInRanking(data.user?.show_in_ranking !== false);
        fetchSavedGames();
        return data.user;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const provider = params.get('provider');

    if (provider !== 'stripe' || !upgrade) return;

    const clearStripeParams = () => {
      const nextUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    };

    if (upgrade === 'cancel') {
      const frame = window.requestAnimationFrame(() => {
        setShowUpgradeModal(true);
        clearStripeParams();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (upgrade !== 'success') return;

    const initFrame = window.requestAnimationFrame(() => {
      setShowUpgradeModal(true);
    });

    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      const refreshedUser = await checkAuthStatus();
      if (refreshedUser?.role === 'pro' || attempts >= 10) {
        window.clearInterval(interval);
        clearStripeParams();
        setShowUpgradeModal(false);
      }
    }, 2000);

    return () => {
      window.cancelAnimationFrame(initFrame);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchResult = async (lotteryId: string, contestNum?: string) => {
    setLoading(true);
    try {
      if (contestNum) {
        // Fetch specific past contest
        const res = await fetchWithCsrf(
          `/api/loteria/${lotteryId}?concurso=${contestNum}`
        );
        if (res.ok) {
          const data = await res.json();
          setResult(data);
          setHistory([data]);
          setLatestResultsMap((prev) => ({ ...prev, [lotteryId]: data }));
        }
      } else {
        // Fetch latest + full history with dynamic limit
        const res = await fetchWithCsrf(
          `/api/loteria/${lotteryId}?limit=${historyLimit}`
        );
        if (res.ok) {
          const data = await res.json();
          setResult(data.latest);
          setHistory(data.history || [data.latest]);
          setLatestResultsMap((prev) => ({
            ...prev,
            [lotteryId]: data.latest,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        // Parallelize independent requests: auth + config + active lottery
        const [authResult, configResult, lotteryResult] =
          await Promise.allSettled([
            fetchWithCsrf('/api/auth/me'),
            fetchWithCsrf('/api/config'),
            fetchWithCsrf(
              `/api/loteria/${activeLottery}?limit=${historyLimit}`
            ),
          ]);

        // Auth
        if (authResult.status === 'fulfilled' && authResult.value?.ok) {
          const data = await authResult.value.json();
          setUser(data.user);
          setShowInRanking(data.user?.show_in_ranking !== false);
          fetchSavedGames();
        }

        // Config
        if (configResult.status === 'fulfilled' && configResult.value.ok) {
          const d = await configResult.value.json();
          if (d.success && d.config) {
            setPriceMonthly(parseFloat(d.config.price_monthly) || 14.9);
            setPriceAnnualEquivalent(
              parseFloat(d.config.price_annual) || 129.9
            );
          }
        }

        // Active lottery results
        if (lotteryResult.status === 'fulfilled' && lotteryResult.value.ok) {
          const data = await lotteryResult.value.json();
          setResult(data.latest);
          setHistory(data.history || [data.latest]);
          setLatestResultsMap((prev) => ({
            ...prev,
            [activeLottery]: data.latest,
          }));
        }
        setLoading(false);
      })();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-load other lotteries only when games tab needs them
  useEffect(() => {
    if (activeTab !== 'games' || !savedGames.length) return;
    const needed = new Set(savedGames.map((g) => g.lottery));
    const missing = [...needed].filter(
      (id) => id !== activeLottery && !latestResultsMap[id]
    );
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const lotteryId of missing) {
        try {
          const res = await fetchWithCsrf(`/api/loteria/${lotteryId}`);
          if (!cancelled && res.ok) {
            const data = await res.json();
            if (data.latest) {
              setLatestResultsMap((prev) => ({
                ...prev,
                [lotteryId]: data.latest,
              }));
            }
          }
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, savedGames, activeLottery, latestResultsMap]);

  // Click outside to close settings/profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-toggle-btn')) {
          setShowSettings(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    if (viewMode !== 'app') {
      return;
    }
    const onboardingDone = localStorage.getItem('meu-trevo-onboarding-done');
    if (!onboardingDone) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
        setTutorialStep(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  useEffect(() => {
    const abort = { cancelled: false };
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetchWithCsrf(
            `/api/loteria/${activeLottery}?limit=${historyLimit}`
          );
          if (!abort.cancelled && res.ok) {
            const data = await res.json();
            setResult(data.latest);
            setHistory(data.history || [data.latest]);
            setLatestResultsMap((prev) => ({
              ...prev,
              [activeLottery]: data.latest,
            }));
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (!abort.cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      abort.cancelled = true;
      clearTimeout(timer);
    };
  }, [activeLottery, historyLimit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset all selection states on lottery change
      setFiltersMap({});
      setShowFilters(false);
      setShowRateio(false);
      setSelectedForPool([]);
      setBolaoText('');
      setBolaoShareUrl('');
    }, 0);
    return () => clearTimeout(timer);
  }, [activeLottery]);

  const partnerNumbers = (() => {
    const fixed = Object.entries(filtersMap)
      .filter(([, status]) => status === 'fixed')
      .map(([num]) => parseInt(num, 10));

    if (fixed.length > 0 && history.length > 0) {
      const target = fixed[0];
      const counts: Record<number, number> = {};
      history.forEach((draw) => {
        const nums = (
          draw.listaDezenas ||
          draw.dezenasSorteadasOrdemSorteio ||
          []
        ).map(Number);
        if (nums.includes(target)) {
          nums.forEach((n) => {
            if (n !== target && !isNaN(n)) counts[n] = (counts[n] || 0) + 1;
          });
        }
      });
      const partners = Object.entries(counts)
        .map(([n, c]) => ({ num: Number(n), freq: c }))
        .sort((a, b) => b.freq - a.freq);
      const availablePartners = partners.filter((p) => !fixed.includes(p.num));
      return availablePartners.slice(0, 8);
    }
    return [];
  })();

  // --- STATS TAB CALCULATIONS ---
  const statsData = (() => {
    if (!history || history.length === 0) {
      return {
        frequencyMap: {} as Record<number, number>,
        hotNumbers: [] as { num: number; count: number }[],
        coldNumbers: [] as { num: number; delay: number }[],
        avgSum: 0,
        evenPct: 50,
      };
    }

    const counts: Record<number, number> = {};
    const delays: Record<number, number> = {};
    const totalNumbers =
      activeLottery === 'lotofacil'
        ? 25
        : activeLottery === 'megasena'
          ? 60
          : activeLottery === 'quina'
            ? 80
            : 100;

    // Initialize delays
    for (let i = 1; i <= totalNumbers; i++) {
      delays[i] = history.length;
    }

    let totalSum = 0;
    let totalEven = 0;
    let totalDrawnNumbersCount = 0;

    history.forEach((draw, index) => {
      const dezenas =
        draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || [];
      const numDezenas = dezenas.map(Number);

      numDezenas.forEach((num) => {
        if (num > 0 && num <= totalNumbers) {
          counts[num] = (counts[num] || 0) + 1;
          totalSum += num;
          totalDrawnNumbersCount++;
          if (num % 2 === 0) totalEven++;

          // First occurrence in history (latest) gives latest delay
          if (delays[num] === history.length) {
            delays[num] = index;
          }
        }
      });
    });

    const frequencyMap = counts;

    // Hot numbers: sorted by count descending
    const hotNumbers = Object.keys(counts)
      .map(Number)
      .map((num) => ({ num, count: counts[num] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Cold/Delayed numbers: sorted by delay descending
    const coldNumbers = Object.keys(delays)
      .map(Number)
      .map((num) => ({ num, delay: delays[num] }))
      .sort((a, b) => b.delay - a.delay)
      .slice(0, 5);

    const avgSum =
      totalDrawnNumbersCount > 0 ? Math.round(totalSum / history.length) : 0;
    const evenPct =
      totalDrawnNumbersCount > 0
        ? Math.round((totalEven / totalDrawnNumbersCount) * 100)
        : 50;

    // Pares que mais aparecem juntos
    const pairCount: Record<string, number> = {};
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers)
        .sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          pairCount[key] = (pairCount[key] || 0) + 1;
        }
      }
    });
    const topPairs = Object.entries(pairCount)
      .map(([key, count]) => ({ pair: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Distribuição por faixa
    const third = Math.ceil(totalNumbers / 3);
    const ranges = { low: 0, mid: 0, high: 0 };
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers);
      nums.forEach((n) => {
        if (n <= third) ranges.low++;
        else if (n <= third * 2) ranges.mid++;
        else ranges.high++;
      });
    });
    const totalRange = ranges.low + ranges.mid + ranges.high || 1;
    const rangeDistribution = {
      low: Math.round((ranges.low / totalRange) * 100),
      mid: Math.round((ranges.mid / totalRange) * 100),
      high: Math.round((ranges.high / totalRange) * 100),
    };

    // Análise de consecutivos
    let consecCount = 0;
    let consecTotal = 0;
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers)
        .sort((a, b) => a - b);
      consecTotal++;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i - 1] + 1) {
          consecCount++;
          break;
        }
      }
    });
    const consecPct =
      consecTotal > 0 ? Math.round((consecCount / consecTotal) * 100) : 0;

    // Frequência por posição (coluna 1ª, 2ª, 3ª...)
    const positionFreq: Record<number, Record<number, number>> = {};
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers);
      nums.forEach((n, i) => {
        if (!positionFreq[i]) positionFreq[i] = {};
        positionFreq[i][n] = (positionFreq[i][n] || 0) + 1;
      });
    });
    const topByPosition = Object.entries(positionFreq).map(([pos, counts]) => {
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([n, c]) => ({ num: Number(n), count: c }));
      return { position: Number(pos) + 1, top };
    });

    // Trincas e Quadras que mais aparecem juntos
    const triadCount: Record<string, number> = {};
    const quadCount: Record<string, number> = {};
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers)
        .sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            const key = `${nums[i]}-${nums[j]}-${nums[k]}`;
            triadCount[key] = (triadCount[key] || 0) + 1;
          }
        }
      }
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            for (let l = k + 1; l < nums.length; l++) {
              const key = `${nums[i]}-${nums[j]}-${nums[k]}-${nums[l]}`;
              quadCount[key] = (quadCount[key] || 0) + 1;
            }
          }
        }
      }
    });
    const topTriads = Object.entries(triadCount)
      .map(([key, count]) => ({ nums: key.split('-').map(Number), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const topQuads = Object.entries(quadCount)
      .map(([key, count]) => ({ nums: key.split('-').map(Number), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Análise mensal
    const monthStats: Record<
      string,
      { draws: number; sum: number; even: number }
    > = {};
    history.forEach((draw) => {
      const d = new Date(draw.dataApuracao || '');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthStats[key]) monthStats[key] = { draws: 0, sum: 0, even: 0 };
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers);
      monthStats[key].draws++;
      monthStats[key].sum += nums.reduce((a, b) => a + b, 0);
      monthStats[key].even += nums.filter((n) => n % 2 === 0).length;
    });
    const monthlyAnalysis = Object.entries(monthStats)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([key, data]) => ({
        month: key,
        draws: data.draws,
        avgSum: Math.round(data.sum / data.draws),
        evenPct: Math.round(
          (data.even / (data.draws * (config?.drawCount || 6))) * 100
        ),
      }));

    // Top sequências consecutivas (pares, trincas que saíram juntos como sequência)
    const seqCount: Record<number, number> = {};
    history.forEach((draw) => {
      const nums = (draw.listaDezenas || [])
        .map(Number)
        .filter((n) => n > 0 && n <= totalNumbers)
        .sort((a, b) => a - b);
      let maxSeq = 1;
      let curSeq = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] === nums[i - 1] + 1) {
          curSeq++;
          maxSeq = Math.max(maxSeq, curSeq);
        } else curSeq = 1;
      }
      seqCount[maxSeq] = (seqCount[maxSeq] || 0) + 1;
    });
    const sequenceDistribution = Object.entries(seqCount)
      .map(([len, count]) => ({ length: Number(len), count }))
      .sort((a, b) => a.length - b.length);

    return {
      frequencyMap,
      hotNumbers,
      coldNumbers,
      avgSum,
      evenPct,
      delays,
      topPairs,
      rangeDistribution,
      consecPct,
      topByPosition,
      topTriads,
      topQuads,
      monthlyAnalysis,
      sequenceDistribution,
    };
  })();

  // Helper to copy games text to clipboard
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  // Handle deleting game from DB
  const handleDeleteGame = async (gameId: string) => {
    try {
      const res = await fetchWithCsrf(`/api/games?id=${gameId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSound('delete');
        fetchSavedGames();
        setSelectedForPool(selectedForPool.filter((id) => id !== gameId));
        setBolaoText('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadTXT = (gamesList: number[][], nameSuffix = 'jogos') =>
    downloadTXTFn(gamesList, activeLottery, playSound, nameSuffix);

  const downloadPDF = (gamesList: number[][], title = 'Jogos Gerados') =>
    downloadPDFFn(gamesList, activeLottery, playSound, title);

  const handlePrintGames = (gamesList: number[][]) =>
    printGamesFn(gamesList, activeLottery, playSound);

  // Build Bolão/Pool sharing text and WhatsApp URL
  const handleBuildBolao = () => {
    if (selectedForPool.length === 0) return;
    const selectedList = savedGames.filter((g) =>
      selectedForPool.includes(g.id)
    );
    const { text, shareUrl } = buildBolaoText(
      selectedList,
      bolaoCotas,
      bolaoTaxa,
      isPro
    );
    setBolaoText(text);
    setBolaoShareUrl(shareUrl);
  };

  const getCleanDezenas = useCallback(
    (lotResult: LotteryResult) =>
      getCleanDezenasHelper(lotResult, activeLottery),
    [activeLottery]
  );

  // Cycle advanced filter status for a number
  const toggleFilterNumber = (num: number) => {
    playSound('click');
    const nextStatus = toggleFilterStatus(num, filtersMap, config.drawCount);
    setFiltersMap((prev) => ({
      ...prev,
      [num]: nextStatus,
    }));
  };

  // Helper to render volante board (delegated to VolanteGrid component)
  // Uses <VolanteGrid> directly in JSX instead of this function

  return (
    <main
      className={`app-container theme-${theme}`}
      style={
        {
          '--active-color': config?.color || '#209869',
          '--active-glow': config?.accentColor || 'rgba(32, 152, 105, 0.4)',
        } as React.CSSProperties
      }
    >
      {/* JSON-LD Structured Data */}
      <JsonLd />

      {viewMode === 'landing' ? (
        <Suspense fallback={<TabFallback />}>
          <LandingPage
            result={result}
            history={history}
            isAnnual={isAnnual}
            setIsAnnual={setIsAnnual}
            priceMonthly={priceMonthly}
            priceAnnualEquivalent={priceAnnualEquivalent}
            activeFaqIndex={activeFaqIndex}
            setActiveFaqIndex={setActiveFaqIndex}
            setShowUpgradeModal={setShowUpgradeModal}
            landingQuickNums={landingQuickNums}
            setLandingQuickNums={setLandingQuickNums}
            landingQuickResult={landingQuickResult}
            setLandingQuickResult={setLandingQuickResult}
            landingQuickStats={landingQuickStats}
            activeLottery={activeLottery}
            setActiveLottery={setActiveLottery}
            config={config}
            playSound={playSound}
            setViewMode={setViewMode}
            getCleanDezenas={getCleanDezenas}
            handleToggleLandingNum={handleToggleLandingNum}
            handleGenerateLandingSmart={handleGenerateLandingSmart}
            handleTestLandingGame={handleTestLandingGame}
          />
        </Suspense>
      ) : (
        <>
          {/* Header */}
          <header
            className="app-header"
            style={{ position: 'relative', padding: '0.85rem 1rem' }}
          >
            <div className="logo-container">
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.8))',
                  }}
                >
                  <path
                    d="M12 12c0 3.5 1 6.5 2.5 8"
                    stroke="#00ff88"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <g
                    fill="#00ff88"
                    stroke="#00ff88"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fillOpacity="0.2"
                  >
                    <path d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z" />
                    <path
                      d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                      transform="rotate(90 12 12)"
                    />
                    <path
                      d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                      transform="rotate(180 12 12)"
                    />
                    <path
                      d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                      transform="rotate(270 12 12)"
                    />
                  </g>
                </svg>
                <div className="logo-text">Meu Trevo</div>
              </Link>
            </div>

            {/* Centered Desktop Top Navigation */}
            <div className="header-nav-desktop">
              <button
                className={`nav-item-desktop ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('results');
                }}
              >
                Resultados
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'generator' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('generator');
                }}
              >
                Gerador
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'games' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('games');
                }}
              >
                Meus Jogos
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'simulator' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('simulator');
                }}
              >
                Simulador
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('stats');
                }}
              >
                Estatísticas
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('finance');
                }}
              >
                Finanças
              </button>
              <button
                className={`nav-item-desktop ${activeTab === 'ranking' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveTab('ranking');
                }}
              >
                Ranking
              </button>

              {user?.role === 'admin' && (
                <button
                  className={`nav-item-desktop ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => {
                    playSound('click');
                    setActiveTab('admin');
                  }}
                >
                  Admin
                </button>
              )}
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {!user && (
                <button
                  onClick={() => {
                    playSound('click');
                    redirectToLogin();
                  }}
                  style={{
                    background: 'var(--accent-color)',
                    border: 'none',
                    color: '#000',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    boxShadow: '0 0 8px var(--accent-glow)',
                  }}
                >
                  Entrar
                </button>
              )}

              {/* Botão de Configurações */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="settings-toggle-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s ease',
                  transform: showSettings ? 'rotate(45deg)' : 'none',
                }}
                title="Configurações do App"
              >
                ⚙️
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <Suspense fallback={<TabFallback />}>
                <SettingsPanel
                  playSound={playSound}
                  showInRanking={showInRanking}
                  onSetShowInRanking={setShowInRanking}
                  emailAlerts={emailAlerts}
                  onSetEmailAlerts={setEmailAlerts}
                  enableSounds={enableSounds}
                  onSetEnableSounds={setEnableSounds}
                  theme={theme}
                  onSetTheme={setTheme}
                  historyLimit={historyLimit}
                  onSetHistoryLimit={setHistoryLimit}
                  onShowTutorial={() => setShowTutorial(true)}
                  onLogout={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  onDeleteAccount={async () => {
                    if (
                      !window.confirm('Tem certeza? Esta ação é irreversível.')
                    )
                      return;
                    const res = await fetchWithCsrf('/api/user/delete', {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      window.location.href = '/';
                    }
                  }}
                  onFactoryReset={async () => {
                    if (!window.confirm('Resetar todos os dados?')) return;
                    await fetchWithCsrf('/api/user/factory-reset', {
                      method: 'POST',
                    });
                    window.location.reload();
                  }}
                  user={user}
                  isPro={isPro}
                  onShowUpgrade={() => setShowUpgradeModal(true)}
                  setShowSettings={setShowSettings}
                  settingsRef={settingsRef}
                />
              </Suspense>
            )}
          </header>

          {/* Selector Slider */}
          <div className="lottery-slider">
            {Object.values(LOTTERY_CONFIGS).map((lot) => (
              <button
                key={lot.id}
                className={`lottery-pill ${activeLottery === lot.id ? 'active' : ''}`}
                onClick={() => setActiveLottery(lot.id)}
                style={
                  {
                    '--active-color': lot.color,
                    '--active-glow': lot.accentColor,
                  } as React.CSSProperties
                }
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: lot.accentColor,
                  }}
                />
                {lot.name}
              </button>
            ))}
          </div>

          {/* Welcome User Banner */}
          {user && (
            <div
              style={{
                maxWidth: '1200px',
                margin: '0.75rem auto 1.25rem auto',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                animation: 'fade-in 0.3s ease-out',
              }}
            >
              <span>{user.avatar || '👤'}</span>
              <span>
                Olá,{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {user.name}
                </strong>
                ! Bem-vindo ao seu painel.
              </span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="main-content" style={{ position: 'relative' }}>
            {/* Subtle loading bar when switching lotteries (only if we already have data) */}
            {loading && result && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${config?.accentColor || '#00f0ff'}, transparent)`,
                  animation: 'loading-bar 1.2s ease-in-out infinite',
                  zIndex: 10,
                }}
              />
            )}
            {!result ? (
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '300px',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <span
                  className="loader"
                  style={
                    {
                      '--accent-color': config?.accentColor,
                    } as React.CSSProperties
                  }
                />
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                  }}
                >
                  Carregando resultados...
                </p>
              </div>
            ) : (
              <>
                {/* TAB: RESULTADOS */}
                {activeTab === 'results' && result && (
                  <Suspense fallback={<TabFallback />}>
                    <ResultsTab
                      result={result}
                      config={config}
                      getCleanDezenas={getCleanDezenas}
                      activeLottery={activeLottery}
                      customConcurso={customConcurso}
                      setCustomConcurso={setCustomConcurso}
                      fetchResult={fetchResult}
                      showRateio={showRateio}
                      setShowRateio={setShowRateio}
                      history={history}
                    />
                  </Suspense>
                )}

                {/* TAB: ESTATÍSTICAS / HEATMAP */}
                {activeTab === 'stats' && (
                  <Suspense fallback={<TabFallback />}>
                    <StatsTab
                      history={history}
                      activeLottery={activeLottery}
                      statsData={statsData}
                      isPro={isPro}
                      playSound={playSound}
                      setShowUpgradeModal={setShowUpgradeModal}
                    />
                  </Suspense>
                )}

                {/* TAB: SIMULADOR RÁPIDO */}
                {activeTab === 'simulator' && (
                  <Suspense fallback={<TabFallback />}>
                    <QuickSimulator
                      initialResult={result}
                      initialLottery={activeLottery}
                      history={history}
                      isAuthenticated={Boolean(user)}
                      isPro={isPro}
                      onUpgrade={() => setShowUpgradeModal(true)}
                    />
                  </Suspense>
                )}

                {/* TAB: GERADOR INTELIGENTE / DESDOBRAMENTOS */}
                {activeTab === 'generator' && !user && (
                  <div
                    className="glass-panel"
                    style={{
                      animation: 'fade-in 0.3s ease',
                      textAlign: 'center',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
                      🔒
                    </div>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Faça login para gerar jogos
                    </div>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                        margin: '0 auto 1rem auto',
                        maxWidth: '420px',
                      }}
                    >
                      O gerador Smart, desdobramentos, gerador místico e bolões
                      agora exigem conta para uso no app. Assim seus jogos,
                      filtros e recursos ficam vinculados ao seu perfil.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.6rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="btn-action"
                        onClick={redirectToLogin}
                        style={{ minWidth: '180px', fontWeight: 700 }}
                      >
                        Entrar para continuar
                      </button>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.assign(
                              '/login?mode=register&next=/app'
                            );
                          }
                        }}
                        style={{
                          minWidth: '180px',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--glass-border)',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'white',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Criar conta grátis
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'generator' && user && (
                  <div
                    className="glass-panel"
                    style={{ animation: 'fade-in 0.3s ease' }}
                  >
                    {/* Mode Selector Sub-Tabs */}
                    <div className="sub-tabs-container">
                      <button
                        className={`sub-tab-btn ${genSubTab === 'smart' ? 'active' : ''}`}
                        onClick={() => setGenSubTab('smart')}
                      >
                        Gerador Smart
                      </button>
                      <button
                        className={`sub-tab-btn ${genSubTab === 'wheeling' ? 'active' : ''}`}
                        onClick={() => setGenSubTab('wheeling')}
                      >
                        Desdobramento
                      </button>
                      <button
                        className={`sub-tab-btn ${genSubTab === 'mystic' ? 'active' : ''}`}
                        onClick={() => {
                          if (isPro) {
                            setGenSubTab('mystic');
                          } else {
                            setShowUpgradeModal(true);
                          }
                        }}
                      >
                        Gerador Místico 🔮 {!isPro && '👑'}
                      </button>
                      <button
                        className={`sub-tab-btn ${genSubTab === 'bolao' ? 'active' : ''}`}
                        onClick={() => {
                          setGenSubTab('bolao');
                        }}
                      >
                        Gerador Bolão 👥
                      </button>
                    </div>

                    {/* SUB-TAB: SMART GENERATOR */}
                    <div
                      style={{
                        display: genSubTab === 'smart' ? undefined : 'none',
                      }}
                    >
                      <div className="panel-header">
                        <div className="panel-title">
                          <span style={{ color: 'var(--accent-color)' }}>
                            ✦
                          </span>{' '}
                          SUGERIR JOGO IA
                        </div>
                        <span className="contest-badge">{config.name}</span>
                      </div>

                      {/* Explanation */}
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <strong style={{ color: 'white' }}>
                          Como funciona o Gerador IA:
                        </strong>{' '}
                        O sistema analisa o histórico de sorteios e gera jogos
                        que seguem padrões estatísticos (soma, primos,
                        Fibonacci, pares/ímpares, distribuição por quadrantes).
                        Cada jogo recebe uma{' '}
                        <strong style={{ color: 'var(--accent-color)' }}>
                          pontuação (score)
                        </strong>{' '}
                        de 0 a 100 - quanto maior, mais &quot;equilibrado&quot;
                        estatisticamente.
                      </div>

                      {/* Strategy Selector */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.35rem',
                            fontWeight: 600,
                          }}
                        >
                          Estratégia de Pesos
                        </label>
                        <div
                          className="options-selector"
                          style={{ marginBottom: '0' }}
                        >
                          <button
                            className={`option-btn ${intensity === 'balanced' ? 'active' : ''}`}
                            onClick={() => setIntensity('balanced')}
                          >
                            Equilibrado
                          </button>
                          <button
                            className={`option-btn ${intensity === 'aggressive' ? 'active' : ''}`}
                            onClick={() => setIntensity('aggressive')}
                          >
                            Quentes
                          </button>
                          <button
                            className={`option-btn ${intensity === 'delayed' ? 'active' : ''}`}
                            onClick={() => setIntensity('delayed')}
                          >
                            Atrasadas ⏳
                          </button>
                          <button
                            className={`option-btn ${intensity === 'surpresa' ? 'active' : ''}`}
                            onClick={() => setIntensity('surpresa')}
                          >
                            Surpresa
                          </button>
                        </div>
                        <div
                          style={{
                            fontSize: '0.55rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                            padding: '0.3rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(0,0,0,0.15)',
                          }}
                        >
                          {intensity === 'balanced' &&
                            '⚖️ Balanceia números quentes e frios. Mais usado e recomendado.'}
                          {intensity === 'aggressive' &&
                            '🔥 Prioriza números que mais saíram recentemente (quentes).'}
                          {intensity === 'delayed' &&
                            '⏳ Prioriza números com maior atraso (não saem há mais tempo).'}
                          {intensity === 'surpresa' &&
                            '🎲 Sem preferência — todos os números têm o mesmo peso.'}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.35rem',
                            fontWeight: 600,
                          }}
                        >
                          Quantidade de Jogos
                        </label>
                        <div
                          className="options-selector"
                          style={{ marginBottom: '0' }}
                        >
                          {[1, 3, 5].map((qty) => (
                            <button
                              key={qty}
                              className={`option-btn ${gameQuantity === qty ? 'active' : ''}`}
                              onClick={() => setGameQuantity(qty)}
                            >
                              {qty} {qty === 1 ? 'Jogo' : 'Jogos'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* PREMIUM: ADVANCED FILTERS & CO-OCCURRENCE */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <button
                          className="filter-toggle-btn"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          ⚙️{' '}
                          {showFilters
                            ? 'Esconder Filtros Avançados'
                            : 'Mostrar Filtros Avançados (Fixar/Excluir)'}
                        </button>

                        {showFilters && (
                          <div className="advanced-filters-panel">
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                lineHeight: 1.3,
                              }}
                            >
                              Clique nas dezenas do volante abaixo:
                              <br />
                              🟢 <strong>Uma vez (Verde):</strong> Fixar dezena
                              no jogo.
                              <br />
                              🔴 <strong>Duas vezes (Vermelho):</strong> Excluir
                              dezena do sorteio.
                            </span>

                            <VolanteGrid
                              mode="filter"
                              minNum={config.minNum}
                              maxNum={config.maxNum}
                              selectedList={[]}
                              filtersMap={filtersMap}
                              onSelect={toggleFilterNumber}
                            />

                            {/* CO-OCCURRENCE DEZENAS PARCEIRAS */}
                            {partnerNumbers.length > 0 && (
                              <div
                                style={{
                                  marginTop: '0.5rem',
                                  borderTop: '1px solid rgba(255,255,255,0.05)',
                                  paddingTop: '0.5rem',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--accent-color)',
                                    fontWeight: 'bold',
                                    display: 'block',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  👯 Dezenas Parceiras (Costumam Sair Juntas):
                                </span>
                                <div className="partner-balls-container">
                                  {partnerNumbers.map((item) => (
                                    <button
                                      key={item.num}
                                      className="partner-ball-btn"
                                      onClick={() =>
                                        setFiltersMap({
                                          ...filtersMap,
                                          [item.num]: 'fixed',
                                        })
                                      }
                                      style={
                                        {
                                          '--active-color': config.color,
                                        } as React.CSSProperties
                                      }
                                    >
                                      +{String(item.num).padStart(2, '0')}
                                      <span
                                        style={{
                                          opacity: 0.6,
                                          fontSize: '0.6rem',
                                        }}
                                      >
                                        ({item.freq}x)
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div
                              style={{
                                marginTop: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                paddingTop: '0.75rem',
                                width: '100%',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color: 'white',
                                }}
                              >
                                🧮 Regras de Distribuição Matemática
                              </span>

                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-main)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={avoidConsecutive}
                                  onChange={(e) =>
                                    setAvoidConsecutive(e.target.checked)
                                  }
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: 'var(--accent-color)',
                                  }}
                                />
                                <span>
                                  Evitar Sequências (Máx. 2 consecutivos
                                  seguidos)
                                </span>
                              </label>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '0.5rem',
                                  marginTop: '0.25rem',
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
                                    Soma das Dezenas {!isPro && '👑'}
                                  </label>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                    }}
                                  >
                                    <input
                                      type="number"
                                      placeholder="Min"
                                      value={customSumMin}
                                      onChange={(e) =>
                                        setCustomSumMin(e.target.value)
                                      }
                                      style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      a
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="Max"
                                      value={customSumMax}
                                      onChange={(e) =>
                                        setCustomSumMax(e.target.value)
                                      }
                                      style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </div>
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
                                    Limitar Repetidos Anterior {!isPro && '👑'}
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Qtd Máxima"
                                    value={maxRepeats}
                                    onChange={(e) =>
                                      setMaxRepeats(e.target.value)
                                    }
                                    style={{
                                      width: '100%',
                                      background: 'rgba(255,255,255,0.05)',
                                      border: '1px solid var(--glass-border)',
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                    }}
                                  />
                                </div>
                              </div>
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
                          </div>
                        )}

                        {/* GENERATE BUTTON */}
                        <button
                          onClick={handleGenerateSmart}
                          className="btn-action"
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            fontSize: '0.85rem',
                            marginBottom: '1rem',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                          }}
                        >
                          🎲 Gerar{' '}
                          {gameQuantity > 1 ? `${gameQuantity} Jogos` : 'Jogo'}{' '}
                          com IA
                        </button>

                        {/* Generated Games Display */}
                        {generatedGames.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                                marginBottom: '0.4rem',
                              }}
                            >
                              ✦ JOGOS GERADOS ({generatedGames.length})
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                              }}
                            >
                              {generatedGames.map((game, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '8px',
                                    background: 'rgba(0,240,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <div
                                      className="balls-container"
                                      style={{
                                        flex: 1,
                                        margin: 0,
                                        justifyContent: 'flex-start',
                                      }}
                                    >
                                      {game.numbers
                                        .sort((a, b) => a - b)
                                        .map((n, i) => (
                                          <span
                                            key={i}
                                            className="ball"
                                            style={
                                              {
                                                '--ball-color': config.color,
                                                width: '24px',
                                                height: '24px',
                                                fontSize: '0.65rem',
                                                borderColor: config.color,
                                              } as React.CSSProperties
                                            }
                                          >
                                            {String(n).padStart(2, '0')}
                                          </span>
                                        ))}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleSaveGeneratedGame(game.numbers)
                                      }
                                      style={{
                                        background: 'rgba(0,230,118,0.1)',
                                        border: '1px solid rgba(0,230,118,0.2)',
                                        color: '#00e676',
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      💾 Salvar nos Meus Jogos
                                    </button>
                                  </div>
                                  {/* Metrics Row */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '0.4rem',
                                      marginTop: '0.3rem',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '0.5rem',
                                        padding: '0.1rem 0.3rem',
                                        borderRadius: '3px',
                                        background:
                                          game.metrics.score >= 85
                                            ? 'rgba(0,230,118,0.12)'
                                            : game.metrics.score >= 65
                                              ? 'rgba(255,214,0,0.12)'
                                              : 'rgba(255,68,102,0.12)',
                                        color:
                                          game.metrics.score >= 85
                                            ? '#00e676'
                                            : game.metrics.score >= 65
                                              ? '#ffd600'
                                              : '#ff4466',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-numbers)',
                                      }}
                                    >
                                      Score: {game.metrics.score}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.5rem',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'var(--font-numbers)',
                                      }}
                                    >
                                      Soma: {game.metrics.sum}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.5rem',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      {game.metrics.evenCount}P/
                                      {game.metrics.oddCount}I
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.5rem',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      {game.metrics.primeCount} primos
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.5rem',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      {game.metrics.quadrantsCount} quad.
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Suspense fallback={<TabFallback />}>
                          <SavedGamesPanel
                            savedGames={savedGames}
                            selectedForPool={selectedForPool}
                            setSelectedForPool={setSelectedForPool}
                            setBolaoText={setBolaoText}
                            latestResultsMap={latestResultsMap}
                            getCleanDezenas={getCleanDezenas}
                            handleDeleteGame={handleDeleteGame}
                            downloadTXT={downloadTXT}
                            downloadPDF={downloadPDF}
                            handlePrintGames={handlePrintGames}
                            isPro={isPro}
                            bolaoCotas={bolaoCotas}
                            setBolaoCotas={setBolaoCotas}
                            bolaoTaxa={bolaoTaxa}
                            setBolaoTaxa={setBolaoTaxa}
                            setShowUpgradeModal={setShowUpgradeModal}
                            handleBuildBolao={handleBuildBolao}
                            bolaoText={bolaoText}
                            handleCopyText={handleCopyText}
                            copyFeedback={copyFeedback}
                            bolaoShareUrl={bolaoShareUrl}
                          />
                        </Suspense>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-ABA: DESDOBRAMENTO / WHEELING */}
                {activeTab === 'generator' &&
                  user &&
                  genSubTab === 'wheeling' && (
                    <div
                      className="glass-panel"
                      style={{ animation: 'fade-in 0.3s ease' }}
                    >
                      {/* Title + Explanation */}
                      <h3
                        style={{
                          color: 'var(--accent-color)',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          margin: '0 0 0.3rem 0',
                        }}
                      >
                        FECHAMENTO {config.name}
                      </h3>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <strong style={{ color: 'white' }}>
                          Como funciona o fechamento:
                        </strong>
                        <br />
                        Você escolhe <em>mais</em> números do que o jogo exige (
                        {config.drawCount}). O sistema gera{' '}
                        <em>múltiplos jogos</em> com esses números, cobrindo
                        mais combinações por menos dinheiro.
                        <br />
                        <br />
                        <strong style={{ color: 'var(--accent-color)' }}>
                          Garantia CONDICIONAL:
                        </strong>{' '}
                        O fechamento garante o prêmio <em>apenas se</em> os
                        números sorteados estiverem dentro do grupo que você
                        escolheu. Isso <em>não</em> significa que eles vão
                        sortear — apenas que, <em>caso sorteu-se</em>, você
                        estaria coberto.
                        <br />
                        <br />
                        <strong style={{ color: '#00e676' }}>Quadra:</strong> Se
                        pelo menos {config.drawCount - 2} sorteados estiverem no
                        seu grupo → ganha Quadra.
                        <br />
                        <strong style={{ color: '#ffd600' }}>Quina:</strong> Se
                        pelo menos {config.drawCount - 1} sorteados estiverem →
                        ganha Quina.
                        <br />
                        <strong style={{ color: 'var(--accent-color)' }}>
                          Sena:
                        </strong>{' '}
                        Se todos os {config.drawCount} sorteados estiverem →
                        ganha Sena (muito mais caro).
                        <br />
                        <br />
                        <strong style={{ color: 'white' }}>
                          Exemplo prático:
                        </strong>{' '}
                        Se você escolhe 10 números e o fechamento Quadra gera 15
                        jogos (R$ 67,00), você economiza <em>muito</em>{' '}
                        comparado a apostar todos os 210 jogos na Caixa (R$
                        945,00). Mas se o sorteio cair fora do seu grupo de 10,
                        você perde tudo igual.
                      </div>

                      {/* Number Grid */}
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.3rem',
                        }}
                      >
                        Escolha seus números (mínimo {config.drawCount + 1}):
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(10, 1fr)',
                          gap: '0.3rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {Array.from(
                          { length: config.maxNum },
                          (_, i) => i + 1
                        ).map((num) => {
                          const isSelected = wheelSelectedNums.includes(num);
                          return (
                            <button
                              key={num}
                              onClick={() => {
                                playSound('click');
                                setWheelSelectedNums((prev) =>
                                  isSelected
                                    ? prev.filter((n) => n !== num)
                                    : [...prev, num]
                                );
                                setWheelGeneratedGames([]); // limpa ao mudar seleção
                              }}
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                border: `2px solid ${isSelected ? config.color : 'var(--glass-border)'}`,
                                background: isSelected
                                  ? config.color
                                  : 'rgba(0,0,0,0.3)',
                                color: isSelected
                                  ? 'white'
                                  : 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: 'var(--font-numbers)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isSelected
                                  ? `0 0 8px ${config.color}40`
                                  : 'none',
                              }}
                            >
                              {String(num).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>

                      {/* Guarantee Type Selector */}
                      {wheelSelectedNums.length >= config.drawCount + 1 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div
                            style={{
                              fontSize: '0.6rem',
                              color: 'var(--text-muted)',
                              marginBottom: '0.3rem',
                            }}
                          >
                            Nível de garantia:
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {[
                              {
                                value: 'quadra' as const,
                                label: 'Quadra',
                                desc: 'Econômico',
                                color: '#00e676',
                              },
                              {
                                value: 'quina' as const,
                                label: 'Quina',
                                desc: 'Equilibrado',
                                color: '#ffd600',
                              },
                              {
                                value: 'full' as const,
                                label: 'Sena',
                                desc: 'Completo',
                                color: 'var(--accent-color)',
                              },
                            ].map((opt) => {
                              const n = wheelSelectedNums.length;
                              const est = inlineWheelCount(
                                n,
                                config.drawCount,
                                opt.value
                              );
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    playSound('click');
                                    setWheelGuarantee(opt.value);
                                    setWheelGeneratedGames([]);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '0.4rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background:
                                      wheelGuarantee === opt.value
                                        ? `${opt.color}18`
                                        : 'rgba(0,0,0,0.2)',
                                    border: `1px solid ${wheelGuarantee === opt.value ? opt.color : 'var(--glass-border)'}`,
                                    color:
                                      wheelGuarantee === opt.value
                                        ? opt.color
                                        : 'var(--text-muted)',
                                    transition: 'all 0.15s',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {opt.label}
                                  </div>
                                  <div
                                    style={{ fontSize: '0.5rem', opacity: 0.7 }}
                                  >
                                    ~{est} jogos · R${' '}
                                    {(est * 4.5).toFixed(2).replace('.', ',')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cost comparison */}
                      {wheelSelectedNums.length >= config.drawCount + 1 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            background: 'rgba(0,240,255,0.03)',
                            border: '1px solid rgba(0,240,255,0.08)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.6rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <strong style={{ color: 'white' }}>
                              {wheelSelectedNums.length}
                            </strong>{' '}
                            números · Aposta da Caixa ={' '}
                            <strong style={{ color: '#ff4466' }}>
                              R${' '}
                              {(() => {
                                let c = 1;
                                for (let i = 0; i < config.drawCount; i++)
                                  c =
                                    (c * (wheelSelectedNums.length - i)) /
                                    (i + 1);
                                return (c * 4.5).toFixed(2).replace('.', ',');
                              })()}
                            </strong>
                          </span>
                          <span
                            style={{ fontSize: '0.6rem', color: '#00e676' }}
                          >
                            Fechamento ={' '}
                            <strong>
                              R${' '}
                              {(() => {
                                const est = inlineWheelCount(
                                  wheelSelectedNums.length,
                                  config.drawCount,
                                  wheelGuarantee
                                );
                                return (est * 4.5).toFixed(2).replace('.', ',');
                              })()}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerateWheel}
                        disabled={
                          wheelSelectedNums.length < config.drawCount + 1
                        }
                        className="btn-action"
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          opacity:
                            wheelSelectedNums.length < config.drawCount + 1
                              ? 0.4
                              : 1,
                          cursor:
                            wheelSelectedNums.length < config.drawCount + 1
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        🔢 Gerar Fechamento
                        {wheelSelectedNums.length >= config.drawCount + 1 &&
                          ` (~${inlineWheelCount(wheelSelectedNums.length, config.drawCount, wheelGuarantee)} jogos)`}
                      </button>

                      {/* Generated wheel games */}
                      {wheelGeneratedGames.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.4rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-color)',
                              }}
                            >
                              {wheelGeneratedGames.length} JOGOS GERADOS
                            </span>
                            <button
                              onClick={() => {
                                wheelGeneratedGames.forEach((nums) =>
                                  handleSaveGeneratedGame(nums)
                                );
                                playSound('success');
                              }}
                              style={{
                                background: 'rgba(0,230,118,0.1)',
                                border: '1px solid rgba(0,230,118,0.2)',
                                color: '#00e676',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              💾 Salvar Todos em Meus Jogos (
                              {(wheelGeneratedGames.length * 4.5)
                                .toFixed(2)
                                .replace('.', ',')}
                              )
                            </button>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.3rem',
                              maxHeight: '300px',
                              overflowY: 'auto',
                            }}
                          >
                            {wheelGeneratedGames.map((nums, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background:
                                    idx % 2 === 0
                                      ? 'rgba(255,255,255,0.02)'
                                      : 'transparent',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    minWidth: '20px',
                                    fontFamily: 'var(--font-numbers)',
                                  }}
                                >
                                  #{idx + 1}
                                </span>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '0.2rem',
                                    flex: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {nums.map((n, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: config.color,
                                        color: 'white',
                                        fontSize: '0.55rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--font-numbers)',
                                      }}
                                    >
                                      {String(n).padStart(2, '0')}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleSaveGeneratedGame(nums)}
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(0,230,118,0.15)',
                                    color: '#00e676',
                                    fontSize: '0.55rem',
                                    fontWeight: 600,
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Salvar em Meus Jogos
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Disclaimer */}
                      <div
                        style={{
                          fontSize: '0.55rem',
                          color: '#ff4466',
                          lineHeight: 1.5,
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(255,68,102,0.05)',
                          border: '1px solid rgba(255,68,102,0.12)',
                        }}
                      >
                        ⚠️ <strong>Aviso importante:</strong> Ninguém pode
                        prever quais números serão sorteados. O fechamento{' '}
                        <strong>não aumenta suas chances de acertar</strong> —
                        ele apenas <strong>organiza melhor o dinheiro</strong>{' '}
                        que você já gastaria. Se você escolher 10 números e o
                        sorteio cair fora do seu grupo, você não ganha nada.
                      </div>
                    </div>
                  )}

                {/* SUB-ABA: MÍSTICO (dentro do Gerador) */}
                {activeTab === 'generator' &&
                  user &&
                  genSubTab === 'mystic' && (
                    <Suspense fallback={<TabFallback />}>
                      <MysticGenerator
                        activeLottery={activeLottery}
                        onGenerated={async (nums) => {
                          const lastDrawNumbers = (
                            result?.listaDezenas ||
                            result?.dezenasSorteadasOrdemSorteio ||
                            []
                          ).map(Number);
                          const math = await loadMath();
                          setGeneratedGames((prev) => [
                            ...prev,
                            {
                              numbers: nums,
                              metrics: math.analyzeGame(
                                nums,
                                config,
                                lastDrawNumbers
                              ),
                            },
                          ]);
                          playSound('success');
                        }}
                        playSound={playSound}
                      />
                    </Suspense>
                  )}

                {/* SUB-ABA: BOLÃO (dentro do Gerador) */}
                {activeTab === 'generator' && user && genSubTab === 'bolao' && (
                  <Suspense fallback={<TabFallback />}>
                    <BolaoPanel
                      savedGames={savedGames}
                      activeLottery={activeLottery}
                      isPro={isPro}
                      user={user}
                      onUpgrade={() => setShowUpgradeModal(true)}
                      playSound={playSound}
                    />
                  </Suspense>
                )}

                {activeTab === 'games' && (
                  <div
                    className="glass-panel"
                    style={{ animation: 'fade-in 0.3s ease' }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h3
                        style={{
                          color: 'var(--accent-color)',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          margin: '0 0 0.2rem 0',
                        }}
                      >
                        MEUS JOGOS
                      </h3>
                      <p
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Acesse todos os cartões salvos, confira acertos contra o
                        último concurso e monte bolões a partir da sua base.
                      </p>
                    </div>
                    <Suspense fallback={<TabFallback />}>
                      <SavedGamesPanel
                        savedGames={savedGames}
                        selectedForPool={selectedForPool}
                        setSelectedForPool={setSelectedForPool}
                        setBolaoText={setBolaoText}
                        latestResultsMap={latestResultsMap}
                        getCleanDezenas={getCleanDezenas}
                        handleDeleteGame={handleDeleteGame}
                        downloadTXT={downloadTXT}
                        downloadPDF={downloadPDF}
                        handlePrintGames={handlePrintGames}
                        isPro={isPro}
                        bolaoCotas={bolaoCotas}
                        setBolaoCotas={setBolaoCotas}
                        bolaoTaxa={bolaoTaxa}
                        setBolaoTaxa={setBolaoTaxa}
                        setShowUpgradeModal={setShowUpgradeModal}
                        handleBuildBolao={handleBuildBolao}
                        bolaoText={bolaoText}
                        handleCopyText={handleCopyText}
                        copyFeedback={copyFeedback}
                        bolaoShareUrl={bolaoShareUrl}
                      />
                    </Suspense>
                  </div>
                )}

                {/* ==========================================
         ABA: CENTRAL FINANCEIRA
         ========================================== */}
                {activeTab === 'finance' && (
                  <Suspense fallback={<TabFallback />}>
                    <FinanceTab
                      isPro={isPro}
                      playSound={playSound}
                      setShowUpgradeModal={setShowUpgradeModal}
                    />
                  </Suspense>
                )}

                {/* ==========================================
         ABA: RANKING / LIDERES
         ========================================== */}
                {activeTab === 'ranking' && (
                  <Suspense fallback={<TabFallback />}>
                    <RankingPanel user={user} savedGames={savedGames} />
                  </Suspense>
                )}

                {/* ==========================================
         ABA DO ADMINISTRADOR (ADMIN DASHBOARD)
         ========================================== */}
                {activeTab === 'admin' && user?.role === 'admin' && (
                  <div
                    className="profile-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '1.2rem',
                          fontWeight: 900,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        🔑 PAINEL DO ADMINISTRADOR
                      </h2>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.2rem',
                        }}
                      >
                        Gerencie preços dinâmicos, visualize estatísticas e
                        promova ou altere funções de usuários cadastrados no
                        banco Turso.
                      </p>
                    </div>

                    <AdminPanel playSound={playSound} />
                  </div>
                )}
              </>
            )}

            {/* MODAL DE UPGRADE PREMIUM PRO */}
            <Suspense fallback={null}>
              <PaymentSection
                user={user}
                isPro={isPro}
                playSound={playSound}
                onPaymentSuccess={() => {
                  setUser((prev) => (prev ? { ...prev, role: 'pro' } : prev));
                  setShowUpgradeModal(false);
                }}
                showUpgradeModal={showUpgradeModal}
                setShowUpgradeModal={setShowUpgradeModal}
              />
            </Suspense>

            {/* MODAL DE TUTORIAL ONBOARDING GUIADO */}
            {showTutorial && (
              <Suspense fallback={<TabFallback />}>
                <TutorialModal
                  tutorialStep={tutorialStep}
                  onNext={() => setTutorialStep((prev) => prev + 1)}
                  onPrev={() => setTutorialStep((prev) => prev - 1)}
                  onSkip={() => {
                    setShowTutorial(false);
                    setShowSettings(false);
                    localStorage.setItem('meu-trevo-onboarding-done', 'true');
                    playSound('success');
                  }}
                  onNavigate={(tab, subTab) => {
                    setActiveTab(tab);
                    if (subTab === 'smart') setGenSubTab('smart');
                    if (subTab === 'bolao') setGenSubTab('bolao');
                    if (tab === 'results' && tutorialStep === 5)
                      setShowSettings(true);
                  }}
                  playSound={playSound}
                />
              </Suspense>
            )}

            {/* MODAL: EXPORTAR/IMPORTAR JOGOS */}
            {showExportImport && (
              <Suspense fallback={<TabFallback />}>
                <ExportImportModal
                  lottery={activeLottery}
                  numbers={[]}
                  savedGames={savedGames}
                  onClose={() => setShowExportImport(false)}
                />
              </Suspense>
            )}

            {/* CAMERA SCANNER */}
            {showCamera && (
              <Suspense fallback={<TabFallback />}>
                <CameraScanner
                  onNumbersDetected={() => {
                    setShowCamera(false);
                  }}
                  onClose={() => setShowCamera(false)}
                />
              </Suspense>
            )}
          </div>

          {/* Bottom Nav Bar */}
          <nav
            className="bottom-nav"
            style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
          >
            <button
              className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <span className="nav-icon">★</span> Resultados
            </button>
            <button
              className={`nav-item ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <span className="nav-icon">⚡</span> Gerador
            </button>
            <button
              className={`nav-item ${activeTab === 'games' ? 'active' : ''}`}
              onClick={() => setActiveTab('games')}
            >
              <span className="nav-icon">💾</span> Meus Jogos
            </button>
            <button
              className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              <span className="nav-icon">🎯</span> Simulador
            </button>
            <button
              className={`nav-item ${activeTab === 'ranking' ? 'active' : ''}`}
              onClick={() => setActiveTab('ranking')}
            >
              <span className="nav-icon">🏆</span> Ranking
            </button>
            <button
              className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              <span className="nav-icon">💰</span> Financeiro
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
