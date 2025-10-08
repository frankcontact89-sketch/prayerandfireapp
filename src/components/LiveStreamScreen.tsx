import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Video, Tv } from "lucide-react";

interface LiveStreamScreenProps {
  t: (en: string, es: string) => string;
}

export function LiveStreamScreen({ t }: LiveStreamScreenProps) {
  const [streamUrl, setStreamUrl] = useState("");
  const [activeStream, setActiveStream] = useState<string | null>(null);

  const loadStream = () => {
    if (!streamUrl.trim()) return;
    setActiveStream(streamUrl);
  };

  const renderPlayer = () => {
    if (!activeStream) return null;

    // YouTube video
    if (activeStream.includes("youtube.com") || activeStream.includes("youtu.be")) {
      try {
        const url = new URL(activeStream);
        const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
        return (
          <iframe
            className="w-full h-[400px] rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allowFullScreen
          />
        );
      } catch {
        return <p className="text-destructive">{t("Invalid YouTube URL", "URL de YouTube inválida")}</p>;
      }
    }

    // HLS stream (.m3u8)
    if (activeStream.endsWith(".m3u8")) {
      return (
        <video
          controls
          autoPlay
          className="w-full rounded-lg"
          src={activeStream}
        >
          {t("Your browser does not support video playback", "Tu navegador no soporta reproducción de video")}
        </video>
      );
    }

    return <p className="text-destructive">{t("Invalid stream URL", "URL de stream inválida")}</p>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Tv className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold text-foreground">
          {t("Live Stream", "Transmisión en Vivo")}
        </h1>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          {t("Stream Player", "Reproductor de Stream")}
        </h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("YouTube URL or .m3u8 link", "URL de YouTube o enlace .m3u8")}
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadStream}>
              {t("Load", "Cargar")}
            </Button>
          </div>

          <div className="min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
            {activeStream ? (
              renderPlayer()
            ) : (
              <p className="text-muted-foreground">
                {t("Enter a stream URL to begin", "Ingresa una URL de stream para comenzar")}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
