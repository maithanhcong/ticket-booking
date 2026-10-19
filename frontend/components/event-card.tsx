"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  ArrowRight,
  Sparkles,
  Flame,
  Music,
  Trophy,
  Minus,
  Plus,
  Heart,
  Share2,
  Bell,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites-context";
import { downloadIcsFile } from "@/lib/calendar-export";

export interface EventCardData {
  id: string;
  title: string;
  slug?: string;
  description: string;
  bannerUrl?: string;
  startTime: string | Date;
  venue: {
    name: string;
    city: string;
    country: string;
  };
  minPrice: number;
  availableSeats: number;
  totalSeats: number;
  category?: string;
  isPopular?: boolean;
}

interface EventCardProps {
  event: EventCardData;
  rank?: number;
  highlightBadge?: string;
}

export function EventCardSkeleton() {
  return (
    <div className="flex flex-col h-[420px] w-full max-w-[360px] rounded-2xl bg-white border border-zinc-200 p-2.5 overflow-hidden shadow-sm animate-pulse select-none">
      <div className="h-36 w-full bg-zinc-100 rounded-xl relative">
        <div className="absolute top-2.5 left-2.5 h-5 w-20 bg-zinc-200 rounded-full" />
        <div className="absolute bottom-2.5 right-2.5 h-5 w-16 bg-zinc-200 rounded-lg" />
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-5 w-4/5 bg-zinc-200 rounded-md" />
          <div className="h-3.5 w-3/5 bg-zinc-100 rounded-md" />
          <div className="h-3 w-full bg-zinc-100 rounded-md mt-2" />
          <div className="h-3 w-4/5 bg-zinc-100 rounded-md" />
        </div>
        <div className="space-y-2 pt-3 border-t border-zinc-100">
          <div className="h-8 w-full bg-zinc-100 rounded-lg" />
          <div className="h-9 w-full bg-zinc-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export const DEFAULT_EVENT_BANNER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";

/**
 * Permanent, 100% accessible Unsplash photo IDs by event genre
 */
export function getCuratedFallbackImage(category?: string, title?: string): string {
  const text = `${title || ""} ${category || ""}`.toUpperCase();

  // UFC / MMA / Boxing
  if (text.includes("UFC") || text.includes("MMA") || text.includes("FIGHT") || text.includes("BOXING") || text.includes("OCTAGON")) {
    return "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80";
  }

  // K-Pop / Idols / Girl & Boy Groups
  if (text.includes("SEVENTEEN") || text.includes("K-POP") || text.includes("KPOP") || text.includes("IDOL") || text.includes("BTS") || text.includes("BLACKPINK") || text.includes("NEWJEANS") || text.includes("AESPA") || text.includes("STRAY KIDS")) {
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80";
  }

  // Stadium Megastars: Taylor Swift / Coldplay
  if (text.includes("SWIFT") || text.includes("COLDPLAY") || text.includes("TAYLOR") || text.includes("SPHERES") || text.includes("ERAS")) {
    return "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80";
  }

  // Football / Soccer / Stadium Derbies
  if (text.includes("FOOTBALL") || text.includes("SOCCER") || text.includes("DERBY") || text.includes("ASEAN") || text.includes("PITCH") || text.includes("STADIUM")) {
    return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80";
  }

  // Basketball / NBA
  if (text.includes("BASKETBALL") || text.includes("NBA") || text.includes("WARRIORS") || text.includes("LAKERS")) {
    return "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80";
  }

  // Formula 1 / Motorsport
  if (text.includes("F1") || text.includes("GRAND PRIX") || text.includes("RACING") || text.includes("MOTORSPORT") || text.includes("RALLY")) {
    return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80";
  }

  // Esports / Gaming
  if (text.includes("ESPORTS") || text.includes("GAMING") || text.includes("LOL") || text.includes("WORLDS")) {
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";
  }

  // Symphony / Orchestra / Classical
  if (text.includes("SYMPHONY") || text.includes("ORCHESTRA") || text.includes("CLASSICAL")) {
    return "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80";
  }

  // General Concert / Festival
  return DEFAULT_EVENT_BANNER;
}

export function getCuratedPosterUrl(bannerUrl?: string, category?: string, title?: string): string {
  if (bannerUrl && bannerUrl.trim().length > 0 && !bannerUrl.includes("placeholder")) {
    return bannerUrl;
  }
  return getCuratedFallbackImage(category, title);
}

interface StadiumFallbackConfig {
  gradientClass: string;
  spotlightGradient: string;
  watermark: string;
  icon: React.ReactNode;
}

/**
 * Dynamic Theme-Based CSS Mesh Gradients (Zero-Network Fallbacks)
 */
export function getStadiumFallback(category?: string, title?: string): StadiumFallbackConfig {
  const text = `${title || ""} ${category || ""}`.toUpperCase();

  // Sports / MMA
  if (
    text.includes("UFC") ||
    text.includes("MMA") ||
    text.includes("BOXING") ||
    text.includes("FIGHT") ||
    text.includes("OCTAGON")
  ) {
    return {
      gradientClass: "bg-gradient-to-br from-red-950 via-zinc-900 to-amber-950/40",
      spotlightGradient: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 75%)",
      watermark: "OCTAGON CHAMPIONSHIP",
      icon: <Flame className="h-8 w-8 text-red-400/70" />,
    };
  }

  // Sports / Football / Basketball / F1
  if (
    text.includes("SPORTS") ||
    text.includes("FOOTBALL") ||
    text.includes("SOCCER") ||
    text.includes("BASKETBALL") ||
    text.includes("NBA") ||
    text.includes("F1") ||
    text.includes("RACING") ||
    text.includes("RALLY")
  ) {
    return {
      gradientClass: "bg-gradient-to-br from-red-950 via-zinc-900 to-amber-950/40",
      spotlightGradient: "radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(239, 68, 68, 0.2) 50%, transparent 75%)",
      watermark: "RACING & STADIUM",
      icon: <Trophy className="h-8 w-8 text-amber-400/70" />,
    };
  }

  // K-Pop / Pop
  if (
    text.includes("K-POP") ||
    text.includes("KPOP") ||
    text.includes("IDOL") ||
    text.includes("POP") ||
    text.includes("SEVENTEEN") ||
    text.includes("BLACKPINK") ||
    text.includes("BTS") ||
    text.includes("NEWJEANS") ||
    text.includes("AESPA") ||
    text.includes("STRAY KIDS")
  ) {
    return {
      gradientClass: "bg-gradient-to-br from-purple-950 via-zinc-900 to-cyan-950/40",
      spotlightGradient: "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(6, 182, 212, 0.25) 50%, transparent 75%)",
      watermark: "K-POP ARENA",
      icon: <Music className="h-8 w-8 text-purple-400/70" />,
    };
  }

  // Stadium Concerts
  if (
    text.includes("ROCK") ||
    text.includes("METAL") ||
    text.includes("CONCERT") ||
    text.includes("SWIFT") ||
    text.includes("TAYLOR") ||
    text.includes("COLDPLAY") ||
    text.includes("TOUR") ||
    text.includes("ORCHESTRA") ||
    text.includes("SYMPHONY")
  ) {
    return {
      gradientClass: "bg-gradient-to-br from-cyan-950 via-zinc-900 to-blue-950/40",
      spotlightGradient: "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(37, 99, 235, 0.25) 50%, transparent 75%)",
      watermark: "LIVE STADIUM",
      icon: <Sparkles className="h-8 w-8 text-cyan-400/70" />,
    };
  }

  // Default
  return {
    gradientClass: "bg-gradient-to-br from-zinc-900 via-zinc-950 to-slate-900/60",
    spotlightGradient: "radial-gradient(circle, rgba(148, 163, 184, 0.3) 0%, rgba(30, 41, 59, 0.2) 50%, transparent 75%)",
    watermark: "AURA SHOWCASE",
    icon: <Ticket className="h-8 w-8 text-zinc-400/70" />,
  };
}

export const EventCard: React.FC<EventCardProps> = ({ event, rank, highlightBadge }) => {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [ticketQty, setTicketQty] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [priceAlertActive, setPriceAlertActive] = useState(false);

  const isFav = isFavorite(event.id);

  // Bulletproof multi-tier image state with genre fallback & error recovery
  const categoryFallback = getCuratedFallbackImage(event.category, event.title);
  const initialPosterUrl = (event.bannerUrl && event.bannerUrl.trim().length > 0 && !event.bannerUrl.includes("placeholder"))
    ? event.bannerUrl
    : categoryFallback;

  const [imgSrc, setImgSrc] = useState(initialPosterUrl);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  useEffect(() => {
    const validBanner = event.bannerUrl && event.bannerUrl.trim().length > 0 && !event.bannerUrl.includes("placeholder");
    const nextUrl = validBanner ? event.bannerUrl! : getCuratedFallbackImage(event.category, event.title);
    setImgSrc(nextUrl);
    setFallbackAttempt(0);
  }, [event.bannerUrl, event.category, event.title]);

  const handleImageError = () => {
    if (fallbackAttempt === 0 && imgSrc !== categoryFallback) {
      // Step 1: Fall back to curated genre poster
      setFallbackAttempt(1);
      setImgSrc(categoryFallback);
    } else if (fallbackAttempt < 2 && imgSrc !== DEFAULT_EVENT_BANNER) {
      // Step 2: Fall back to universal high-res concert banner
      setFallbackAttempt(2);
      setImgSrc(DEFAULT_EVENT_BANNER);
    } else {
      // Step 3: All image URLs failed (e.g. offline), reveal styled CSS mesh
      setFallbackAttempt(3);
    }
  };

  const stadiumFallback = getStadiumFallback(event.category, event.title);

  const eventDate = new Date(event.startTime);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCardClick = () => {
    router.push(`/events/${event.id}`);
  };

  const handleQtyChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setTicketQty((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(event.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : "";
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadIcsFile({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      venueName: event.venue?.name,
      venueCity: event.venue?.city,
      eventUrl: typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : "",
    });
  };

  const handlePriceAlert = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPriceAlertActive((prev) => !prev);
  };

  return (
    <div className="h-full py-2">
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col h-[420px] w-full max-w-[360px] rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-sm hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden justify-between cursor-pointer hover:-translate-y-1"
      >
        {/* Top Thumbnail Container with Rounded Inset */}
        <div className="m-2 rounded-xl overflow-hidden relative h-36 bg-zinc-100 dark:bg-zinc-800 shrink-0">
          {/* Fallback Mesh Texture (Always present behind image) */}
          <div className={`absolute inset-0 select-none ${stadiumFallback.gradientClass}`}>
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-2xl opacity-75"
              style={{ background: stadiumFallback.spotlightGradient }}
            />
            {/* Watermark when image fails */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${
                fallbackAttempt >= 3 ? "opacity-100" : "opacity-0"
              }`}
            >
              {stadiumFallback.icon}
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mt-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                {stadiumFallback.watermark}
              </span>
            </div>
          </div>

          {/* Real Image Layer */}
          {fallbackAttempt < 3 && (
            <img
              src={imgSrc}
              alt={event.title || "Event banner"}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}

          {/* Subtle bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          {/* Top-Left Category / Rank Chip */}
          <div className="absolute top-2.5 left-2.5 max-w-[50%] truncate z-10 flex items-center gap-1 pointer-events-none">
            {rank !== undefined ? (
              <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-zinc-900 text-white shadow-sm">
                #{rank}
              </span>
            ) : null}
            <span className="truncate px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm">
              {event.category || "General"}
            </span>
          </div>

          {/* Floating Action Hub at Top-Right */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center justify-end pointer-events-auto">
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="relative flex items-center justify-end h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 p-1 shadow-lg transition-all duration-200 ease-out max-w-[32px] hover:max-w-[140px] group-hover/hub:max-w-[140px] overflow-hidden group/hub"
            >
              {/* Secondary action buttons on the left */}
              <div className="flex items-center gap-1 opacity-0 group-hover/hub:opacity-100 transition-opacity duration-150 delay-75 shrink-0 pr-1">
                {/* Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share Event Link"
                  className="w-6 h-6 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                </button>

                {/* Calendar */}
                <button
                  type="button"
                  onClick={handleCalendar}
                  aria-label="Add to Calendar"
                  className="w-6 h-6 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>

                {/* Bell / Price Alert */}
                <button
                  type="button"
                  onClick={handlePriceAlert}
                  aria-label="Toggle Price Alert"
                  className={`w-6 h-6 rounded-full transition-colors flex items-center justify-center shrink-0 ${
                    priceAlertActive ? "text-amber-400 bg-white/20" : "text-white/80 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Heart icon on the far right (anchored in place) */}
              <button
                type="button"
                onClick={handleToggleFav}
                aria-label={isFav ? "Remove from Wishlist" : "Save to Wishlist"}
                className="w-6 h-6 rounded-full text-white hover:scale-110 transition-transform flex items-center justify-center shrink-0"
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    isFav ? "text-red-500 fill-red-500" : "text-white hover:text-red-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Overlaid Clean White / Dark Price Badge at Bottom-Right */}
          <div className="absolute bottom-2 right-2 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-zinc-900 dark:text-zinc-100 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 font-mono">
            {formatPrice(event.minPrice)}
          </div>
        </div>

        {/* Card Body - Clean Light High-Contrast Typography (WCAG AAA) */}
        <div className="px-3.5 pb-2 flex-1 flex flex-col justify-between overflow-hidden">
          <div>
            <h3
              className="text-zinc-950 dark:text-white font-bold text-sm tracking-tight line-clamp-1 truncate group-hover:text-red-600 transition-colors"
              title={event.title}
            >
              {event.title}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
              <Calendar className="h-3 w-3 text-zinc-600 dark:text-zinc-400 shrink-0" />
              <span className="truncate">{formattedDate}</span>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <MapPin className="h-3 w-3 text-zinc-600 dark:text-zinc-400 shrink-0" />
              <span className="truncate">{event.venue.name}</span>
            </div>

            <p className="mt-1 text-zinc-600 dark:text-zinc-400 font-normal text-xs leading-relaxed line-clamp-2">
              {event.description}
            </p>
          </div>

          {/* Card Footer: Minimalist Stepper [-] 01 [+] & Solid Pitch Black Button */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
            {/* High-Contrast Stepper Counter */}
            <div className="flex items-center justify-between bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 font-bold text-xs px-2.5 py-1 mb-2">
              <button
                type="button"
                onClick={(e) => handleQtyChange(e, -1)}
                className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded transition-colors flex items-center justify-center"
                aria-label="Decrease ticket quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-mono text-zinc-950 dark:text-white font-bold px-2">
                {String(ticketQty).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={(e) => handleQtyChange(e, 1)}
                className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded transition-colors flex items-center justify-center"
                aria-label="Increase ticket quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/events/${event.id}`);
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
            >
              <span>Buy Ticket</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
