import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Tv, ScreenShare } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";
import { CRTModelViewer } from "@/components/CRTModelViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getChannelById, type Channel } from "@/data/channels";
import { useEffect, useState } from "react";

function ChannelNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Navigation />
      <div className="text-center">
        <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Channel Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The channel you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate('/channels')}>
          Back to Channel Guide
        </Button>
      </div>
    </div>
  );
}

function ChannelInfoOverlay({ channel }: { channel: Channel }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sci-fi':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'comedy':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'music':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'game-shows':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'screen-capture':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

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
        <Badge className={`mb-2 ${getCategoryColor(channel.category)}`}>
          {channel.category === 'screen-capture' ? (
            <><ScreenShare className="w-3 h-3" /> Screen Capture</>
          ) : (
            <><Tv className="w-3 h-3" /> {channel.category}</>
          )}
        </Badge>
        <h2 className="text-lg font-semibold text-white mb-1">{channel.name}</h2>
        <p className="text-sm text-white/70">{channel.description}</p>
        {channel.showtimes && channel.showtimes.length > 0 && (
          <p className="text-xs text-white/50 mt-2">
            Showtimes: {channel.showtimes.join(', ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Player() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const channel = channelId ? getChannelById(channelId) : undefined;

  if (!channel) {
    return <ChannelNotFound />;
  }

  // For screen capture mode, we don't pass a video URL
  // The CRTModelViewer will show controls to start screen capture
  const videoUrl = channel.mediaType === 'video' ? channel.videoUrl : undefined;

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
          onClick={() => navigate('/channels')}
          className="bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Channels
        </Button>
      </motion.div>

      {/* Channel Info Overlay */}
      <ChannelInfoOverlay channel={channel} />

      {/* Full viewport CRT viewer */}
      <div className="fixed inset-x-0 top-20 bottom-0 z-40">
        {channel.mediaType === 'screen-capture' ? (
          // Screen capture mode - show CRT without video, user can start capture
          <CRTModelViewer videoUrl="/movie.webm" />
        ) : (
          // Video mode - play the channel's video
          <CRTModelViewer videoUrl={videoUrl} />
        )}
      </div>

      {/* Screen Capture Instructions (only for screen-capture mode) */}
      {channel.mediaType === 'screen-capture' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-cyan-500/20 backdrop-blur-md rounded-lg px-6 py-3 border border-cyan-500/30 text-center">
            <p className="text-cyan-300 text-sm">
              Click the <ScreenShare className="w-4 h-4 inline mx-1" /> button below to capture your screen
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
