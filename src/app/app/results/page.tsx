'use client';

import { Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCleanDezenas } from '../../../lib/lottery-helpers';
import ResultsTab from '../../components/ResultsTab';
import Loading from '../loading';

export default function ResultsPage() {
  const app = useApp();
  const [showRateio, setShowRateio] = useState(false);

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
          showRateio={showRateio}
          setShowRateio={setShowRateio}
          history={app.history}
        />
      ) : (
        <Loading />
      )}
    </Suspense>
  );
}
