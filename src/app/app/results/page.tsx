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
      ) : app.resultError ? (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <strong style={{ color: '#ffd600' }}>
            Não foi possível carregar os resultados
          </strong>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {app.resultError}
          </p>
          <button
            type="button"
            className="theme-pill-btn active"
            onClick={() => void app.fetchResult(app.activeLottery)}
            disabled={app.loading}
          >
            {app.loading ? 'Tentando novamente...' : 'Tentar novamente'}
          </button>
        </div>
      ) : (
        <Loading />
      )}
    </Suspense>
  );
}
