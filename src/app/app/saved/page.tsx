'use client';

import { Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCleanDezenas as getCleanDezenasHelper } from '../../../lib/lottery-helpers';
import {
  buildBolaoText,
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
  const [bolaoCotas, setBolaoCotas] = useState('5');
  const [bolaoTaxa, setBolaoTaxa] = useState('0');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [bolaoShareUrl, setBolaoShareUrl] = useState('');

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
  const handleBuildBolao = () => {
    const selectedGames = app.savedGames.filter((game) =>
      selectedForPool.includes(game.id)
    );
    if (selectedGames.length === 0) return;
    const result = buildBolaoText(
      selectedGames,
      bolaoCotas,
      bolaoTaxa,
      app.isPro
    );
    setBolaoText(result.text);
    setBolaoShareUrl(result.shareUrl);
  };
  const handleCopyText = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(type === 'url' ? 'Link copiado.' : 'Texto copiado.');
      window.setTimeout(() => setCopyFeedback(''), 2500);
    } catch {
      setCopyFeedback('Não foi possível copiar.');
    }
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
        bolaoCotas={bolaoCotas}
        setBolaoCotas={setBolaoCotas}
        bolaoTaxa={bolaoTaxa}
        setBolaoTaxa={setBolaoTaxa}
        setShowUpgradeModal={app.setShowUpgradeModal}
        handleBuildBolao={handleBuildBolao}
        bolaoText={bolaoText}
        handleCopyText={handleCopyText}
        copyFeedback={copyFeedback}
        bolaoShareUrl={bolaoShareUrl}
      />
    </Suspense>
  );
}
