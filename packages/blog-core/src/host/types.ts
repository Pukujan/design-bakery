import type { ReactNode } from 'react';

export type BlogHostConfig = {
  /** Public blog base path, e.g. `/blogs` */
  basePath: string;
  /** Express/Railway API origin (no trailing slash) */
  apiBaseUrl: string;
  getAuthHeaders?: () => Promise<Record<string, string>>;
  navigate: (path: string) => void;
};

export type BlogHostContextValue = BlogHostConfig & {
  pathTo: (suffix?: string) => string;
};

export type BlogHostProviderProps = {
  config: BlogHostConfig;
  children: ReactNode;
};
