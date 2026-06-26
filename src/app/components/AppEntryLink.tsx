'use client';

import Link from 'next/link';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type AppEntryLinkProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function AppEntryLink({
  children,
  className,
  style,
}: AppEntryLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign('/app');
  };

  return (
    <Link href="/app" className={className} style={style} onClick={handleClick}>
      {children}
    </Link>
  );
}
