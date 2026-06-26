import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'App | Meu Trevo',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
