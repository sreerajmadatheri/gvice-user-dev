import React from "react";
import { cn } from "../../lib/utils";

export const DottedGlowBackground = ({
  className,
  opacity = 1,
  gap = 10,
  radius = 1.6,
  colorLightVar = "--color-neutral-500",
  glowColorLightVar = "--color-neutral-600",
  colorDarkVar = "--color-neutral-500",
  glowColorDarkVar = "--color-sky-800",
  backgroundOpacity = 0,
  speedMin = 0.3,
  speedMax = 1.6,
  speedScale = 1,
  ...props
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 h-full w-full pointer-events-none",
        className
      )}
      style={{
        opacity,
        backgroundColor: `rgba(var(--bg-primary-rgb), ${backgroundOpacity})`,
        backgroundImage: `radial-gradient(circle at center, var(${colorLightVar}, #d4d4d8) ${radius}px, transparent 0)`,
        backgroundSize: `${gap}px ${gap}px`,
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 70%)",
      }}
      {...props}
    >
      <div 
        className="absolute inset-0 opacity-50 animate-pulse"
        style={{
          background: `radial-gradient(circle at center, var(${glowColorLightVar}, rgba(0,0,0,0.1)) 0%, transparent 50%)`,
          animationDuration: `${Math.random() * (speedMax - speedMin) + speedMin}s`
        }}
      />
    </div>
  );
};

