'use client';

import { Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCleanDezenas as getCleanDezenasHelper } from '../../../lib/lottery-helpers';
import {
  downloadPDF,
  downloadTXT,
  printGames,
} from '../../../lib/lottery-exports';
import { fetchWithCsrf } from '@/lib/fetch';
import SavedGamesPanel from '../../components/SavedGamesPanel';
import Loading from '../loading';

export default function SavedPage() {
  const app = useApp();
  const [selectedForPool, setSelectedForPool] = useState<string[]>([]);
  const [bolaoText, setBolaoText] = useState('');

  const getCleanDezenas = (r: Parameters<typeof getCleanDezenasHelper>[0]) =>
    getCleanDezenasHelper(r, app.activeLottery);
  const playSound = () => undefined;
  const handleDeleteGame = async (gameId: string) => {
    const response = await fetchWithCsrf(
      `/api/games?id=${encodeURIComponent(gameId)}`,
      { method: 'DELETE' }
    );
    if (response.ok) await app.fetchSavedGames();
  };

  return (
    <Suspense fallback={<Loading />}>
      <SavedGamesPanel
        savedGames={app.savedGames}
        selectedForPool={selectedForPool}
        setSelectedForPool={setSelectedForPool}
        setBolaoText={setBolaoText}
        latestResultsMap={{}}
        getCleanDezenas={getCleanDezenas}
        handleDeleteGame={handleDeleteGame}
        downloadTXT={(games, suffix) =>
          downloadTXT(games, app.activeLottery, playSound, suffix)
        }
        downloadPDF={(games, title) =>
          downloadPDF(games, app.activeLottery, playSound, title)
        }
        handlePrintGames={(games) =>
          printGames(games, app.activeLottery, playSound)
        }
        isPro={app.isPro}
        bolaoCotas="5"
        setBolaoCotas={() => {}}
        bolaoTaxa="0"
        setBolaoTaxa={() => {}}
        setShowUpgradeModal={app.setShowUpgradeModal}
        handleBuildBolao={() => {}}
        bolaoText={bolaoText}
        handleCopyText={() => {}}
        copyFeedback=""
        bolaoShareUrl=""
      />
    </Suspense>
  );
}
