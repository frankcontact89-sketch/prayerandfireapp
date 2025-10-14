import React from "react";
import fireIcon from "@/assets/fire-icon.png";

export function AnimatedFireLogo() {
  return (
    <div className="relative inline-block">
      {/* Glow effect */}
      <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse"></div>
      
      {/* Fire icon with animations */}
      <img 
        src={fireIcon} 
        alt="Prayer & Fire" 
        className="relative w-16 h-16 drop-shadow-[0_0_25px_rgba(255,106,0,0.8)] animate-[float_3s_ease-in-out_infinite]"
      />
      
      {/* Flickering particles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-[flicker_1.5s_ease-in-out_infinite]"></div>
      <div className="absolute top-2 left-1/4 w-0.5 h-0.5 bg-accent rounded-full animate-[flicker_2s_ease-in-out_infinite_0.5s]"></div>
      <div className="absolute top-1 right-1/4 w-0.5 h-0.5 bg-primary rounded-full animate-[flicker_1.8s_ease-in-out_infinite_0.3s]"></div>
    </div>
  );
}
