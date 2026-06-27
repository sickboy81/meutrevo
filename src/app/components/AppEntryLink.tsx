'use client';

import Link from 'next/link';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type AppEntryLinkProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  style?: CSSProperties;
};

export default function AppEntryLink({
  children,
  href = '/app',
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
    window.location.assign(href);
  };

  return (
    <Link href={href} className={className} style={style} onClick={handleClick}>
      {children}
    </Link>
  );
}
