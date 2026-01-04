import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Youtube, Film } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";
import { CRTModelViewer } from "@/components/CRTModelViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { useAddToHistory } from "@/hooks/useLibraryApi";
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "@/stores/library";

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
  const hasRecordedRef = useRef(false);

  // Get video info from route state
  const state = location.state as PlayerState | null;
  const youtubeUrl = state?.youtubeUrl;
  const adIds = state?.adIds || [];
  const videoTitle = state?.videoTitle;
  const thumbnailUrl = state?.thumbnailUrl;

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
        <CRTModelViewer videoUrl={youtubeUrl} />
      </div>

      {/* Ad injection notice (placeholder for future) */}
      {adIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-amber-500/20 backdrop-blur-md rounded-lg px-6 py-3 border border-amber-500/30 text-center">
            <p className="text-amber-300 text-sm flex items-center gap-2">
              <Film className="w-4 h-4" />
              {adIds.length} ad{adIds.length > 1 ? 's' : ''} ready for playback
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
