import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";

export function AnimatedFireLogo() {
  return (
    <div className="relative w-32 h-32">
      {/* Fire background - full size */}
      <img 
        src={realisticFlame} 
        alt="Fire" 
        className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-80"
      />
      
      {/* Animated flame particles on top */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full opacity-90 animate-[flameRise_2s_ease-in-out_infinite]"></div>
      <div className="absolute top-4 left-[45%] w-1.5 h-1.5 bg-accent rounded-full opacity-80 animate-[flameRise_2.5s_ease-in-out_infinite_0.3s]"></div>
      <div className="absolute top-3 left-[55%] w-1.5 h-1.5 bg-primary rounded-full opacity-85 animate-[flameRise_2.2s_ease-in-out_infinite_0.6s]"></div>
      <div className="absolute top-5 left-[42%] w-1 h-1 bg-accent rounded-full opacity-70 animate-[flameRise_1.8s_ease-in-out_infinite_0.9s]"></div>
      <div className="absolute top-6 left-[58%] w-1 h-1 bg-primary rounded-full opacity-75 animate-[flameRise_2.3s_ease-in-out_infinite_1.2s]"></div>
    </div>
  );
}
