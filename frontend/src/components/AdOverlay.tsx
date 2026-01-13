import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdScheduleItem } from "@/stores/playback";

interface AdOverlayProps {
  ad: AdScheduleItem;
  totalAds: number;
  currentAdIndex: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function AdOverlay({ ad, totalAds, currentAdIndex, onComplete, onSkip }: AdOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Reset state when ad changes
    setElapsed(0);
    setCanSkip(false);

    // Enable skip after 5 seconds
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 5000);

    // Auto-play the ad
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Failed to auto-play ad:", err);
      });
    }

    return () => clearTimeout(skipTimer);
  }, [ad.adId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setElapsed(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    onComplete();
  };

  const handleSkipClick = () => {
    if (canSkip) {
      onSkip();
    }
  };

  const progress = ad.duration > 0 ? (elapsed / ad.duration) * 100 : 0;
  const remainingTime = Math.max(0, ad.duration - elapsed);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-50 bg-black flex items-center justify-center"
      >
        {/* Video Player */}
        <video
          ref={videoRef}
          src={ad.adUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          playsInline
          autoPlay
        />

        {/* CRT Overlay Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15)_0px,rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] animate-scanline" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        {/* Ad Info Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-none">
          {/* Ad Counter */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="bg-black/60 backdrop-blur-sm border-white/20 text-white pointer-events-auto">
              <Film className="w-3 h-3 mr-1" />
              Ad {currentAdIndex + 1} of {totalAds}
            </Badge>
          </motion.div>

          {/* Match Score */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Badge
              variant="outline"
              className="bg-black/60 backdrop-blur-sm border-white/20 text-white pointer-events-auto"
            >
              {Math.round(ad.matchScore * 100)}% match
            </Badge>
          </motion.div>
        </div>

        {/* Skip Button */}
        <motion.div
          className="absolute top-4 right-4"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkipClick}
            disabled={!canSkip}
            className="bg-black/60 backdrop-blur-sm border-white/20 hover:bg-black/80 disabled:opacity-40 pointer-events-auto"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            {canSkip ? "Skip Ad" : `Skip in ${Math.ceil(5 - elapsed)}s`}
          </Button>
        </motion.div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 pointer-events-none">
          {/* Match Reason */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1"
          >
            <p className="text-xs text-white/60 line-clamp-2">
              {ad.matchReason}
            </p>
          </motion.div>

          {/* Time Remaining */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-white/60 font-mono">
              {Math.floor(remainingTime)}s
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
