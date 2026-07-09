'use client';

import { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { useSound } from '../../hooks/useSound';
import ToolsPanel from '../../components/ToolsPanel';
import Loading from '../loading';

export default function ToolsPage() {
  const app = useApp();
  const playSound = useSound(app.enableSounds);

  return (
    <Suspense fallback={<Loading />}>
      <ToolsPanel playSound={playSound} />
    </Suspense>
  );
}
