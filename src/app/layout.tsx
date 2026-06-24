import type { Metadata } from 'next';
import { Orbitron, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import LgpdBanner from './components/LgpdBanner';
import PWARegistrar from './components/PWARegistrar';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-numbers',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Meu Trevo - Resultados & Gerador Estatístico de Loterias',
    template: '%s | Meu Trevo',
  },
  description:
    'Resultados em tempo real das Loterias da Caixa (Mega-Sena, Lotofácil, Quina) e gerador de jogos com estatísticas, fechamentos matemáticos e desdobramentos.',
  keywords: [
    'loterias',
    'mega-sena',
    'lotofácil',
    'quina',
    'lotomania',
    'gerador de loteria',
    'desdobramento matemático',
    'fechamentos',
    'resultados da caixa',
    'estatística lotérica',
    'palpites de loteria',
    'meu trevo',
  ],
  authors: [{ name: 'Meu Trevo Team' }],
  creator: 'Meu Trevo',
  publisher: 'Meu Trevo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://meutrevo.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Meu Trevo - Assistente Lotérico Inteligente & Resultados da Caixa',
    description:
      'Resultados em tempo real e gerador de apostas baseado em inteligência estatística e fechamentos matemáticos reais.',
    url: 'https://meutrevo.com.br',
    siteName: 'Meu Trevo',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meu Trevo - Gerador Estatístico de Loterias',
    description:
      'Resultados em tempo real e desdobramentos combinatórios otimizados.',
    creator: '@meutrevo',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  themeColor: '#00f0ff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${orbitron.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className={inter.className}>
        <PWARegistrar />
        {children}
        <LgpdBanner />
      </body>
    </html>
  );
}
