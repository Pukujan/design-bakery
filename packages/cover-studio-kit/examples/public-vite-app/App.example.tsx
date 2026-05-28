import { PublicCoverStudioApp } from '@design-bakery/cover-studio-kit/client';

/**
 * Public (non-admin) app shell — same UI as design-bakery Cover Studio,
 * without AdminLayout or portfolio routing.
 */
export default function App() {
  return (
    <PublicCoverStudioApp
      apiBaseUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:8787'}
      // Optional: return {} for a public API with no JWT
      getAuthHeaders={async () => {
        const token = sessionStorage.getItem('studio_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
      }}
    />
  );
}
