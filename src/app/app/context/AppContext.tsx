'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchWithCsrf } from '@/lib/fetch';
import { LOTTERY_CONFIGS } from '../../../lib/lottery-math';
import type { LotteryResult, User, SavedGame, ThemeType } from '../../types';

type ViewMode = 'landing' | 'app';

export interface AppState {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  savedGames: SavedGame[];
  setSavedGames: React.Dispatch<React.SetStateAction<SavedGame[]>>;
  activeLottery: string;
  setActiveLottery: (id: string) => void;
  config: (typeof LOTTERY_CONFIGS)[string];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  result: LotteryResult | null;
  history: LotteryResult[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  customConcurso: string;
  setCustomConcurso: (v: string) => void;
  fetchResult: (
    lotteryId: string,
    contestNum?: string
  ) => Promise<LotteryResult | null>;
  fetchSavedGames: () => Promise<void>;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  historyLimit: number;
  setHistoryLimit: (n: number) => void;
  enableSounds: boolean;
  setEnableSounds: (v: boolean) => void;
  showInRanking: boolean;
  setShowInRanking: (v: boolean) => void;
  emailAlerts: boolean;
  setEmailAlerts: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  activeFaqIndex: number | null;
  setActiveFaqIndex: (n: number | null) => void;
  isPro: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [activeLottery, setActiveLottery] = useState('megasena');
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [customConcurso, setCustomConcurso] = useState('');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [historyLimit, setHistoryLimit] = useState(30);
  const [enableSounds, setEnableSounds] = useState(true);
  const [showInRanking, setShowInRanking] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const config = LOTTERY_CONFIGS[activeLottery] || LOTTERY_CONFIGS['megasena'];
  const isPro = user?.role === 'pro' || user?.role === 'admin';

  const fetchSavedGames = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/games');
      if (res.ok) {
        const data = await res.json();
        setSavedGames(data.games || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          fetchSavedGames();
          return data.user;
        }
      }
      setUser(null);
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [fetchSavedGames]);

  const fetchResult = useCallback(
    async (lotteryId: string, contestNum?: string) => {
      setLoading(true);
      try {
        const url = contestNum
          ? `/api/loteria/${lotteryId}?contest=${contestNum}`
          : `/api/loteria/${lotteryId}?limit=50`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.lottery) {
          setResult(data.lottery);
          setHistory(data.history || []);
          return data.lottery;
        }
        return null;
      } catch (e) {
        console.error(e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResult(activeLottery);
  }, [activeLottery, fetchResult]);

  const value: AppState = {
    user,
    setUser,
    savedGames,
    setSavedGames,
    activeLottery,
    setActiveLottery,
    config,
    viewMode,
    setViewMode,
    result,
    history,
    loading,
    setLoading,
    customConcurso,
    setCustomConcurso,
    fetchResult,
    fetchSavedGames,
    theme,
    setTheme,
    historyLimit,
    setHistoryLimit,
    enableSounds,
    setEnableSounds,
    showInRanking,
    setShowInRanking,
    emailAlerts,
    setEmailAlerts,
    showSettings,
    setShowSettings,
    showUpgradeModal,
    setShowUpgradeModal,
    activeFaqIndex,
    setActiveFaqIndex,
    isPro,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
