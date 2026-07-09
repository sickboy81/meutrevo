'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import RankingPanel from '../../components/RankingPanel';
import Loading from '../loading';

export default function RankingPage() {
  const app = useApp();

  return (
    <Suspense fallback={<Loading />}>
      <RankingPanel user={app.user} />
    </Suspense>
  );
}
