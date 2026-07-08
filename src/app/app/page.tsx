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
const UpgradeModal = lazy(() => import('../components/UpgradeModal'));
const TutorialModal = lazy(() => import('../components/TutorialModal'));
const AdminPanel = lazy(() => import('../components/AdminPanel'));
const ResultsTab = lazy(() => import('../components/ResultsTab'));
const StatsTab = lazy(() => import('../components/StatsTab'));
const ToolsPanel = lazy(() => import('../components/ToolsPanel'));
const FinanceTab = lazy(() => import('../components/FinanceTab'));
const LandingPage = lazy(() => import('../components/LandingPage'));
const RankingPanel = lazy(() => import('../components/RankingPanel'));
const BolaoPanel = lazy(() => import('../components/BolaoPanel'));
const MysticGenerator = lazy(() => import('../components/MysticGenerator'));
const ExportImportModal = lazy(() => import('../components/ExportImportModal'));
const CameraScanner = lazy(() => import('../components/CameraScanner'));
const QuickSimulator = lazy(() => import('../components/QuickSimulator'));
const SavedGamesPanel = lazy(() => import('../components/SavedGamesPanel'));

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
  const [settingsSubTab, setSettingsSubTab] = useState<
    'config' | 'profile' | 'tools'
  >('config');
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

  // --- PREMIUM FREEMIUM MODAL & CHECKOUT STATES ---
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<{
    payment_id: string;
    qr_code: string;
    qr_image_url: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
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
  const [emailAlertFeedback, setEmailAlertFeedback] = useState<string>('');

  // --- PROFILE EDIT STATES ---
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('👤');
  const [profileFavLottery, setProfileFavLottery] = useState('megasena');
  const [profileCpfCnpj, setProfileCpfCnpj] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profileFeedback, setProfileFeedback] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const syncProfileDrafts = (nextUser: User | null) => {
    if (!nextUser) return;
    setProfileName(nextUser.name || '');
    setProfileAvatar(nextUser.avatar || '👤');
    setProfileFavLottery(nextUser.favorite_lottery || 'megasena');
    setProfileCpfCnpj(nextUser.cpf_cnpj || '');
    setProfileCity(nextUser.city || '');
    setProfileState(nextUser.state || '');
  };

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

  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const handleStartCheckout = async (provider: 'pixgo' | 'stripe') => {
    if (!user) {
      redirectToLogin();
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    setPaymentData(null);
    setPaymentStatus('pending');
    try {
      const res = await fetchWithCsrf('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: isAnnual ? 'annual' : 'monthly',
          provider,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        if (result.success && result.data) {
          if (provider === 'stripe' && result.data.checkout_url) {
            window.location.assign(result.data.checkout_url);
            return;
          }

          setPaymentData(result.data);
          startPollingPayment(result.data.payment_id);
        }
      } else {
        setCheckoutError(
          result.error || 'Não foi possível iniciar o checkout.'
        );
      }
    } catch (e) {
      console.error(e);
      setCheckoutError('Erro de conexão ao iniciar o pagamento.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const startPollingPayment = (id: string) => {
    if (pollingIntervalId) clearInterval(pollingIntervalId);

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithCsrf(`/api/payments/status?id=${id}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const status = result.data.status;
            setPaymentStatus(status);
            if (status === 'completed') {
              clearInterval(interval);
              setPollingIntervalId(null);
              playSound('success');
              checkAuthStatus();
              setTimeout(() => {
                setShowUpgradeModal(false);
                setPaymentData(null);
                setPaymentStatus(null);
              }, 3000);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 4000);
    setPollingIntervalId(interval);
  };

  const handleSimulatePaymentConfirm = async () => {
    if (!paymentData) return;
    try {
      const res = await fetchWithCsrf(
        `/api/payments/status?id=${paymentData.payment_id}&confirm=true`
      );
      if (res.ok) {
        const result = await res.json();
        if (
          result.success &&
          result.data &&
          result.data.status === 'completed'
        ) {
          setPaymentStatus('completed');
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          playSound('success');
          checkAuthStatus();
          setTimeout(() => {
            setShowUpgradeModal(false);
            setPaymentData(null);
            setPaymentStatus(null);
          }, 3000);
        }
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
        syncProfileDrafts(data.user);
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
        setCheckoutError('Pagamento no Stripe cancelado antes da confirmação.');
        setShowUpgradeModal(true);
        clearStripeParams();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (upgrade !== 'success') return;

    const initFrame = window.requestAnimationFrame(() => {
      setShowUpgradeModal(true);
      setCheckoutLoading(true);
      setCheckoutError(null);
    });

    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      const refreshedUser = await checkAuthStatus();

      if (refreshedUser?.role === 'pro' || attempts >= 10) {
        window.clearInterval(interval);
        setCheckoutLoading(false);
        clearStripeParams();
        if (attempts >= 10 && refreshedUser?.role !== 'pro') {
          setCheckoutError(
            'Pagamento recebido. O Stripe ainda está confirmando sua assinatura; recarregue em alguns segundos se o PRO não liberar imediatamente.'
          );
        } else {
          setShowUpgradeModal(false);
        }
      }
    }, 2000);

    return () => {
      window.cancelAnimationFrame(initFrame);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

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
          syncProfileDrafts(data.user);
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setProfileFeedback('');
    setProfileLoading(true);

    try {
      const res = await fetchWithCsrf('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          password: profilePassword || undefined,
          avatar: profileAvatar,
          favorite_lottery: profileFavLottery,
          cpf_cnpj: profileCpfCnpj.trim() || undefined,
          city: profileCity.trim() || undefined,
          state: profileState.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setShowInRanking(data.user?.show_in_ranking !== false);
        syncProfileDrafts(data.user);
        setProfilePassword('');
        setProfileFeedback('✓ Perfil atualizado!');
        playSound('success');
        setTimeout(() => setProfileFeedback(''), 4000);
      } else {
        setProfileFeedback(`⚠️ ${data.error || 'Erro ao atualizar'}`);
        playSound('delete');
      }
    } catch {
      setProfileFeedback('⚠️ Erro ao salvar');
      playSound('delete');
    } finally {
      setProfileLoading(false);
    }
  };

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

  const downloadTXT = (gamesList: number[][], nameSuffix = 'jogos') => {
    playSound('success');
    const textContent = gamesList
      .map((game, idx) => {
        return `Jogo ${idx + 1}: ${game.map((n) => String(n).padStart(2, '0')).join(' - ')}`;
      })
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meu-trevo-${activeLottery}-${nameSuffix}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (gamesList: number[][], title = 'Jogos Gerados') => {
    playSound('success');
    const lotName =
      LOTTERY_CONFIGS[activeLottery]?.name || activeLottery.toUpperCase();
    const lotColor = LOTTERY_CONFIGS[activeLottery]?.color || '#209869';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const gamesHtml = gamesList
      .map(
        (game, idx) => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid;">
        <div style="font-weight:bold;color:#666;min-width:40px;">#${idx + 1}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${game.map((n) => `<span style="width:36px;height:36px;border-radius:50%;border:2px solid ${lotColor};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;color:${lotColor};">${String(n).padStart(2, '0')}</span>`).join('')}
        </div>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${title} - Meu Trevo</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;color:#333;}
        h1{font-size:18px;margin-bottom:4px;}h2{font-size:13px;color:#666;margin-bottom:20px;font-weight:normal;}
        .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center;}
      </style></head><body>
      <h1>Meu Trevo - ${lotName}</h1>
      <h2>${title} • Gerado em ${new Date().toLocaleDateString('pt-BR')}</h2>
      <div style="display:flex;flex-direction:column;gap:8px;">${gamesHtml}</div>
      <div class="footer">Meu Trevo © ${new Date().getFullYear()} • Gerado automaticamente • Aviso: loteria é jogo de azar</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handlePrintGames = (gamesList: number[][]) => {
    playSound('success');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const lotName =
      LOTTERY_CONFIGS[activeLottery]?.name || activeLottery.toUpperCase();
    const lotColor = LOTTERY_CONFIGS[activeLottery]?.color || '#209869';

    const gamesHtml = gamesList
      .map(
        (game, idx) => `
      <div class="ticket-card">
        <div class="ticket-header">
          <span class="ticket-title">JOGO ${String(idx + 1).padStart(2, '0')}</span>
          <span class="ticket-badge" style="background-color: ${lotColor};">${lotName}</span>
        </div>
        <div class="ticket-balls">
          ${game
            .map(
              (n) => `
            <span class="ticket-ball" style="border-color: ${lotColor}; background-color: ${lotColor}15; color: ${lotColor};">
              ${String(n).padStart(2, '0')}
            </span>
          `
            )
            .join('')}
        </div>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meu Trevo - Volantes para Impressão</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 40px 20px;
              text-align: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              margin-bottom: 30px;
              display: flex;
              justify-content: center;
              gap: 15px;
            }
            .btn {
              padding: 10px 24px;
              font-size: 0.95rem;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }
            .btn-primary {
              background-color: #0f172a;
              color: white;
            }
            .btn-secondary {
              background-color: #f1f5f9;
              color: #475569;
              border: 1px solid #cbd5e1;
            }
            .header {
              margin-bottom: 35px;
            }
            .logo {
              font-size: 1.8rem;
              font-weight: 800;
              letter-spacing: 1.5px;
              background: linear-gradient(90deg, #0f172a, ${lotColor});
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 0.85rem;
              color: #64748b;
            }
            .tickets-container {
              max-width: 600px;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .ticket-card {
              border: 1.5px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              text-align: left;
              background-color: #fff;
              page-break-inside: avoid;
            }
            .ticket-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
            }
            .ticket-title {
              font-weight: 800;
              font-size: 1rem;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .ticket-badge {
              font-size: 0.7rem;
              font-weight: bold;
              color: white;
              padding: 3px 10px;
              border-radius: 50px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .ticket-balls {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            .ticket-ball {
              width: 38px;
              height: 38px;
              border-radius: 50%;
              border: 2px solid;
              font-weight: bold;
              font-size: 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .footer {
              margin-top: 40px;
              font-size: 0.8rem;
              color: #94a3b8;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
              .ticket-card {
                border-color: #cbd5e1;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            
<button class="btn btn-primary" onclick="window.print();">Imprimir Volantes</button>
            <button class="btn btn-secondary" onclick="window.close();">Fechar</button>
          </div>
          <div class="header">
            <div class="logo">Meu Trevo</div>
            <div class="subtitle">Volantes de Aposta Otimizados - Conferir e Registrar</div>
          </div>
          <div class="tickets-container">
            ${gamesHtml}
          </div>
          <div class="footer">
            Gerado de forma inteligente com matemática real no Meu Trevo Pro. Boa sorte!
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle logout
  const handleLogout = async () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setPaymentData(null);
    setPaymentStatus(null);
    setShowUpgradeModal(false);
    try {
      const res = await fetchWithCsrf('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setSavedGames([]);
        window.location.assign('/login');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      '⚠️ ATENÇÃO: Esta ação é definitiva e apagará permanentemente todos os seus dados cadastrais, jogos salvos e históricos da plataforma Meu Trevo de acordo com as diretrizes da LGPD. Deseja prosseguir?'
    );

    if (!confirmed) return;

    try {
      const res = await fetchWithCsrf('/api/auth/delete', { method: 'POST' });
      if (res.ok) {
        alert('Sua conta e todos os seus dados foram excluídos com sucesso.');
        setUser(null);
        setSavedGames([]);
        setActiveTab('results');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir conta.');
      }
    } catch {
      alert('Erro de conexão ao excluir conta.');
    }
  };

  // Toggle simulated email alerts
  const handleToggleEmailAlerts = () => {
    const nextVal = !emailAlerts;
    setEmailAlerts(nextVal);
    setEmailAlertFeedback(
      nextVal
        ? '✓ Alertas de resultados ativados! Enviaremos análises do Turso DB.'
        : '✓ Alertas desativados.'
    );
    setTimeout(() => setEmailAlertFeedback(''), 3000);
  };

  // Build Bolão/Pool sharing text and WhatsApp URL
  const handleBuildBolao = () => {
    if (selectedForPool.length === 0) return;

    const selectedList = savedGames.filter((g) =>
      selectedForPool.includes(g.id)
    );
    let totalCost = 0;

    let text = `🍀 *BOLÃO MEU TREVO - JOGOS OTIMIZADOS* 🍀\n`;
    text += `Abaixo estão nossos jogos gerados matematicamente no Meu Trevo:\n\n`;

    selectedList.forEach((game, idx) => {
      const configGame = LOTTERY_CONFIGS[game.lottery];
      let price = 4.0;
      if (game.lottery === 'megasena') price = 5.0;
      else if (game.lottery === 'lotofacil') price = 3.0;
      else if (game.lottery === 'quina') price = 2.5;

      totalCost += price;

      text += `${idx + 1}. *[${configGame?.name || game.lottery.toUpperCase()}]* \n`;
      text += `👉 \` ${game.numbers.replace(/,/g, ' - ')} \` \n\n`;
    });

    const cotasNum = parseInt(bolaoCotas, 10) || 1;
    const taxaPct = parseFloat(bolaoTaxa) || 0;

    const totalWithTax = totalCost * (1 + taxaPct / 100);
    const pricePerCota = totalWithTax / cotasNum;

    text += `💰 *Custo Total dos Volantes:* R$ ${totalCost.toFixed(2).replace('.', ',')}\n`;
    if (isPro && (cotasNum > 1 || taxaPct > 0)) {
      text += `👥 *Total de Cotas:* ${cotasNum}\n`;
      if (taxaPct > 0) {
        text += `⚙️ *Taxa de Organização:* ${taxaPct}%\n`;
      }
      text += `💵 *Valor por Cota:* R$ ${pricePerCota.toFixed(2).replace('.', ',')}\n\n`;
    } else {
      text += `\n`;
    }
    text += `🤖 Gerado de forma inteligente com IA. Vamos ganhar juntos!`;

    setBolaoText(text);
    setBolaoShareUrl(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    );
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

  const handleFactoryReset = async () => {
    playSound('delete');
    setTheme('meganeon');
    setHistoryLimit(30);
    setEnableSounds(false);
    setFiltersMap({});
    setShowFilters(false);
    setShowRateio(false);
    setSelectedForPool([]);
    setBolaoText('');
    setBolaoShareUrl('');
    await handleLogout();
  };

  // Helper to render volante board
  const renderVolante = (
    mode: 'filter' | 'wheeling' | 'simulator',
    selectedList: number[],
    onSelect: (num: number) => void
  ) => {
    const balls = [];
    const minVal = config.minNum;
    const maxVal = config.maxNum;
    const isCompact = maxVal - minVal + 1 <= 31;

    for (let i = minVal; i <= maxVal; i++) {
      let extraClass = '';
      let style: React.CSSProperties = {};

      if (mode === 'filter') {
        const status = filtersMap[i] || 'none';
        if (status === 'fixed') {
          extraClass = 'selected';
          style = {
            '--active-color': '#00e676',
            '--active-glow': 'rgba(0, 230, 118, 0.4)',
          } as React.CSSProperties;
        } else if (status === 'excluded') {
          extraClass = 'selected';
          style = {
            '--active-color': '#ff1744',
            '--active-glow': 'rgba(255, 23, 68, 0.4)',
          } as React.CSSProperties;
        }
      } else {
        if (selectedList.includes(i)) {
          extraClass = 'selected';
        }
      }

      balls.push(
        <button
          key={i}
          className={`volante-ball ${extraClass}`}
          style={style}
          onClick={() => onSelect(i)}
        >
          {String(i).padStart(2, '0')}
        </button>
      );
    }

    return (
      <div className={`volante-grid ${isCompact ? 'compact' : ''}`}>
        {balls}
      </div>
    );
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': 'https://www.meutrevo.com/#website',
                url: 'https://www.meutrevo.com',
                name: 'Meu Trevo',
                description:
                  'Resultados em tempo real e gerador de dezenas estatístico para loterias do Brasil.',
                publisher: {
                  '@id': 'https://www.meutrevo.com/#organization',
                },
                inLanguage: 'pt-BR',
              },
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://www.meutrevo.com/#software',
                name: 'Meu Trevo',
                url: 'https://www.meutrevo.com',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '14.90',
                  priceCurrency: 'BRL',
                },
                description:
                  'Assistente Lotérico Inteligente com desdobramentos combinatórios matemáticos e análises estatísticas em tempo real das loterias da Caixa.',
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'O Meu Trevo garante que eu vou ganhar na loteria?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Não. Loterias são jogos baseados em aleatoriedade pura e sorte. Nenhuma ferramenta pode prever os números que vão sair. O Meu Trevo utiliza estatística histórica real e análise combinatória para otimizar suas apostas, permitindo que você cubra mais números com menos cartões de forma matemática.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funcionam os desdobramentos (fechamentos)?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'O desdobramento combinatório seleciona jogos específicos dentro de um grupo de números escolhidos. Por exemplo, em vez de pagar por todas as combinações de 10 números (o que seria extremamente caro), o algoritmo seleciona um conjunto otimizado de cartões simples que garante 100% de chance de Quadra se pelo menos 4 dos sorteados estiverem no seu grupo.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funciona a assinatura PRO e a ativação?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A ativação é 100% automatizada. Ao clicar em Assinar PRO, nossa API gera um QR Code Pix dinâmico. Assim que você realiza o pagamento no aplicativo do seu banco, o sistema reconhece a liquidação em segundos e libera a sua conta imediatamente.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Posso exportar os meus jogos gerados?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Sim! A versão PRO permite baixar os cartões gerados em formato TXT compatível com os principais importadores, ou formatar a impressão física diretamente na impressora.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

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

            {/* Painel suspenso de Configurações */}
            {/* Painel suspenso de Configurações e Perfil combinado */}
            {showSettings && (
              <div
                ref={settingsRef}
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '1rem',
                  left: 'auto',
                  width: 'calc(100vw - 2rem)',
                  maxWidth: '380px',
                  zIndex: 200,
                  marginTop: '0.5rem',
                  animation: 'fade-in 0.2s ease-out',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  padding: '1.25rem',
                }}
              >
                {/* Menu Tabs Navigation */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '0.25rem',
                  }}
                >
                  <button
                    onClick={() => {
                      playSound('click');
                      setSettingsSubTab('config');
                    }}
                    style={{
                      flex: 1,
                      background:
                        settingsSubTab === 'config'
                          ? 'var(--accent-color)'
                          : 'transparent',
                      border: 'none',
                      color:
                        settingsSubTab === 'config'
                          ? '#000'
                          : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⚙️ Ajustes
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setSettingsSubTab('profile');
                    }}
                    style={{
                      flex: 1,
                      background:
                        settingsSubTab === 'profile'
                          ? 'var(--accent-color)'
                          : 'transparent',
                      border: 'none',
                      color:
                        settingsSubTab === 'profile'
                          ? '#000'
                          : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                    }}
                  >
                    👤 Conta
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setSettingsSubTab('tools');
                    }}
                    style={{
                      flex: 1,
                      background:
                        settingsSubTab === 'tools'
                          ? 'var(--accent-color)'
                          : 'transparent',
                      border: 'none',
                      color:
                        settingsSubTab === 'tools'
                          ? '#000'
                          : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                    }}
                  >
                    🛠️ Ferramentas
                  </button>
                </div>

                {settingsSubTab === 'config' ? (
                  // --- AJUSTES / CONFIGURAÇÕES TAB ---
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    {/* Seletor de Temas */}
                    <div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          display: 'block',
                          marginBottom: '0.35rem',
                          fontWeight: 600,
                        }}
                      >
                        🎨 TEMA NEON VISUAL
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.3rem',
                        }}
                      >
                        {(
                          [
                            'meganeon',
                            'cyberpunk',
                            'matrix',
                            'dracula',
                            'ice',
                          ] as ThemeType[]
                        ).map((t) => (
                          <button
                            key={t}
                            className={`theme-pill-btn ${theme === t ? 'active' : ''}`}
                            onClick={() => {
                              if (t === 'meganeon' || isPro) {
                                setTheme(t);
                              } else {
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={
                              t === 'cyberpunk'
                                ? ({
                                    '--accent-color': '#ff007f',
                                    '--accent-glow': 'rgba(255,0,127,0.3)',
                                  } as React.CSSProperties)
                                : t === 'matrix'
                                  ? ({
                                      '--accent-color': '#00ff41',
                                      '--accent-glow': 'rgba(0,255,65,0.3)',
                                    } as React.CSSProperties)
                                  : t === 'dracula'
                                    ? ({
                                        '--accent-color': '#ff79c6',
                                        '--accent-glow':
                                          'rgba(255,121,198,0.3)',
                                      } as React.CSSProperties)
                                    : t === 'ice'
                                      ? ({
                                          '--accent-color': '#00e5ff',
                                          '--accent-glow':
                                            'rgba(0,229,255,0.3)',
                                        } as React.CSSProperties)
                                      : ({
                                          '--accent-color': '#00e676',
                                          '--accent-glow':
                                            'rgba(0,230,118,0.3)',
                                        } as React.CSSProperties)
                            }
                          >
                            {t === 'meganeon' ? 'MEGA-GREEN' : t.toUpperCase()}
                            {t !== 'meganeon' && !isPro && ' 👑'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amostragem de Concursos */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          display: 'block',
                          marginBottom: '0.35rem',
                          fontWeight: 600,
                        }}
                      >
                        📊 AMOSTRAGEM DE CONCURSOS
                      </span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {([10, 30, 50, 100] as number[]).map((limit) => (
                          <button
                            key={limit}
                            className={`theme-pill-btn ${historyLimit === limit ? 'active' : ''}`}
                            onClick={() => {
                              if (limit === 30 || isPro) {
                                playSound('click');
                                setHistoryLimit(limit);
                              } else {
                                setShowUpgradeModal(true);
                              }
                            }}
                            style={{ flex: 1, textAlign: 'center' }}
                          >
                            {limit} Jogos
                            {limit !== 30 && !isPro && ' 👑'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Efeitos Sonoros & Alertas */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={enableSounds}
                          onChange={(e) => {
                            setEnableSounds(e.target.checked);
                            if (e.target.checked) {
                              setTimeout(() => {
                                try {
                                  const AudioContextClass =
                                    getAudioContextClass();
                                  if (AudioContextClass) {
                                    const ctx = new AudioContextClass();
                                    const osc = ctx.createOscillator();
                                    const gain = ctx.createGain();
                                    osc.connect(gain);
                                    gain.connect(ctx.destination);
                                    osc.type = 'sine';
                                    osc.frequency.setValueAtTime(
                                      600,
                                      ctx.currentTime
                                    );
                                    osc.frequency.exponentialRampToValueAtTime(
                                      1200,
                                      ctx.currentTime + 0.1
                                    );
                                    gain.gain.setValueAtTime(
                                      0.04,
                                      ctx.currentTime
                                    );
                                    gain.gain.exponentialRampToValueAtTime(
                                      0.001,
                                      ctx.currentTime + 0.1
                                    );
                                    osc.start();
                                    osc.stop(ctx.currentTime + 0.1);
                                  }
                                } catch {}
                              }, 50);
                            }
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--accent-color)',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                        >
                          🔊 Efeitos Sonoros Sintéticos (Web Audio)
                        </span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={emailAlerts}
                          onChange={handleToggleEmailAlerts}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--accent-color)',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                        >
                          📧 Alertas de Resultados por E-mail
                        </span>
                      </label>

                      {emailAlertFeedback && (
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: '#00e676',
                            fontWeight: 'bold',
                          }}
                        >
                          {emailAlertFeedback}
                        </div>
                      )}

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={showInRanking}
                          onChange={async (e) => {
                            const val = e.target.checked;
                            setShowInRanking(val);
                            try {
                              await fetchWithCsrf('/api/ranking', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ show_in_ranking: val }),
                              });
                            } catch {}
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--accent-color)',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                        >
                          🏆 Aparecer no Ranking Geral
                        </span>
                      </label>
                    </div>

                    {/* Tour Guiado */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.5rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <button
                        onClick={() => {
                          playSound('click');
                          setShowSettings(false);
                          setShowTutorial(true);
                          setTutorialStep(0);
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid #00f0ff',
                          color: '#00f0ff',
                          fontSize: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 10px rgba(0, 240, 255, 0.15)',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        🚀 INICIAR TOUR ONBOARDING
                      </button>
                    </div>

                    {/* Reset de Fábrica */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '0.5rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <button
                        onClick={handleFactoryReset}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 23, 68, 0.1)',
                          border: '1px solid #ff1744',
                          color: '#ff1744',
                          fontSize: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 10px rgba(255, 23, 68, 0.15)',
                          transition: 'background 0.2s',
                        }}
                      >
                        ⚠️ RESETAR APLICATIVO
                      </button>
                    </div>
                  </div>
                ) : settingsSubTab === 'profile' ? (
                  // --- PERFIL / CONTA TAB ---
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                    }}
                  >
                    {user ? (
                      <>
                        {/* Form de Edição de Perfil */}
                        <form
                          onSubmit={handleUpdateProfile}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0',
                            background: 'rgba(255,255,255,0.01)',
                            borderRadius: '10px',
                            border: '1px solid var(--glass-border)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Header */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0.75rem',
                              borderBottom: '1px solid var(--glass-border)',
                              background: 'rgba(0,240,255,0.03)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--accent-color)',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              👤 Editar Dados
                            </span>
                            {profileFeedback && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  color: profileFeedback.includes('✓')
                                    ? '#00e676'
                                    : '#ff1744',
                                  fontWeight: 'bold',
                                }}
                              >
                                {profileFeedback}
                              </span>
                            )}
                          </div>

                          {/* Seção: Identidade */}
                          <div
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                              }}
                            >
                              Identidade
                            </div>

                            {/* Avatar + Name row */}
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.6rem',
                                alignItems: 'flex-start',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.15rem',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '1.5rem',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,240,255,0.08)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {profileAvatar}
                                </div>
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  {['👤', '🤖', '🧙‍♂️', '👽', '🚀', '👑'].map(
                                    (av) => (
                                      <button
                                        type="button"
                                        key={av}
                                        onClick={() => {
                                          playSound('click');
                                          setProfileAvatar(av);
                                        }}
                                        style={{
                                          fontSize: '0.65rem',
                                          width: '18px',
                                          height: '18px',
                                          borderRadius: '50%',
                                          background:
                                            profileAvatar === av
                                              ? 'var(--accent-color)'
                                              : 'rgba(0,0,0,0.3)',
                                          border:
                                            profileAvatar === av
                                              ? '1px solid var(--accent-color)'
                                              : '1px solid rgba(255,255,255,0.05)',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.15s',
                                          padding: 0,
                                        }}
                                      >
                                        {av}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.3rem',
                                }}
                              >
                                <div>
                                  <label
                                    style={{
                                      fontSize: '0.55rem',
                                      color: 'var(--text-muted)',
                                      display: 'block',
                                      marginBottom: '0.1rem',
                                    }}
                                  >
                                    E-mail
                                  </label>
                                  <input
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    style={{
                                      background: 'rgba(0,0,0,0.15)',
                                      border:
                                        '1px solid rgba(255,255,255,0.04)',
                                      borderRadius: '4px',
                                      color: 'var(--text-muted)',
                                      fontSize: '0.65rem',
                                      padding: '0.25rem 0.4rem',
                                      width: '100%',
                                      cursor: 'not-allowed',
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    style={{
                                      fontSize: '0.55rem',
                                      color: 'var(--text-muted)',
                                      display: 'block',
                                      marginBottom: '0.1rem',
                                    }}
                                  >
                                    Nome completo
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={profileName}
                                    onChange={(e) =>
                                      setProfileName(e.target.value)
                                    }
                                    placeholder="Seu nome"
                                    style={{
                                      background: 'rgba(0,0,0,0.3)',
                                      border: '1px solid var(--glass-border)',
                                      borderRadius: '4px',
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      padding: '0.25rem 0.4rem',
                                      width: '100%',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Seção: Documentos */}
                          <div
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                              }}
                            >
                              Documentos
                            </div>
                            <label
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginBottom: '0.1rem',
                              }}
                            >
                              CPF/CNPJ
                            </label>
                            <input
                              type="text"
                              value={profileCpfCnpj}
                              onChange={(e) =>
                                setProfileCpfCnpj(e.target.value)
                              }
                              placeholder="Obrigatório para pagamentos"
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.65rem',
                                padding: '0.25rem 0.4rem',
                                width: '100%',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.5rem',
                                color: 'rgba(255,255,255,0.25)',
                                display: 'block',
                                marginTop: '0.15rem',
                              }}
                            >
                              Pertence a quem vai pagar o Pix.
                            </span>
                          </div>

                          {/* Seção: Localização */}
                          <div
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                              }}
                            >
                              Localização
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <div style={{ flex: 2 }}>
                                <label
                                  style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    display: 'block',
                                    marginBottom: '0.1rem',
                                  }}
                                >
                                  Cidade
                                </label>
                                <input
                                  type="text"
                                  value={profileCity}
                                  onChange={(e) =>
                                    setProfileCity(e.target.value)
                                  }
                                  placeholder="Sua cidade"
                                  style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    padding: '0.25rem 0.4rem',
                                    width: '100%',
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label
                                  style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    display: 'block',
                                    marginBottom: '0.1rem',
                                  }}
                                >
                                  Estado
                                </label>
                                <select
                                  value={profileState}
                                  onChange={(e) =>
                                    setProfileState(e.target.value)
                                  }
                                  style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    padding: '0.25rem 0.4rem',
                                    width: '100%',
                                    outline: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option
                                    value=""
                                    style={{ background: '#111' }}
                                  >
                                    UF
                                  </option>
                                  {[
                                    'AC',
                                    'AL',
                                    'AP',
                                    'AM',
                                    'BA',
                                    'CE',
                                    'DF',
                                    'ES',
                                    'GO',
                                    'MA',
                                    'MT',
                                    'MS',
                                    'MG',
                                    'PA',
                                    'PB',
                                    'PR',
                                    'PE',
                                    'PI',
                                    'RJ',
                                    'RN',
                                    'RS',
                                    'RO',
                                    'RR',
                                    'SC',
                                    'SP',
                                    'SE',
                                    'TO',
                                  ].map((uf) => (
                                    <option
                                      key={uf}
                                      value={uf}
                                      style={{ background: '#111' }}
                                    >
                                      {uf}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Seção: Segurança */}
                          <div
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                              }}
                            >
                              Segurança
                            </div>
                            <label
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginBottom: '0.1rem',
                              }}
                            >
                              Nova senha{' '}
                              <span style={{ opacity: 0.5 }}>
                                (deixe vazio para manter)
                              </span>
                            </label>
                            <input
                              type="password"
                              value={profilePassword}
                              onChange={(e) =>
                                setProfilePassword(e.target.value)
                              }
                              placeholder="Mínimo 6 caracteres"
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.65rem',
                                padding: '0.25rem 0.4rem',
                                width: '100%',
                              }}
                            />
                          </div>

                          {/* Seção: Preferências */}
                          <div
                            style={{
                              padding: '0.6rem 0.75rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.4rem',
                                fontWeight: 600,
                              }}
                            >
                              Preferências
                            </div>
                            <label
                              style={{
                                fontSize: '0.55rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginBottom: '0.1rem',
                              }}
                            >
                              Loteria Favorita
                            </label>
                            <select
                              value={profileFavLottery}
                              onChange={(e) =>
                                setProfileFavLottery(e.target.value)
                              }
                              style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.65rem',
                                padding: '0.25rem 0.4rem',
                                width: '100%',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option
                                value="megasena"
                                style={{ background: '#111' }}
                              >
                                Mega-Sena
                              </option>
                              <option
                                value="lotofacil"
                                style={{ background: '#111' }}
                              >
                                Lotofácil
                              </option>
                              <option
                                value="quina"
                                style={{ background: '#111' }}
                              >
                                Quina
                              </option>
                              <option
                                value="lotomania"
                                style={{ background: '#111' }}
                              >
                                Lotomania
                              </option>
                            </select>
                          </div>

                          {/* Botão Salvar */}
                          <div style={{ padding: '0.6rem 0.75rem' }}>
                            <button
                              type="submit"
                              disabled={profileLoading}
                              style={{
                                background: 'var(--accent-color)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                width: '100%',
                                cursor: profileLoading
                                  ? 'not-allowed'
                                  : 'pointer',
                                boxShadow: '0 0 10px var(--accent-glow)',
                                opacity: profileLoading ? 0.7 : 1,
                                transition: 'all 0.2s',
                              }}
                            >
                              {profileLoading ? 'Salvando...' : 'Salvar Perfil'}
                            </button>
                          </div>
                        </form>

                        {/* Stats & Plan Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              background: 'rgba(0, 240, 255, 0.04)',
                              border: '1px solid rgba(0, 240, 255, 0.1)',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.6rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Jogos Salvos
                            </div>
                            <strong
                              style={{ fontSize: '1.1rem', color: 'white' }}
                            >
                              {savedGames.length}
                            </strong>
                          </div>
                          <div
                            style={{
                              background: 'rgba(255, 0, 127, 0.04)',
                              border: '1px solid rgba(255, 0, 127, 0.1)',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.6rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Plano Ativo
                            </div>
                            <strong
                              style={{
                                fontSize: '0.75rem',
                                color:
                                  user.role === 'pro'
                                    ? '#00e676'
                                    : 'var(--text-muted)',
                                display: 'block',
                                marginTop: '0.2rem',
                              }}
                            >
                              {user.role?.toUpperCase() || 'FREE'}
                            </strong>
                            {user.role === 'pro' && user.premium_until && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  color: 'var(--text-muted)',
                                  display: 'block',
                                  marginTop: '0.15rem',
                                }}
                              >
                                Expira:{' '}
                                {new Date(
                                  user.premium_until
                                ).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Upgrade Banner for FREE users */}
                        {user.role !== 'pro' && user.role !== 'admin' && (
                          <div
                            onClick={() => {
                              setShowUpgradeModal(true);
                              setShowSettings(false);
                            }}
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(255, 0, 127, 0.15) 0%, rgba(255, 214, 0, 0.15) 100%)',
                              border: '1px solid #ff007f',
                              borderRadius: '10px',
                              padding: '0.65rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 0 10px rgba(255, 0, 127, 0.25)',
                              transition: 'transform 0.2s',
                            }}
                            className="hover-scale"
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'white',
                                display: 'block',
                              }}
                            >
                              👑 UPGRADE PARA PREMIUM PRO
                            </span>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                marginTop: '0.1rem',
                              }}
                            >
                              Desbloqueie desdobramentos combinatórios e
                              fechamentos avançados
                            </span>
                          </div>
                        )}

                        {/* Account Actions / Danger Zone Side-by-Side */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.4rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '0.6rem',
                            marginTop: '0.1rem',
                          }}
                        >
                          <button
                            onClick={handleLogout}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--glass-border)',
                              color: 'white',
                              fontSize: '0.68rem',
                              padding: '0.45rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            Sair da Conta
                          </button>

                          <button
                            onClick={handleDeleteAccount}
                            style={{
                              background: 'rgba(255, 23, 68, 0.08)',
                              border: '1px solid rgba(255, 23, 68, 0.4)',
                              color: '#ff1744',
                              fontSize: '0.68rem',
                              padding: '0.45rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'rgba(255, 23, 68, 0.18)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                'rgba(255, 23, 68, 0.08)';
                            }}
                          >
                            ⚠️ Excluir Conta
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                          }}
                        >
                          Sua sessão não está ativa.
                        </span>
                        <Link
                          href="/login?next=/app"
                          className="btn-action"
                          style={{
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                          }}
                        >
                          Entrar novamente
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  // --- FERRAMENTAS TAB ---
                  <ToolsPanel playSound={playSound} />
                )}
              </div>
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

                            {renderVolante('filter', [], toggleFilterNumber)}

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
            {showUpgradeModal && (
              <Suspense fallback={<TabFallback />}>
                <UpgradeModal
                  priceMonthly={priceMonthly}
                  checkoutLoading={checkoutLoading}
                  checkoutError={checkoutError}
                  paymentData={paymentData}
                  paymentStatus={paymentStatus}
                  pixCopied={pixCopied}
                  onStartPixCheckout={() => handleStartCheckout('pixgo')}
                  onStartStripeCheckout={() => handleStartCheckout('stripe')}
                  onSimulatePayment={handleSimulatePaymentConfirm}
                  onCopyPix={(text) => {
                    navigator.clipboard.writeText(text);
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 2000);
                  }}
                  onClose={() => {
                    setShowUpgradeModal(false);
                    if (pollingIntervalId) {
                      clearInterval(pollingIntervalId);
                      setPollingIntervalId(null);
                    }
                    setPaymentData(null);
                    setPaymentStatus(null);
                    setCheckoutError(null);
                  }}
                />
              </Suspense>
            )}

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
