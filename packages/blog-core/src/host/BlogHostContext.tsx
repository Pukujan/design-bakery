import { createContext, useCallback, useContext, useMemo } from 'react';
import type { BlogHostContextValue, BlogHostProviderProps } from './types.js';

const BlogHostContext = createContext<BlogHostContextValue | null>(null);

export function BlogHostProvider({ config, children }: BlogHostProviderProps) {
  const base = config.basePath.replace(/\/$/, '') || '';

  const pathTo = useCallback(
    (suffix = '') => {
      const s = suffix.startsWith('/') ? suffix : suffix ? `/${suffix}` : '';
      return `${base}${s}`;
    },
    [base],
  );

  const value = useMemo<BlogHostContextValue>(
    () => ({
      ...config,
      pathTo,
    }),
    [config, pathTo],
  );

  return <BlogHostContext.Provider value={value}>{children}</BlogHostContext.Provider>;
}

export function useBlogHost(): BlogHostContextValue {
  const ctx = useContext(BlogHostContext);
  if (!ctx) {
    throw new Error('useBlogHost must be used within BlogHostProvider');
  }
  return ctx;
}
