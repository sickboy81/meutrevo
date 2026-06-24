import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meu Trevo - Assistente Lotérico Inteligente',
    short_name: 'Meu Trevo',
    description:
      'Resultados em tempo real, gerador de apostas e estatísticas de loterias da Caixa.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#08080f',
    theme_color: '#00f0ff',
    categories: ['finance', 'entertainment', 'utilities'],
    lang: 'pt-BR',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
