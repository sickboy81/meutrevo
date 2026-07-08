import type { Metadata } from 'next';
import '../app.css';
import '../responsive.css';

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
