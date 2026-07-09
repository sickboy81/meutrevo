'use client';

import { Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import { getCleanDezenas as getCleanDezenasHelper } from '../../../lib/lottery-helpers';
import SavedGamesPanel from '../../components/SavedGamesPanel';
import Loading from '../loading';

export default function SavedPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);
  const [selectedForPool, setSelectedForPool] = useState<string[]>([]);
  const [bolaoText, setBolaoText] = useState('');

  const getCleanDezenas = (r: Parameters<typeof getCleanDezenasHelper>[0]) =>
    getCleanDezenasHelper(r, app.activeLottery);

  const latestResultsMap: Record<string, (typeof app.history)[0]> = {};
  app.history.forEach((r) => {
    if (!latestResultsMap[r.loteria]) latestResultsMap[r.loteria] = r;
  });

  return (
    <Suspense fallback={<Loading />}>
      <SavedGamesPanel
        savedGames={app.savedGames}
        selectedForPool={selectedForPool}
        setSelectedForPool={setSelectedForPool}
        setBolaoText={setBolaoText}
        latestResultsMap={latestResultsMap}
        getCleanDezenas={getCleanDezenas}
        handleDeleteGame={async () => {}}
        downloadTXT={() => {}}
        downloadPDF={() => {}}
        handlePrintGames={() => {}}
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
