import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import type { Ad, WatchHistoryEntry } from '@/stores/library'

const API_BASE = '/api/protected/library'

async function fetchWithAuth(url: string, token: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Request failed with status ${response.status}`)
  }

  // Handle empty responses (like DELETE)
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

// ==================== ADS HOOKS ====================

export function useAds() {
  const { getToken, userId } = useAuth()

  return useQuery<Ad[]>({
    queryKey: ['ads', userId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      return fetchWithAuth(`${API_BASE}/ads`, token)
    },
    enabled: !!userId,
  })
}

export function useUploadAd() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE}/ads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Upload failed')
      }

      return response.json() as Promise<Ad[]>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', userId] })
    },
  })
}

export function useDeleteAd() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()

  return useMutation({
    mutationFn: async (adId: string) => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      await fetchWithAuth(`${API_BASE}/ads/${adId}`, token, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', userId] })
    },
  })
}

// ==================== WATCH HISTORY HOOKS ====================

export function useWatchHistory() {
  const { getToken, userId } = useAuth()

  return useQuery<WatchHistoryEntry[]>({
    queryKey: ['watchHistory', userId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      return fetchWithAuth(`${API_BASE}/history`, token)
    },
    enabled: !!userId,
  })
}

export function useAddToHistory() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      youtube_url: string
      video_title?: string | null
      thumbnail_url?: string | null
      ad_ids?: string[]
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      return fetchWithAuth(`${API_BASE}/history`, token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }) as Promise<WatchHistoryEntry[]>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory', userId] })
    },
  })
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()

  return useMutation({
    mutationFn: async (historyId: string) => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      await fetchWithAuth(`${API_BASE}/history/${historyId}`, token, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory', userId] })
    },
  })
}

// ==================== YOUTUBE HELPERS ====================

interface YouTubeOEmbedResponse {
  title: string
  thumbnail_url: string
  author_name: string
}

export async function fetchYoutubeVideoInfo(youtubeUrl: string): Promise<{
  title: string
  thumbnailUrl: string
} | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
    )
    if (!response.ok) return null

    const data: YouTubeOEmbedResponse = await response.json()
    return {
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
    }
  } catch {
    return null
  }
}
