import React from "react";
import fireLogo from "@/assets/prayer-hands-flame.png";

export function AnimatedFireLogo() {
  return (
    <div className="relative inline-block">
      {/* Subtle glow layer as background */}
      <div className="absolute inset-0 blur-3xl bg-primary/20 animate-pulse"></div>
      
      {/* Fire logo - static, no movement */}
      <img 
        src={fireLogo} 
        alt="Prayer & Fire" 
        className="relative w-32 h-32 opacity-90 drop-shadow-[0_0_20px_rgba(255,106,0,0.4)]"
      />
      
      {/* Animated flame particles only - these create the living fire effect */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full opacity-80 animate-[flameRise_2s_ease-in-out_infinite]"></div>
      <div className="absolute top-4 left-[45%] w-1.5 h-1.5 bg-accent rounded-full opacity-70 animate-[flameRise_2.5s_ease-in-out_infinite_0.3s]"></div>
      <div className="absolute top-3 left-[55%] w-1.5 h-1.5 bg-primary rounded-full opacity-75 animate-[flameRise_2.2s_ease-in-out_infinite_0.6s]"></div>
      <div className="absolute top-5 left-[42%] w-1 h-1 bg-accent rounded-full opacity-60 animate-[flameRise_1.8s_ease-in-out_infinite_0.9s]"></div>
      <div className="absolute top-6 left-[58%] w-1 h-1 bg-primary rounded-full opacity-65 animate-[flameRise_2.3s_ease-in-out_infinite_1.2s]"></div>
      <div className="absolute top-4 left-1/2 w-1 h-1 bg-accent rounded-full opacity-70 animate-[flameRise_2.1s_ease-in-out_infinite_0.4s]"></div>
    </div>
  );
}
