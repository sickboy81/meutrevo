'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import { getCleanDezenas } from '../../../lib/lottery-helpers';
import ResultsTab from '../../components/ResultsTab';
import Loading from '../loading';

export default function ResultsPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      {app.result ? (
        <ResultsTab
          result={app.result}
          config={app.config}
          getCleanDezenas={(r) => getCleanDezenas(r, app.activeLottery)}
          activeLottery={app.activeLottery}
          customConcurso={app.customConcurso}
          setCustomConcurso={app.setCustomConcurso}
          fetchResult={app.fetchResult}
          showRateio={false}
          setShowRateio={() => {}}
          history={app.history}
        />
      ) : (
        <Loading />
      )}
    </Suspense>
  );
}
