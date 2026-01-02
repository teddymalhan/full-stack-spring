import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { channels, type Channel } from "@/data/channels";
import { Clock, Tv, ScreenShare } from "lucide-react";

function ChannelCard({ channel, index }: { channel: Channel; index: number }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/player/${channel.id}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sci-fi':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'comedy':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'music':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'game-shows':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'screen-capture':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card
        onClick={handleClick}
        className="group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 p-0"
      >
        {/* Channel Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={channel.image}
            alt={channel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Category Badge */}
          <Badge
            className={`absolute top-3 right-3 ${getCategoryColor(channel.category)}`}
          >
            {channel.category === 'screen-capture' ? (
              <><ScreenShare className="w-3 h-3" /> Capture</>
            ) : (
              <><Tv className="w-3 h-3" /> {channel.category}</>
            )}
          </Badge>

          {/* Channel Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-white drop-shadow-lg">
              {channel.name}
            </h3>
          </div>
        </div>

        {/* Channel Info */}
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {channel.description}
          </p>

          {channel.showtimes && channel.showtimes.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <Clock className="w-3 h-3" />
              <span>Showtimes: {channel.showtimes.join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ChannelGuide() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Channel Guide</h1>
          <p className="text-muted-foreground">
            Select a channel to start watching on your retro TV
          </p>
        </motion.div>

        {/* Channel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.map((channel, index) => (
            <ChannelCard key={channel.id} channel={channel} index={index} />
          ))}
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-border/50 text-center"
        >
          <div className="flex justify-center gap-4 mb-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RetroWatch. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
