'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import StatsTab from '../../components/StatsTab';
import Loading from '../loading';

const emptyStats = {
  frequencyMap: {} as Record<number, number>,
  hotNumbers: [] as { num: number; count: number }[],
  coldNumbers: [] as { num: number; delay: number }[],
  avgSum: 0,
  evenPct: 0,
};

export default function StatsPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      <StatsTab
        history={app.history}
        activeLottery={app.activeLottery}
        statsData={emptyStats}
        isPro={app.isPro}
        playSound={playSound}
        setShowUpgradeModal={app.setShowUpgradeModal}
      />
    </Suspense>
  );
}
