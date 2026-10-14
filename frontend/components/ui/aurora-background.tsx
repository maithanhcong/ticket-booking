"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className="relative flex flex-col items-center justify-start overflow-hidden bg-zinc-950 text-slate-100">
      <div
        className={cn(
          "relative flex flex-col h-full w-full items-center justify-center bg-zinc-950 text-slate-100 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              `
            [--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.08)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.08)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.4)_7%,transparent_10%,transparent_12%,rgba(0,0,0,0.4)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#8b5cf6_18%,#06b6d4_26%,#10b981_34%,#6366f1_42%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[16px]
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-40 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_15%,var(--transparent)_75%)]`
            )}
          />
          {/* Subtle noise / glow overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-zinc-950/80 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
        </div>
        {children}
      </div>
    </main>
  );
};
