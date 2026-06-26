import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Redefinir senha | Meu Trevo',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
