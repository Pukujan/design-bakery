import { useMemo } from 'react';
import { getAuthApiBaseUrl } from '@/lib/adminToken';

export function useCoverStudioHttpConfig() {
  return useMemo(
    () => ({
      getBaseUrl: () => getAuthApiBaseUrl() ?? '',
      getAuthHeaders: async () => {
        const { getAdminAccessToken } = await import('@/lib/adminToken');
        const token = getAdminAccessToken();
        if (!token) throw new Error('Sign in to admin first.');
        return { Authorization: `Bearer ${token}` };
      },
    }),
    [],
  );
}
