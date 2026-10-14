"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VirtualWaitingRoomProps {
  eventId: string;
  eventTitle: string;
  onQueuePassed: (sessionToken: string) => void;
  initialPosition?: number;
}

export function VirtualWaitingRoom({
  eventId,
  eventTitle,
  onQueuePassed,
  initialPosition = 384,
}: VirtualWaitingRoomProps) {
  const [position, setPosition] = useState<number>(initialPosition);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const chimePlayedRef = useRef<boolean>(false);

  // Synthesize entry chime with in-browser Web Audio API
  const playEntryChime = () => {
    if (!soundEnabled || chimePlayedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Harmonic major chord chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.25);
      });
      chimePlayedRef.current = true;
    } catch (err) {
      console.warn("[WaitingRoom] AudioContext notice:", err);
    }
  };

  // Complete queue and grant 10-minute session token
  const completeQueueAndEnter = (overridePosition = 1) => {
    setIsPassed(true);
    setPosition(overridePosition);
    playEntryChime();

    const token = `qtoken_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 600 * 1000; // 10 minutes from now

    try {
      localStorage.setItem(
        `auratickets_session_${eventId}`,
        JSON.stringify({ token, expiresAt, eventId }),
      );
    } catch (e) {}

    setTimeout(() => {
      onQueuePassed(token);
    }, 1200);
  };

  // Live Heartbeat: automatically advance queue position every 4 seconds
  useEffect(() => {
    if (position <= 1) {
      if (!isPassed) {
        completeQueueAndEnter(1);
      }
      return;
    }

    const interval = setInterval(() => {
      setPosition((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 1;
        }

        // Stepped rapid progression towards #1
        if (prev > 200) return Math.max(1, prev - Math.floor(65 + Math.random() * 40));
        if (prev > 80) return Math.max(1, prev - Math.floor(35 + Math.random() * 20));
        if (prev > 15) return Math.max(1, prev - Math.floor(12 + Math.random() * 10));
        return 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [position, isPassed]);

  // Format estimated wait time
  const getEstimatedWaitText = () => {
    if (position <= 1) return "Entering seating stadium now...";
    if (position < 20) return "~15 seconds";
    if (position < 80) return "~45 seconds";
    if (position < 200) return "~1 minute";
    return "~2 minutes";
  };

  const percentProgress = Math.min(
    100,
    Math.max(5, Math.round(((initialPosition - position + 1) / initialPosition) * 100)),
  );

  return (
    <div className="relative w-full min-h-[620px] rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden shadow-2xl p-6 sm:p-12 flex flex-col items-center justify-center text-center">
      {/* Ambient background glow & matrix grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />
      <div className="absolute -top-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Audio toggle & security header */}
      <div className="absolute top-5 inset-x-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="gap-1.5 px-3 py-1 text-xs bg-amber-500/20 text-amber-300 border-amber-500/40">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>High-Demand Drop Queue</span>
          </Badge>
          <Badge variant="glass" className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Fair Allocation Engine</span>
          </Badge>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute chime" : "Enable chime"}
          className="h-8 w-8 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Radar Container */}
      <div className="relative my-8 flex items-center justify-center">
        {/* Concentric Pulsing Radar Rings */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-blue-500/20 absolute flex items-center justify-center">
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-blue-500/30 flex items-center justify-center">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-indigo-500/40" />
          </div>
        </div>

        {/* 360-Degree Rotating Conic Radar Sweep */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full absolute pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0) 0deg, rgba(59, 130, 246, 0.28) 320deg, rgba(6, 182, 212, 0.7) 360deg)",
          }}
        />

        {/* Center Target Core Display */}
        <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-zinc-950/90 border-2 border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.3)] backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
            Queue Position
          </span>

          <motion.div
            key={position}
            initial={{ scale: 1.15, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl sm:text-4xl font-black tracking-tight mt-1 ${
              position === 1 ? "text-emerald-400 animate-pulse" : "text-white"
            }`}
          >
            {position === 1 ? "#1 (Ready!)" : `#${position}`}
          </motion.div>

          <span className="mt-2 text-[10px] text-zinc-400 font-medium">
            Progress: <strong className="text-blue-400">{percentProgress}%</strong>
          </span>

          <div className="w-28 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${percentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Queue Details & Heartbeat Info */}
      <div className="max-w-md space-y-3 z-10">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {eventTitle}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          High-volume ticket drop detected. To protect fair seat access and eliminate automated bot race conditions, buyers enter in orderly sequence.
        </p>

        <div className="flex items-center justify-center gap-6 pt-3 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Est. Wait: <strong className="text-white">{getEstimatedWaitText()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Heartbeat: <strong className="text-emerald-400">Live (4s)</strong></span>
          </div>
        </div>
      </div>

      {/* Action Footer with VIP Fast-Track Bypass Button */}
      <div className="mt-8 pt-6 border-t border-zinc-800/80 w-full max-w-lg flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="text-[11px] text-zinc-500 text-left">
          <span>* Reaching #1 grants a verified 10-minute session reservation.</span>
        </div>

        <Button
          onClick={() => completeQueueAndEnter(1)}
          variant="glow"
          size="sm"
          className="gap-2 text-xs font-bold shrink-0 shadow-xl shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>VIP Fast-Track (Test Bypass)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
