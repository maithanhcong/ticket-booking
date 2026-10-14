import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "glass";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default:
      "border-transparent bg-blue-500/20 text-blue-300 border border-blue-500/30",
    secondary:
      "border-transparent bg-zinc-800 text-zinc-300 border border-zinc-700/50",
    destructive:
      "border-transparent bg-red-500/15 text-red-400 border border-red-500/30",
    outline:
      "text-zinc-300 border-zinc-700/80 bg-zinc-900/50",
    success:
      "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-950",
    warning:
      "border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-950",
    info:
      "border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-950",
    glass:
      "backdrop-blur-md bg-white/[0.06] border-white/15 text-white shadow-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
