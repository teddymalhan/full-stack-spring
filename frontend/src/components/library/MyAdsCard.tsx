import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLibraryStore, type Ad, type AnalysisStatus } from "@/stores/library";
import { useUploadAd, useDeleteAd, useAnalyzeAd } from "@/hooks/useLibraryApi";
import { Film, Upload, Trash2, Loader2, FileVideo, AlertCircle, Sparkles, Brain, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAnalysisStatusBadge(status: AnalysisStatus | null | undefined) {
  switch (status) {
    case "analyzing":
      return (
        <Badge variant="outline" className="animate-pulse gap-1">
          <Brain className="w-3 h-3" />
          Analyzing
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 gap-1">
          <Sparkles className="w-3 h-3" />
          Analyzed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    case "pending":
    default:
      // Default to pending for null/undefined/pending
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
}

interface AdItemProps {
  ad: Ad;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
  isDeleting: boolean;
  isAnalyzing: boolean;
}

function AdItem({ ad, onDelete, onAnalyze, isDeleting, isAnalyzing }: AdItemProps) {
  const hasMetadata = ad.metadata && ad.analysis_status === "completed";
  const canAnalyze = ad.analysis_status !== "analyzing";

  return (
    <TooltipProvider>
      <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2">
        {/* Top row: icon, filename, action buttons */}
        <div className="flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium truncate flex-1 min-w-0">{ad.file_name}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAnalyze(ad.id)}
                disabled={!canAnalyze || isAnalyzing}
                className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
              >
                {isAnalyzing || ad.analysis_status === "analyzing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ad.analysis_status === "completed" ? "Re-analyze" : "Analyze"}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(ad.id)}
            disabled={isDeleting}
            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
        {/* Bottom row: metadata and badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(ad.file_size)}</span>
            <span>-</span>
            <span>{formatDate(ad.created_at)}</span>
          </div>
          {getAnalysisStatusBadge(ad.analysis_status)}
        </div>
        {/* Categories row (if analyzed) */}
        {hasMetadata && ad.metadata?.categories && ad.metadata.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.metadata.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded"
              >
                {cat}
              </span>
            ))}
            {ad.metadata.categories.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded cursor-help">
                    +{ad.metadata.categories.length - 3}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{ad.metadata.categories.slice(3).join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export function MyAdsCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const { ads, isLoadingAds, uploadProgress } = useLibraryStore();
  const uploadAd = useUploadAd();
  const deleteAd = useDeleteAd();
  const analyzeAd = useAnalyzeAd();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    try {
      await uploadAd.mutateAsync(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAd.mutateAsync(id);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      await analyzeAd.mutateAsync(id);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to start analysis. Please try again.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Card className="h-full min-w-[320px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          My Ads
        </CardTitle>
        <CardDescription>
          Upload and manage your ad videos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAd.isPending}
            className="w-full"
          >
            {uploadAd.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Ad
              </>
            )}
          </Button>
          {uploadAd.isPending && (
            <Progress value={uploadProgress} className="mt-2" />
          )}
        </div>

        {/* Ads List */}
        <div className="h-[300px] overflow-y-auto">
          {isLoadingAds ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileVideo className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No ads uploaded yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your first ad to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ads.map((ad) => (
                <AdItem
                  key={ad.id}
                  ad={ad}
                  onDelete={handleDelete}
                  onAnalyze={handleAnalyze}
                  isDeleting={deletingId === ad.id}
                  isAnalyzing={analyzingId === ad.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error state */}
        {uploadAd.isError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Upload failed. Please try again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
