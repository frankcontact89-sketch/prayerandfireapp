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
    <div className="space-y-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-card rounded-xl overflow-hidden"
        >
          <div className="flex gap-4 p-4">
            <div className="w-32 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
              <img
                src={video.thumb}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{video.title}</h3>
                <p className="text-sm text-muted-foreground">{video.date}</p>
              </div>
              <Button
                onClick={() => window.open(video.url, "_blank")}
                className="w-full font-bold gap-2"
                size="sm"
              >
                <Play className="w-4 h-4" />
                {t("watch")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
