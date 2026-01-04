import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useLibraryStore, type Ad, type AdStatus } from "@/stores/library";
import { useUploadAd, useDeleteAd } from "@/hooks/useLibraryApi";
import { Film, Upload, Trash2, Loader2, FileVideo, AlertCircle } from "lucide-react";

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

function getStatusBadge(status: AdStatus) {
  switch (status) {
    case "uploaded":
      return <Badge variant="secondary">Uploaded</Badge>;
    case "processing":
      return <Badge variant="outline" className="animate-pulse">Processing</Badge>;
    case "ready":
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Ready</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return null;
  }
}

interface AdItemProps {
  ad: Ad;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AdItem({ ad, onDelete, isDeleting }: AdItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="shrink-0">
        <FileVideo className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{ad.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(ad.file_size)}</span>
          <span>-</span>
          <span>{formatDate(ad.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(ad.status)}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(ad.id)}
          disabled={isDeleting}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function MyAdsCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { ads, isLoadingAds, uploadProgress } = useLibraryStore();
  const uploadAd = useUploadAd();
  const deleteAd = useDeleteAd();

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

  return (
    <Card className="h-full">
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
        <ScrollArea className="h-[300px] pr-4">
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
                  isDeleting={deletingId === ad.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>

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
