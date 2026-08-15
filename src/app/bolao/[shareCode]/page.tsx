import type { Metadata } from 'next';
import Link from 'next/link';
import PublicPoolView from '@/app/components/PublicPoolView';

type Props = { params: Promise<{ shareCode: string }> };

export const metadata: Metadata = {
  title: 'Bolão compartilhado',
  description: 'Confira publicamente o resumo de um bolão do Meu Trevo.',
  robots: { index: false, follow: false },
};

export default async function PublicPoolPage({ params }: Props) {
  const { shareCode } = await params;
  return (
    <main
      className="landing-shell"
      style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem' }}
    >
      <Link href="/" className="theme-pill-btn">
        Meu Trevo
      </Link>
      <PublicPoolView shareCode={shareCode} />
    </main>
  );
}
