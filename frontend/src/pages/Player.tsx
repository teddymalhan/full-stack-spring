import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Youtube, Film, Loader2 } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";
import { CRTModelViewer } from "@/components/CRTModelViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { useAddToHistory, useMatchAdsToVideo, type AdScheduleItem } from "@/hooks/useLibraryApi";
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "@/stores/library";
import { usePlaybackStore } from "@/stores/playback";

interface PlayerState {
  youtubeUrl: string;
  adIds?: string[];
  videoTitle?: string;
  thumbnailUrl?: string;
}

function NoVideoSelected() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Navigation />
      <div className="text-center">
        <Youtube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Video Selected</h1>
        <p className="text-muted-foreground mb-6">
          Go to the Library to select a YouTube video to watch.
        </p>
        <Button onClick={() => navigate('/library')}>
          Go to Library
        </Button>
      </div>
    </div>
  );
}

interface VideoInfoOverlayProps {
  title?: string;
  adCount: number;
}

function VideoInfoOverlay({ title, adCount }: VideoInfoOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-24 left-4 z-50 pointer-events-none"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div
        className="bg-black/70 backdrop-blur-md rounded-lg p-4 max-w-xs border border-white/10 pointer-events-auto"
        onMouseEnter={() => setIsVisible(true)}
      >
        <Badge className="mb-2 bg-red-500/20 text-red-300 border-red-500/30">
          <Youtube className="w-3 h-3 mr-1" /> YouTube
        </Badge>
        {title && (
          <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2">{title}</h2>
        )}
        {adCount > 0 && (
          <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
            <Film className="w-3 h-3" />
            {adCount} ad{adCount > 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Player() {
  const location = useLocation();
  const navigate = useNavigate();
  const addToHistory = useAddToHistory();
  const matchAds = useMatchAdsToVideo();
  const hasRecordedRef = useRef(false);
  const [adSchedule, setAdSchedule] = useState<AdScheduleItem[]>([]);
  const { startAd, adSchedule: storeSchedule } = usePlaybackStore();

  // Get video info from route state
  const state = location.state as PlayerState | null;
  const youtubeUrl = state?.youtubeUrl;
  const adIds = state?.adIds || [];
  const videoTitle = state?.videoTitle;
  const thumbnailUrl = state?.thumbnailUrl;

  // Match ads to video when player loads
  const hasMatchedRef = useRef(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    // Only call once
    if (youtubeUrl && adIds.length > 0 && !hasMatchedRef.current) {
      hasMatchedRef.current = true;
      setIsMatching(true);
      console.log("Calling match API with:", { youtubeUrl, adIds });

      matchAds.mutate(
        {
          youtubeUrl,
          adIds,
          maxAds: 3,
        },
        {
          onSuccess: (data) => {
            console.log("Match API success:", data);
            setAdSchedule(data.schedule);
            setIsMatching(false);
          },
          onError: (error) => {
            console.error("Match API failed:", error);
            setIsMatching(false);
          },
        }
      );
    }
  }, [youtubeUrl, adIds, matchAds]);

  // Record to watch history when the player loads
  useEffect(() => {
    if (youtubeUrl && !hasRecordedRef.current) {
      hasRecordedRef.current = true;

      const videoId = extractYoutubeVideoId(youtubeUrl);
      const thumbnail = thumbnailUrl || (videoId ? getYoutubeThumbnailUrl(videoId) : null);

      addToHistory.mutate({
        youtube_url: youtubeUrl,
        video_title: videoTitle || null,
        thumbnail_url: thumbnail,
        ad_ids: adIds,
      });
    }
  }, [youtubeUrl, videoTitle, thumbnailUrl, adIds, addToHistory]);

  const handleTriggerAd = () => {
    // Use store schedule if available, otherwise use first ad from local schedule
    if (storeSchedule.length > 0) {
      const nextAd = storeSchedule.find(ad => !ad.played);
      if (nextAd) {
        console.log("Triggering ad from store:", nextAd);
        startAd(nextAd, 0);
      }
    } else if (adSchedule.length > 0) {
      // First time - just play the first ad
      console.log("Triggering first ad:", adSchedule[0]);
      startAd(adSchedule[0], 0);
    }
  };

  // Count unplayed ads
  const unplayedCount = storeSchedule.length > 0
    ? storeSchedule.filter(ad => !ad.played).length
    : adSchedule.length;

  if (!youtubeUrl) {
    return <NoVideoSelected />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-24 left-4 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/library')}
          className="bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Library
        </Button>
      </motion.div>

      {/* Video Info Overlay */}
      <VideoInfoOverlay title={videoTitle} adCount={adIds.length} />

      {/* Full viewport CRT viewer with YouTube video */}
      <div className="fixed inset-x-0 top-20 bottom-0 z-40">
        {matchAds.isPending && adIds.length > 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-white text-lg">Matching ads to video...</p>
              <p className="text-white/60 text-sm mt-2">Analyzing content and building schedule</p>
            </div>
          </div>
        ) : (
          <CRTModelViewer videoUrl={youtubeUrl} adSchedule={adSchedule} />
        )}
      </div>

      {/* Debug info - always visible */}
      <div className="fixed top-32 right-4 z-50 bg-black/80 p-3 rounded text-xs text-white font-mono space-y-1">
        <div>adIds: {adIds.length}</div>
        <div>adSchedule: {adSchedule.length}</div>
        <div>storeSchedule: {storeSchedule.length}</div>
        <div>unplayedCount: {unplayedCount}</div>
        <div>isMatching: {isMatching ? 'true' : 'false'}</div>
        <div>isPending: {matchAds.isPending ? 'true' : 'false'}</div>
        <div>isError: {matchAds.isError ? 'true' : 'false'}</div>
        <div>isSuccess: {matchAds.isSuccess ? 'true' : 'false'}</div>
        {matchAds.error && (
          <div className="text-red-400">Error: {String(matchAds.error)}</div>
        )}
      </div>

      {/* Ad trigger button - ALWAYS show if we have adIds */}
      {adIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50"
        >
          <button
            onClick={handleTriggerAd}
            disabled={adSchedule.length === 0}
            className="bg-amber-500/30 backdrop-blur-md rounded-lg px-6 py-3 border-2 border-amber-500 hover:bg-amber-500/50 transition-colors cursor-pointer shadow-lg disabled:opacity-50"
          >
            <p className="text-amber-300 text-sm font-bold flex items-center gap-2">
              <Film className="w-5 h-5" />
              {adSchedule.length === 0
                ? "⏳ Loading ads..."
                : `👉 PLAY AD (${unplayedCount} ready)`}
            </p>
          </button>
        </motion.div>
      )}
    </div>
  );
}
