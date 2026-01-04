import { useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/ui/navigation";
import { useAds, useWatchHistory } from "@/hooks/useLibraryApi";
import { useLibraryStore } from "@/stores/library";
import { MyAdsCard } from "@/components/library/MyAdsCard";
import { WatchHistoryCard } from "@/components/library/WatchHistoryCard";
import { WatchNowCard } from "@/components/library/WatchNowCard";
import { Library as LibraryIcon } from "lucide-react";

export default function Library() {
  const { data: adsData, isLoading: isLoadingAds } = useAds();
  const { data: historyData, isLoading: isLoadingHistory } = useWatchHistory();
  const { setAds, setWatchHistory, setIsLoadingAds, setIsLoadingHistory } = useLibraryStore();

  // Sync fetched data to store
  useEffect(() => {
    if (adsData) {
      setAds(adsData);
    }
  }, [adsData, setAds]);

  useEffect(() => {
    if (historyData) {
      setWatchHistory(historyData);
    }
  }, [historyData, setWatchHistory]);

  useEffect(() => {
    setIsLoadingAds(isLoadingAds);
  }, [isLoadingAds, setIsLoadingAds]);

  useEffect(() => {
    setIsLoadingHistory(isLoadingHistory);
  }, [isLoadingHistory, setIsLoadingHistory]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <LibraryIcon className="w-8 h-8" />
            Library
          </h1>
          <p className="text-muted-foreground">
            Upload ads, manage your watch history, and start watching
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Ads Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <MyAdsCard />
          </motion.div>

          {/* Watch History Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <WatchHistoryCard />
          </motion.div>

          {/* Watch Now Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <WatchNowCard />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
