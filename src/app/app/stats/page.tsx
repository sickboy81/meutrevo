'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import StatsTab from '../../components/StatsTab';
import Loading from '../loading';

export default function StatsPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      <StatsTab
        history={app.history}
        activeLottery={app.activeLottery}
        statsData={null}
        isPro={app.isPro}
        playSound={playSound}
        setShowUpgradeModal={app.setShowUpgradeModal}
      />
    </Suspense>
  );
}
