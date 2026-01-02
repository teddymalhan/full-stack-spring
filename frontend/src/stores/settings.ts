import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type VideoQuality = 'low' | 'medium' | 'high';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  // User preferences
  theme: Theme;
  videoQuality: VideoQuality;
  autoplay: boolean;
  soundEffects: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  setAutoplay: (autoplay: boolean) => void;
  setSoundEffects: (soundEffects: boolean) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  theme: 'dark' as Theme,
  videoQuality: 'high' as VideoQuality,
  autoplay: true,
  soundEffects: true,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultSettings,

        setTheme: (theme: Theme) => set({ theme }),

        setVideoQuality: (videoQuality: VideoQuality) => set({ videoQuality }),

        setAutoplay: (autoplay: boolean) => set({ autoplay }),

        setSoundEffects: (soundEffects: boolean) => set({ soundEffects }),

        resetToDefaults: () => set(defaultSettings),
      }),
      {
        name: 'retrowatch-settings',
      }
    ),
    { name: 'settings-store' }
  )
)
