'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import SavedGamesPanel from '../../components/SavedGamesPanel';
import Loading from '../loading';

export default function SavedPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      <SavedGamesPanel
        savedGames={app.savedGames}
        setSavedGames={app.setSavedGames}
        activeLottery={app.activeLottery}
        config={app.config}
        isPro={app.isPro}
        playSound={playSound}
        setShowUpgradeModal={app.setShowUpgradeModal}
        history={app.history}
      />
    </Suspense>
  );
}
