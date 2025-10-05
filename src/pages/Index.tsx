import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const APP_TITLE = "Prayer & Fire App";
const INSTAGRAM_URL = "https://www.instagram.com/prayerandfire/";
const YOUTUBE_URL = "https://youtube.com/";
const ZOOM_URL = "https://zoom.us/";
const WHATSAPP_MESSAGE = "🔥 Check out the Prayer & Fire App!";

const Index = () => {
  const [showInstagram, setShowInstagram] = useState(false);

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 pb-16">
        {/* LOGO */}
        <div className="text-center space-y-6">
          <img
            src="https://i.imgur.com/4Q9QpMo.png"
            alt="Prayer & Fire Logo"
            className="w-32 h-32 mx-auto object-contain"
          />
          <h1 className="text-2xl font-bold text-primary">
            Welcome to Prayer & Fire 🔥
          </h1>
        </div>

        {/* BOTONES PRINCIPALES */}
        <div className="space-y-5 w-full">
          <Button
            onClick={() => window.open(YOUTUBE_URL, "_blank")}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
              alt="YouTube"
              className="w-6 h-6 brightness-0 invert"
            />
            Live Service
          </Button>

          <Button
            onClick={() => window.open(ZOOM_URL, "_blank")}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/882/882704.png"
              alt="Zoom"
              className="w-6 h-6 brightness-0 invert"
            />
            Zoom
          </Button>

          <Button
            onClick={() => setShowInstagram(true)}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
              alt="Instagram"
              className="w-6 h-6 brightness-0 invert"
            />
            Instagram
          </Button>
        </div>

        {/* BOTÓN WHATSAPP */}
        <button
          onClick={shareOnWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-4 px-5 rounded-xl transition-colors"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
            alt="WhatsApp"
            className="w-6 h-6 brightness-0 invert"
          />
          Share this app on WhatsApp
        </button>

        {/* PIE DE PÁGINA */}
        <p className="text-center text-muted-foreground text-sm mt-10">
          Powered by Prayer & Fire
        </p>
      </div>

      {/* VENTANA INSTAGRAM */}
      {showInstagram && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="bg-card p-3 flex justify-end border-b border-border">
            <Button
              onClick={() => setShowInstagram(false)}
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary"
            >
              <X className="w-5 h-5" />
              Close
            </Button>
          </div>
          <iframe
            src={INSTAGRAM_URL}
            className="flex-1 w-full h-full border-0"
            title="Instagram"
          />
        </div>
      )}
    </div>
  );
};

export default Index;
