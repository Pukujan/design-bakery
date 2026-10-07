import { useQuery } from "@tanstack/react-query";
import { FEED_URL, parseFeed, type Feed } from "@/lib/feed";

/**
 * The page reads exactly one public JSON document. No key, no backend,
 * nothing is ever sent anywhere.
 */
export function useFeed() {
  return useQuery<Feed, Error>({
    queryKey: ["ire-feed", FEED_URL],
    queryFn: async () => {
      const response = await fetch(FEED_URL, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`The feed answered with HTTP ${response.status}.`);
      }
      const json: unknown = await response.json();
      return parseFeed(json);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
