import type { MouseEvent, ReactNode } from 'react';

type StaticDemoLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Full-page navigation to static HTML demos (bypasses SPA client routing). */
export function StaticDemoLink({ href, className, children }: StaticDemoLinkProps) {
  const openDemo = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.assign(href);
  };

  return (
    <a className={className} href={href} onClick={openDemo}>
      {children}
    </a>
  );
}
