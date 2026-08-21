import type { Metadata } from 'next';
import { Orbitron, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import './app.css';
import './landing.css';
import './responsive.css';
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
    default: 'Meu Trevo - Resultados e organização de jogos da Caixa',
    template: '%s | Meu Trevo',
  },
  description:
    'Acompanhe resultados oficiais, planeje jogos dentro do orçamento e confira suas combinações das loterias da Caixa.',
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
    'organização de jogos de loteria',
    'meu trevo',
  ],
  authors: [{ name: 'Meu Trevo' }],
  creator: 'Meu Trevo',
  publisher: 'Meu Trevo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.meutrevo.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Meu Trevo - Resultados e organização de jogos da Caixa',
    description:
      'Resultados oficiais, análise histórica e fechamentos combinatórios para organizar jogos da Caixa.',
    url: 'https://www.meutrevo.com',
    siteName: 'Meu Trevo',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og/meutrevo',
        width: 1200,
        height: 630,
        alt: 'Meu Trevo - Resultados e estratégia para loterias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meu Trevo - Gerador Estatístico de Loterias',
    description:
      'Resultados oficiais e desdobramentos combinatórios para organizar seus jogos.',
    images: ['/og/meutrevo'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
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
