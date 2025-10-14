import React from "react";
import fireLogo from "@/assets/prayer-fire-circle-logo.jpg";

export function AnimatedFireLogo() {
  return (
    <div className="relative inline-block">
      {/* Multiple glow layers for intense effect */}
      <div className="absolute inset-0 blur-2xl bg-primary/40 animate-pulse"></div>
      <div className="absolute inset-0 blur-xl bg-primary/30 animate-[pulse_2s_ease-in-out_infinite_0.5s]"></div>
      
      {/* Fire logo with intense animations */}
      <img 
        src={fireLogo} 
        alt="Prayer & Fire" 
        className="relative w-32 h-32 rounded-full drop-shadow-[0_0_35px_rgba(255,106,0,0.9)] animate-[float_3s_ease-in-out_infinite,intensePulse_1.5s_ease-in-out_infinite]"
      />
      
      {/* Animated flame particles */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-[flameRise_2s_ease-in-out_infinite]"></div>
      <div className="absolute top-6 left-1/3 w-1.5 h-1.5 bg-accent rounded-full animate-[flameRise_2.5s_ease-in-out_infinite_0.3s]"></div>
      <div className="absolute top-5 right-1/3 w-1.5 h-1.5 bg-primary rounded-full animate-[flameRise_2.2s_ease-in-out_infinite_0.6s]"></div>
      <div className="absolute top-8 left-1/4 w-1 h-1 bg-accent rounded-full animate-[flameRise_1.8s_ease-in-out_infinite_0.9s]"></div>
      <div className="absolute top-7 right-1/4 w-1 h-1 bg-primary rounded-full animate-[flameRise_2.3s_ease-in-out_infinite_1.2s]"></div>
    </div>
  );
}
