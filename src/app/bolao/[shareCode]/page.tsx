import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

type BolaoData = {
  lottery_name: string;
  contest_num: string | null;
  games: string[][];
  cotas: number;
  taxa: number;
  summary: string;
  created_at: string;
};

const esc = (t: string) =>
  t.replace(
    /[<>&"']/g,
    (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  );

async function fetchBolao(
  shareCode: string
): Promise<{ data: BolaoData | null; error: string | null }> {
  try {
    const h = await headers();
    const base = `${h.get('x-forwarded-proto') || 'http'}://${h.get('host') || 'localhost'}`;
    const res = await fetch(
      `${base}/api/boloes/public/${encodeURIComponent(shareCode)}`,
      { cache: 'no-store' }
    );
    const j = await res.json();
    if (!res.ok || !j.success)
      return { data: null, error: j.error || 'Bolão não encontrado.' };
    return {
      data: {
        lottery_name: j.lottery_name || 'Loteria',
        contest_num: j.contest_num ?? null,
        games: j.games ?? [],
        cotas: j.cotas ?? 1,
        taxa: j.taxa ?? 0,
        summary: j.summary ?? '',
        created_at: j.created_at ?? '',
      },
      error: null,
    };
  } catch {
    return { data: null, error: 'Não foi possível carregar este bolão.' };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}): Promise<Metadata> {
  const { shareCode } = await params;
  const { data } = await fetchBolao(shareCode);
  const n = data?.lottery_name || 'compartilhado';
  return {
    title: `Bolão Meu Trevo - ${n}`,
    description: data
      ? `Confira o bolão de ${n} criado no Meu Trevo.`
      : 'Bolão compartilhado no Meu Trevo.',
    robots: { index: false, follow: false },
  };
}

const css = {
  ball: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#1e293b,#0f172a)',
    border: '2px solid var(--accent-color)',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
    fontFamily: 'var(--font-numbers)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  label: {
    color: 'var(--accent-color)',
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  sub: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  } as React.CSSProperties,
};

export default async function PublicPoolPage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = await params;
  const { data, error } = await fetchBolao(shareCode);

  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `Bolão ${data.lottery_name}${data.contest_num ? ` - Concurso ${data.contest_num}` : ''}`,
        description:
          data.summary ||
          `Bolão compartilhado de ${data.lottery_name} no Meu Trevo.`,
        organizer: { '@type': 'Organization', name: 'Meu Trevo' },
      }
    : null;

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: '100vh',
      }}
    >
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <Link
        href="/"
        style={{
          color: 'var(--accent-color)',
          textDecoration: 'none',
          fontSize: '0.8rem',
        }}
      >
        ← Meu Trevo
      </Link>

      {error ? (
        <section
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 12,
            padding: '2rem 1.5rem',
            marginTop: '1.5rem',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.5rem',
            }}
          >
            Bolão indisponível
          </h1>
          <p style={css.sub}>{esc(error)}</p>
        </section>
      ) : data ? (
        <section
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1.5rem',
            marginTop: '1.5rem',
          }}
        >
          <p style={css.label}>Conferência coletiva</p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.25rem',
            }}
          >
            Bolão Meu Trevo – {esc(data.lottery_name)}
          </h1>

          {data.contest_num && (
            <p style={{ ...css.sub, marginTop: '0.15rem' }}>
              Concurso {esc(data.contest_num)}
            </p>
          )}

          {data.games.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {data.games.map((game, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--glass-border)',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-numbers)',
                      minWidth: 22,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}.
                  </span>
                  {game.map((n, j) => (
                    <span key={j} style={css.ball}>
                      {n}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginTop: '1rem',
              alignItems: 'center',
            }}
          >
            <span style={css.sub}>
              <strong style={{ color: 'var(--text-main)' }}>
                {data.cotas}
              </strong>{' '}
              cota{data.cotas !== 1 ? 's' : ''}
            </span>
            {data.taxa > 0 && (
              <span style={css.sub}>
                Taxa:{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {data.taxa}%
                </strong>
              </span>
            )}
          </div>

          {data.summary && (
            <p style={{ ...css.sub, marginTop: '0.75rem', lineHeight: 1.5 }}>
              {esc(data.summary)}
            </p>
          )}
          {data.created_at && (
            <p style={{ ...css.sub, marginTop: '0.75rem', fontSize: '0.8rem' }}>
              Criado em {new Date(data.created_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          <a
            href="https://meutrevo.com"
            style={{
              display: 'inline-block',
              marginTop: '1.25rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-color)',
              color: '#000',
              fontWeight: 700,
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Criar meu bolão
          </a>
        </section>
      ) : null}
    </main>
  );
}
