import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumb: string;
  url: string;
  date: string;
}

interface YouTubeFeedProps {
  apiKey: string;
  channelId: string;
  maxResults?: number;
  t: (key: string) => string;
}

export function YouTubeFeed({ apiKey, channelId, maxResults = 6, t }: YouTubeFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}`
        );
        const data = await res.json();
        const list: Video[] =
          (data.items || [])
            .filter((i: any) => i.id?.kind === "youtube#video")
            .map((i: any) => ({
              id: i.id.videoId,
              title: i.snippet.title,
              thumb: i.snippet.thumbnails.medium.url,
              url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
              date: new Date(i.snippet.publishedAt).toLocaleDateString(),
            })) ?? [];
        setVideos(list);
      } catch (e) {
        console.error("YouTube Error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiKey, channelId, maxResults]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {t("noServicesFound")}
      </p>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4 p-4">
            {/* Thumbnail */}
            <div className="relative w-28 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-black">
              <img
                src={video.thumb}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
                {video.title}
              </h3>
              <p className="text-sm text-muted-foreground">{video.date}</p>
            </div>
          </div>
          
          {/* Watch Button */}
          <div className="px-4 pb-4">
            <Button
              onClick={() => window.open(video.url, "_blank")}
              className="w-full font-semibold gap-2 rounded-xl h-12 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            >
              <Play className="w-5 h-5" />
              Watch Now
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
