import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type AdStatus = 'uploaded' | 'processing' | 'ready' | 'error'

export interface Ad {
  id: string
  user_id: string
  file_name: string
  file_url: string
  storage_path: string
  file_size: number
  status: AdStatus
  created_at: string
}

export interface WatchHistoryEntry {
  id: string
  user_id: string
  youtube_url: string
  video_title: string | null
  thumbnail_url: string | null
  watched_at: string
  ad_ids: string[]
}

interface LibraryState {
  // Data
  ads: Ad[]
  watchHistory: WatchHistoryEntry[]

  // Selection state for Watch Now
  selectedAdIds: string[]
  youtubeUrl: string

  // Loading states
  isLoadingAds: boolean
  isLoadingHistory: boolean
  isUploading: boolean
  uploadProgress: number

  // Actions
  setAds: (ads: Ad[]) => void
  addAd: (ad: Ad) => void
  removeAd: (id: string) => void
  setWatchHistory: (history: WatchHistoryEntry[]) => void
  addToHistory: (entry: WatchHistoryEntry) => void
  removeFromHistory: (id: string) => void
  toggleAdSelection: (id: string) => void
  selectAllAds: () => void
  clearSelectedAds: () => void
  setYoutubeUrl: (url: string) => void
  setIsLoadingAds: (loading: boolean) => void
  setIsLoadingHistory: (loading: boolean) => void
  setIsUploading: (uploading: boolean) => void
  setUploadProgress: (progress: number) => void
  reset: () => void
}

const initialState = {
  ads: [] as Ad[],
  watchHistory: [] as WatchHistoryEntry[],
  selectedAdIds: [] as string[],
  youtubeUrl: '',
  isLoadingAds: false,
  isLoadingHistory: false,
  isUploading: false,
  uploadProgress: 0,
}

export const useLibraryStore = create<LibraryState>()(
  devtools(
    (set) => ({
      ...initialState,

      setAds: (ads) => set({ ads }),

      addAd: (ad) => set((state) => ({
        ads: [ad, ...state.ads]
      })),

      removeAd: (id) => set((state) => ({
        ads: state.ads.filter(a => a.id !== id),
        selectedAdIds: state.selectedAdIds.filter(aid => aid !== id)
      })),

      setWatchHistory: (watchHistory) => set({ watchHistory }),

      addToHistory: (entry) => set((state) => ({
        watchHistory: [entry, ...state.watchHistory]
      })),

      removeFromHistory: (id) => set((state) => ({
        watchHistory: state.watchHistory.filter(h => h.id !== id)
      })),

      toggleAdSelection: (id) => set((state) => ({
        selectedAdIds: state.selectedAdIds.includes(id)
          ? state.selectedAdIds.filter(aid => aid !== id)
          : [...state.selectedAdIds, id]
      })),

      selectAllAds: () => set((state) => ({
        selectedAdIds: state.ads.map(ad => ad.id)
      })),

      clearSelectedAds: () => set({ selectedAdIds: [] }),

      setYoutubeUrl: (youtubeUrl) => set({ youtubeUrl }),

      setIsLoadingAds: (isLoadingAds) => set({ isLoadingAds }),

      setIsLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),

      setIsUploading: (isUploading) => set({ isUploading }),

      setUploadProgress: (uploadProgress) => set({ uploadProgress }),

      reset: () => set(initialState),
    }),
    { name: 'library-store' }
  )
)

// Utility function to extract YouTube video ID from URL
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Get YouTube thumbnail URL from video ID
export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

// Validate if URL is a valid YouTube URL
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null
}
