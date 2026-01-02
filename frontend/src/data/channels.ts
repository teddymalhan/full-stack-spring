export type ChannelCategory = 'sci-fi' | 'comedy' | 'music' | 'game-shows' | 'screen-capture';
export type MediaType = 'video' | 'screen-capture';

export interface Channel {
  id: string;
  name: string;
  description: string;
  image: string;
  category: ChannelCategory;
  mediaType: MediaType;
  videoUrl?: string;
  showtimes?: string[];
}

export const channels: Channel[] = [
  {
    id: 'retro-sci-fi',
    name: 'Channel 1: Retro Sci-Fi',
    description: 'Explore space adventures from the 80s',
    image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=300&fit=crop',
    category: 'sci-fi',
    mediaType: 'video',
    videoUrl: '/movie.webm',
    showtimes: ['10:00 AM', '2:00 PM', '6:00 PM'],
  },
  {
    id: 'classic-comedy',
    name: 'Channel 2: Classic Comedy',
    description: 'Laugh with timeless comedy classics',
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&h=300&fit=crop',
    category: 'comedy',
    mediaType: 'video',
    videoUrl: '/movie.webm',
    showtimes: ['11:00 AM', '3:00 PM', '7:00 PM'],
  },
  {
    id: '80s-music-videos',
    name: 'Channel 3: 80s Music Videos',
    description: 'Revisit iconic 80s music videos',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    category: 'music',
    mediaType: 'video',
    videoUrl: '/movie.webm',
    showtimes: ['12:00 PM', '4:00 PM', '8:00 PM'],
  },
  {
    id: 'retro-game-shows',
    name: 'Channel 4: Retro Game Shows',
    description: 'Join the fun with classic game shows',
    image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop',
    category: 'game-shows',
    mediaType: 'video',
    videoUrl: '/movie.webm',
    showtimes: ['1:00 PM', '5:00 PM', '9:00 PM'],
  },
  {
    id: 'screen-capture',
    name: 'Screen Capture Mode',
    description: 'Watch any content from your browser on the retro TV',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    category: 'screen-capture',
    mediaType: 'screen-capture',
  },
  {
    id: 'youtube-demo',
    name: 'YouTube Demo Channel',
    description: 'Watch YouTube videos on the retro TV (CSS3D iframe mode)',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
    category: 'music',
    mediaType: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=x9hVTpyaXq8',
    showtimes: ['All Day'],
  },
];

export function getChannelById(id: string): Channel | undefined {
  return channels.find(channel => channel.id === id);
}

export function getChannelsByCategory(category: ChannelCategory): Channel[] {
  return channels.filter(channel => channel.category === category);
}
