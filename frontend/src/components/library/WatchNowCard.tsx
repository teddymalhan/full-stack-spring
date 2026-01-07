import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  useLibraryStore,
  extractYoutubeVideoId,
  getYoutubeThumbnailUrl,
  isValidYoutubeUrl,
} from "@/stores/library";
import { fetchYoutubeVideoInfo, useAnalyzeVideo, type VideoAnalysisResult } from "@/hooks/useLibraryApi";
import { Play, Youtube, FileVideo, AlertCircle, Loader2, Check, Sparkles, Clock, TrendingUp } from "lucide-react";

export function WatchNowCard() {
  const navigate = useNavigate();
  const {
    ads,
    youtubeUrl,
    selectedAdIds,
    setYoutubeUrl,
    toggleAdSelection,
    selectAllAds,
    clearSelectedAds,
  } = useLibraryStore();

  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    thumbnailUrl: string;
  } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysisResult | null>(null);

  const videoId = extractYoutubeVideoId(youtubeUrl);
  const isValidUrl = isValidYoutubeUrl(youtubeUrl);
  const analyzeVideoMutation = useAnalyzeVideo();

  // Fetch video info when URL changes
  useEffect(() => {
    if (!isValidUrl) {
      setVideoInfo(null);
      return;
    }

    setIsLoadingInfo(true);
    fetchYoutubeVideoInfo(youtubeUrl)
      .then((info) => {
        setVideoInfo(info);
        setUrlError(null);
      })
      .catch(() => {
        setVideoInfo(null);
        setUrlError("Could not fetch video info");
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  }, [youtubeUrl, isValidUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setUrlError(null);

    if (url && !isValidYoutubeUrl(url)) {
      setUrlError("Please enter a valid YouTube URL");
    }
  };

  const handleStartWatching = () => {
    if (!isValidUrl) return;

    navigate("/player", {
      state: {
        youtubeUrl,
        adIds: selectedAdIds,
        videoTitle: videoInfo?.title,
        thumbnailUrl: videoInfo?.thumbnailUrl || (videoId ? getYoutubeThumbnailUrl(videoId) : null),
      },
    });
  };

  const handleAnalyzeVideo = async () => {
    if (!isValidUrl) return;

    try {
      const result = await analyzeVideoMutation.mutateAsync(youtubeUrl);
      setVideoAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const allSelected = ads.length > 0 && selectedAdIds.length === ads.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Watch Now
        </CardTitle>
        <CardDescription>
          Enter a YouTube URL and select ads to play
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* YouTube URL Input */}
        <div className="space-y-2">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={handleUrlChange}
              className="pl-10"
            />
          </div>
          {urlError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {urlError}
            </p>
          )}
        </div>

        {/* Video Preview */}
        {isValidUrl && (
          <div className="rounded-lg overflow-hidden bg-muted">
            {isLoadingInfo ? (
              <div className="aspect-video flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : videoInfo ? (
              <div>
                <div className="relative aspect-video">
                  <img
                    src={videoInfo.thumbnailUrl}
                    alt={videoInfo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{videoInfo.title}</p>
                </div>
              </div>
            ) : videoId ? (
              <div>
                <div className="relative aspect-video">
                  <img
                    src={getYoutubeThumbnailUrl(videoId)}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        <Separator />

        {/* Ad Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Ads to Play</Label>
            {ads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? clearSelectedAds : selectAllAds}
                className="h-7 text-xs"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          <ScrollArea className="h-[120px]">
            {ads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <FileVideo className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  No ads available
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload some ads first
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ads.map((ad) => (
                  <label
                    key={ad.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAdIds.includes(ad.id)}
                      onCheckedChange={() => toggleAdSelection(ad.id)}
                    />
                    <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{ad.file_name}</span>
                    {selectedAdIds.includes(ad.id) && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Video Analysis Section */}
        {isValidUrl && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Video Analysis
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeVideo}
                  disabled={analyzeVideoMutation.isPending}
                  className="h-8"
                >
                  {analyzeVideoMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {analyzeVideoMutation.isError && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Analysis failed. Please try again.
                  </p>
                </div>
              )}

              {videoAnalysis && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(videoAnalysis.durationSeconds)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {videoAnalysis.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {videoAnalysis.categories.map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {videoAnalysis.adBreakSuggestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Suggested Ad Break Points
                      </p>
                      <ScrollArea className="h-[80px]">
                        <div className="space-y-1.5">
                          {videoAnalysis.adBreakSuggestions
                            .sort((a, b) => b.priority - a.priority)
                            .slice(0, 5)
                            .map((suggestion, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded bg-background">
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {formatDuration(suggestion.timestamp)}
                                </Badge>
                                <span className="text-muted-foreground flex-1 truncate">
                                  {suggestion.reason}
                                </span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  Priority: {suggestion.priority}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Start Watching Button */}
        <Button
          onClick={handleStartWatching}
          disabled={!isValidUrl}
          className="w-full"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Watching
          {selectedAdIds.length > 0 && (
            <span className="ml-2 text-xs opacity-75">
              ({selectedAdIds.length} ad{selectedAdIds.length > 1 ? "s" : ""})
            </span>
          )}
        </Button>

        {!isValidUrl && youtubeUrl && (
          <p className="text-xs text-center text-muted-foreground">
            Enter a valid YouTube URL to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}
