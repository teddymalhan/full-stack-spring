import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ad_pending' | 'ad_playing' | 'resuming'

export interface AdScheduleItem {
  adId: string
  adUrl: string
  insertAt: number
  duration: number
  matchScore: number
  matchReason: string
  played?: boolean
}

interface PlaybackState {
  // Playback state
  status: PlaybackStatus
  currentTime: number
  videoDuration: number

  // Ad scheduling
  adSchedule: AdScheduleItem[]
  currentAd: AdScheduleItem | null
  resumePosition: number

  // YouTube player reference (will be set from component)
  youtubePlayer: any | null

  // Actions
  setStatus: (status: PlaybackStatus) => void
  setCurrentTime: (time: number) => void
  setVideoDuration: (duration: number) => void
  setAdSchedule: (schedule: AdScheduleItem[]) => void
  setYoutubePlayer: (player: any) => void

  // Ad playback control
  startAd: (ad: AdScheduleItem, resumePosition: number) => void
  completeAd: () => void
  skipAd: () => void

  // Check if we should trigger an ad at current time
  checkAdTrigger: (currentTime: number) => AdScheduleItem | null

  // Reset state
  reset: () => void
}

const initialState = {
  status: 'idle' as PlaybackStatus,
  currentTime: 0,
  videoDuration: 0,
  adSchedule: [],
  currentAd: null,
  resumePosition: 0,
  youtubePlayer: null,
}

export const usePlaybackStore = create<PlaybackState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setStatus: (status) => set({ status }),

      setCurrentTime: (time) => set({ currentTime: time }),

      setVideoDuration: (duration) => set({ videoDuration: duration }),

      setAdSchedule: (schedule) =>
        set({
          adSchedule: schedule.map(ad => ({ ...ad, played: false }))
        }),

      setYoutubePlayer: (player) => set({ youtubePlayer: player }),

      startAd: (ad, resumePosition) =>
        set({
          status: 'ad_playing',
          currentAd: ad,
          resumePosition,
        }),

      completeAd: () => {
        const { currentAd, adSchedule } = get()
        if (currentAd) {
          // Mark ad as played
          const updatedSchedule = adSchedule.map(ad =>
            ad.adId === currentAd.adId ? { ...ad, played: true } : ad
          )
          set({
            adSchedule: updatedSchedule,
            currentAd: null,
            status: 'resuming',
          })
        }
      },

      skipAd: () => {
        const { currentAd, adSchedule } = get()
        if (currentAd) {
          // Mark ad as played (even though skipped)
          const updatedSchedule = adSchedule.map(ad =>
            ad.adId === currentAd.adId ? { ...ad, played: true } : ad
          )
          set({
            adSchedule: updatedSchedule,
            currentAd: null,
            status: 'resuming',
          })
        }
      },

      checkAdTrigger: (currentTime) => {
        const { adSchedule, status, currentAd } = get()

        // Don't trigger if already playing an ad or not in playing state
        if (status !== 'playing' || currentAd) {
          return null
        }

        // Find next unplayed ad that should trigger at current time
        const nextAd = adSchedule.find(
          ad => !ad.played && Math.abs(ad.insertAt - currentTime) < 0.5
        )

        return nextAd || null
      },

      reset: () => set(initialState),
    }),
    { name: 'playback-store' }
  )
)
