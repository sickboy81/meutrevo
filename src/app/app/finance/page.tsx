'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import FinanceTab from '../../components/FinanceTab';
import Loading from '../loading';

export default function FinancePage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      <FinanceTab
        isPro={app.isPro}
        playSound={playSound}
        setShowUpgradeModal={app.setShowUpgradeModal}
      />
    </Suspense>
  );
}
