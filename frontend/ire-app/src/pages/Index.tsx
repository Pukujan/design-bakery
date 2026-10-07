import { Dashboard } from "@/components/Dashboard";
import { FeedError } from "@/components/FeedError";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import { useFeed } from "@/hooks/use-feed";
import { showError, showSuccess } from "@/utils/toast";

const Index = () => {
  const { data: feed, isLoading, isFetching, isError, error, refetch } = useFeed();

  const handleRefresh = () => {
    refetch()
      .then((result) => {
        if (result.status === "success") {
          showSuccess("Feed re-read.");
        } else {
          showError(result.error?.message ?? "Could not re-read the feed.");
        }
      })
      .catch(() => showError("Could not re-read the feed."));
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-[1320px] overflow-hidden px-4 pb-16 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <FeedError
            message={error?.message ?? "The feed could not be read."}
            onRetry={handleRefresh}
            retrying={isFetching}
          />
        ) : feed ? (
          <Dashboard feed={feed} onRefresh={handleRefresh} refreshing={isFetching} />
        ) : (
          <FeedSkeleton />
        )}
      </main>
    </div>
  );
};

export default Index;
