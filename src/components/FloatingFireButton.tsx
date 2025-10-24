import React from "react";

interface FloatingFireButtonProps {
  onClick?: () => void;
}

export function FloatingFireButton({ onClick }: FloatingFireButtonProps) {
  return (
    <>
      <div
        onClick={onClick}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 text-5xl cursor-pointer z-50 animate-fire-pulse"
        role="button"
        aria-label="Fire button"
      >
        🔥
      </div>
    </>
  );
}
