import { ImageResponse } from 'next/og';
import { isLotterySeoId, LOTTERY_SEO_CONFIGS } from '@/lib/lottery-seo';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lottery: string }> }
) {
  const { lottery } = await params;
  const contest = new URL(request.url).searchParams.get('contest');
  const config = isLotterySeoId(lottery) ? LOTTERY_SEO_CONFIGS[lottery] : null;
  const name = config?.name ?? 'Meu Trevo';
  const title = contest
    ? `Resultado do Concurso ${contest}`
    : (config?.title ?? 'Resultados e Estratégia para Loterias');
  const color = config?.color ?? '#00e5ff';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #05050d 0%, #0a1120 55%, #120817 100%)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        padding: '72px 80px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: color,
          opacity: 0.18,
          filter: 'blur(75px)',
          right: '-120px',
          top: '-180px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          border: `2px solid ${color}`,
          opacity: 0.35,
          right: '70px',
          bottom: '-170px',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '2px',
          }}
        >
          <span style={{ color: '#5cffb0', fontSize: '42px' }}>♣</span>
          <span>MEU TREVO</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '880px',
            gap: '18px',
          }}
        >
          <span
            style={{
              color,
              fontSize: '28px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: '62px',
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: '-2px',
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: '25px', color: '#b8c7de' }}>
            Resultados oficiais, concursos recentes e análise estatística.
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#8da2bf',
            fontSize: '22px',
          }}
        >
          <span>meutrevo.com</span>
          <span style={{ color }}>RESULTADOS + ESTRATÉGIA</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    }
  );
}
