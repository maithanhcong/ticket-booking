"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, ShieldCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerBadgeProps {
  initialSeconds?: number; // default 600 (10 minutes)
  expiresAt?: string | Date; // optional absolute expiration timestamp
  onExpire?: () => void;
  seatCount?: number;
  className?: string;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({
  initialSeconds = 600,
  expiresAt,
  onExpire,
  seatCount = 0,
  className = "",
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (expiresAt) {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, diff);
    }
    return initialSeconds * 1000;
  });

  const totalDurationMs = useRef(
    expiresAt
      ? Math.max(1000, new Date(expiresAt).getTime() - Date.now())
      : initialSeconds * 1000
  ).current;

  const [isExpired, setIsExpired] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Drift-Free Web Worker
  useEffect(() => {
    // Web Worker Script inlined as Blob to prevent background tab throttling
    const workerScript = `
      let timer = null;
      let targetTimestamp = 0;

      self.onmessage = function(e) {
        if (e.data.type === 'START') {
          targetTimestamp = e.data.targetTimestamp;
          if (timer) clearInterval(timer);
          
          const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, targetTimestamp - now);
            self.postMessage({ type: 'TICK', remainingMs: diff });
            if (diff <= 0) {
              clearInterval(timer);
              self.postMessage({ type: 'EXPIRED' });
            }
          };

          // Fast interval check (250ms) for millisecond accuracy
          timer = setInterval(tick, 250);
          tick();
        } else if (e.data.type === 'STOP') {
          if (timer) clearInterval(timer);
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    const targetTimestamp = expiresAt
      ? new Date(expiresAt).getTime()
      : Date.now() + initialSeconds * 1000;

    worker.postMessage({ type: "START", targetTimestamp });

    worker.onmessage = (e) => {
      if (e.data.type === "TICK") {
        setRemainingMs(e.data.remainingMs);
      } else if (e.data.type === "EXPIRED") {
        setRemainingMs(0);
        setIsExpired(true);
        if (onExpire) onExpire();
      }
    };

    return () => {
      worker.postMessage({ type: "STOP" });
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [expiresAt, initialSeconds, onExpire]);

  // Calculations
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));

  // Determine Urgency Stage
  // Normal: > 180s (3 min)
  // Warning: 60s - 180s (1-3 min)
  // Critical: < 60s
  const isCritical = remainingSeconds <= 60 && !isExpired;
  const isWarning = remainingSeconds > 60 && remainingSeconds <= 180 && !isExpired;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isCritical ? [1, 1.03, 1] : 1,
          transition: isCritical
            ? {
                scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
                opacity: { duration: 0.2 },
              }
            : { duration: 0.3, ease: "easeOut" },
        }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl border transition-colors duration-500 select-none",
          isCritical
            ? "bg-red-950/85 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.35)] text-red-100"
            : isWarning
            ? "bg-amber-950/85 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] text-amber-100"
            : "bg-zinc-900/90 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-zinc-100",
          className
        )}
      >
        {/* Animated Icon */}
        <div className="relative flex items-center justify-center">
          {isCritical ? (
            <Flame className="h-4 w-4 text-red-400 animate-bounce" />
          ) : isWarning ? (
            <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
          ) : (
            <Clock className="h-4 w-4 text-blue-400" />
          )}

          {/* Micro Ping Dot */}
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full",
              isCritical
                ? "bg-red-400 animate-ping"
                : isWarning
                ? "bg-amber-400 animate-ping"
                : "bg-emerald-400"
            )}
          />
        </div>

        {/* Seat Hold Status */}
        {seatCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs border-r border-white/10 pr-3 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {seatCount} seat{seatCount > 1 ? "s" : ""} locked
            </span>
          </div>
        )}

        {/* Timer Label & Digits */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide uppercase opacity-75">
            {isExpired ? "Reservation Expired" : "Lock Expires In"}
          </span>

          <span
            className={cn(
              "font-mono text-sm font-bold tracking-wider tabular-nums px-1.5 py-0.5 rounded",
              isCritical
                ? "bg-red-900/60 text-red-300 font-extrabold"
                : isWarning
                ? "bg-amber-900/60 text-amber-300"
                : "bg-zinc-800/80 text-blue-300"
            )}
          >
            {isExpired ? "00:00" : formattedTime}
          </span>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative h-5 w-5 shrink-0 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-zinc-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={cn(
                "transition-all duration-300",
                isCritical
                  ? "text-red-500"
                  : isWarning
                  ? "text-amber-400"
                  : "text-blue-500"
              )}
              strokeDasharray={`${progressPercent}, 100`}
              strokeLinecap="round"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
