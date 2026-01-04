import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLibraryStore, type WatchHistoryEntry, extractYoutubeVideoId, getYoutubeThumbnailUrl } from "@/stores/library";
import { useDeleteHistoryEntry } from "@/hooks/useLibraryApi";
import { History, Trash2, Loader2, Play, Clock } from "lucide-react";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface HistoryItemProps {
  entry: WatchHistoryEntry;
  onDelete: (id: string) => void;
  onRewatch: (entry: WatchHistoryEntry) => void;
  isDeleting: boolean;
}

function HistoryItem({ entry, onDelete, onRewatch, isDeleting }: HistoryItemProps) {
  const videoId = extractYoutubeVideoId(entry.youtube_url);
  const thumbnailUrl = entry.thumbnail_url || (videoId ? getYoutubeThumbnailUrl(videoId) : null);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
      {/* Thumbnail */}
      <button
        onClick={() => onRewatch(entry)}
        className="relative shrink-0 w-24 h-14 rounded overflow-hidden bg-muted"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={entry.video_title || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 text-white" />
        </div>
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {entry.video_title || "Untitled Video"}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(entry.watched_at)}</span>
        </div>
        {entry.ad_ids && entry.ad_ids.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {entry.ad_ids.length} ad{entry.ad_ids.length > 1 ? "s" : ""} used
          </p>
        )}
      </div>

      {/* Actions */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(entry.id)}
        disabled={isDeleting}
        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

export function WatchHistoryCard() {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { watchHistory, isLoadingHistory } = useLibraryStore();
  const deleteEntry = useDeleteHistoryEntry();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteEntry.mutateAsync(id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRewatch = (entry: WatchHistoryEntry) => {
    // Navigate to player with the video URL
    navigate("/player", {
      state: {
        youtubeUrl: entry.youtube_url,
        adIds: entry.ad_ids || [],
      },
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Watch History
        </CardTitle>
        <CardDescription>
          Your recently watched videos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px] pr-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : watchHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No watch history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start watching to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchHistory.map((entry) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onRewatch={handleRewatch}
                  isDeleting={deletingId === entry.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
