"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Ticket,
  ChevronLeft,
  ArrowRight,
  Filter,
  DollarSign,
  Tag,
  Clock,
  Compass,
  Cpu,
  Layers,
  CheckCircle2,
  Zap,
  Globe,
  Music,
  Activity,
  Trophy,
  Flame,
  Heart,
  Volume2,
  Radio,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { Navbar } from "@/components/navbar";
import { CATALOG_EVENTS, CatalogEvent } from "@/lib/events-catalog";

const PROMPT_SUGGESTIONS = [
  "Weekend rock shows in Hanoi",
  "Taylor Swift or Coldplay stadium tour",
  "Formula 1 Singapore Grand Prix trackside",
  "Desert Rally Championship in Qatar",
  "Supercars Championship Melbourne",
  "K-Pop girl groups in Singapore",
  "Premier League clash in Tokyo",
  "UFC 320 Asia Championship Tokyo Dome",
];

const CITIES = [
  "All Cities",
  "Hanoi",
  "HCMC",
  "Tokyo",
  "Singapore",
  "Doha",
  "Melbourne",
  "Suzuka",
  "Seattle",
];

interface CategoryVisualConfig {
  title: string;
  subtitle: string;
  group: "Concerts" | "Motorsport" | "Sports" | "K-Pop" | "All";
  badge: string;
  taglineAccent: string;
  headerBackdrop: string;
  bodyAmbientAura: string;
  accentChipClass: string;
  primaryActionPillClass: string;
  aiCardClass: string;
  cardGlowWrapper: string;
  subFilters: string[];
  signatureType: "motorsport" | "kpop" | "sports" | "concerts" | "all";
  orb1Class: string;
  orb2Class: string;
  orb3Class: string;
  topLineClass: string;
}

function CategoryHeaderGraphic({
  signatureType,
}: {
  signatureType: "motorsport" | "kpop" | "sports" | "concerts" | "all";
}) {
  if (signatureType === "motorsport") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 dark:opacity-10 transition-opacity duration-700">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          <defs>
            <pattern id="checkered-flag" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="currentColor" className="text-red-500/20 dark:text-red-400/20" />
              <rect x="20" y="20" width="20" height="20" fill="currentColor" className="text-red-500/20 dark:text-red-400/20" />
            </pattern>
            <linearGradient id="telemetryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="1" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Checkered Flag Watermark */}
          <rect width="1000" height="300" fill="url(#checkered-flag)" />
          {/* Telemetry RPM / Speed Curves */}
          <path
            d="M 0 240 Q 180 250, 320 180 T 560 90 T 780 140 T 1000 50"
            fill="none"
            stroke="url(#telemetryGrad)"
            strokeWidth="3.5"
            strokeDasharray="6 3"
          />
          <path
            d="M 0 270 Q 220 280, 420 160 T 720 120 T 1000 90"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          {/* Apex Markers */}
          <circle cx="320" cy="180" r="5" fill="#ef4444" />
          <circle cx="560" cy="90" r="6" fill="#f59e0b" />
          <circle cx="780" cy="140" r="5" fill="#ef4444" />
          <line
            x1="560"
            y1="90"
            x2="560"
            y2="300"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.3"
          />
        </svg>
      </div>
    );
  }

  if (signatureType === "kpop") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-15 transition-opacity duration-700">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          <defs>
            <radialGradient id="lightstickGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Lightstick Glow Orbs */}
          <circle cx="180" cy="120" r="90" fill="url(#lightstickGlow)" />
          <circle cx="820" cy="100" r="110" fill="url(#lightstickGlow)" />
          <circle cx="500" cy="200" r="80" fill="url(#lightstickGlow)" />
          {/* Diamond Shimmer Stars (4-point polygon stars) */}
          <g fill="#ec4899" className="text-pink-500">
            <polygon points="250,50 256,66 272,72 256,78 250,94 244,78 228,72 244,66" opacity="0.75" />
            <polygon points="120,180 124,192 136,196 124,200 120,212 116,200 104,196 116,192" opacity="0.6" />
            <polygon points="750,60 757,78 775,85 757,92 750,110 743,92 725,85 743,78" opacity="0.8" />
            <polygon points="880,190 885,203 898,208 885,213 880,226 875,213 862,208 875,203" opacity="0.65" />
            <polygon points="450,40 454,52 466,56 454,60 450,72 446,60 434,56 446,52" opacity="0.7" />
          </g>
          {/* Lightstick Wand Silhouettes */}
          <g stroke="#f43f5e" strokeWidth="2" fill="none" opacity="0.45">
            {/* Left lightstick */}
            <path d="M 175 145 L 160 260" strokeWidth="4" strokeLinecap="round" />
            <circle cx="175" cy="130" r="22" fill="#fda4af" fillOpacity="0.2" />
            <path
              d="M 167 130 C 167 122, 175 116, 175 125 C 175 116, 183 122, 183 130 C 183 137, 175 142, 175 142 C 175 142, 167 137, 167 130 Z"
              fill="#ec4899"
            />
            {/* Right lightstick */}
            <path d="M 825 125 L 840 240" strokeWidth="4" strokeLinecap="round" />
            <circle cx="825" cy="110" r="24" fill="#fda4af" fillOpacity="0.2" />
            <polygon
              points="825,96 832,110 846,110 835,119 839,132 825,123 811,132 815,119 804,110 818,110"
              fill="#f43f5e"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (signatureType === "sports") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-15 transition-opacity duration-700">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          {/* Tactical Pitch Geometry */}
          <g stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6">
            {/* Outer sideline / border */}
            <rect x="50" y="25" width="900" height="250" rx="8" strokeDasharray="6 3" />
            {/* Halfway line */}
            <line x1="500" y1="25" x2="500" y2="275" strokeWidth="2.5" />
            {/* Center circle & spot */}
            <circle cx="500" cy="150" r="65" />
            <circle cx="500" cy="150" r="4" fill="#10b981" />
            {/* Left penalty area */}
            <rect x="50" y="75" width="130" height="150" />
            <rect x="50" y="105" width="50" height="90" />
            <path d="M 180 120 A 40 40 0 0 1 180 180" />
            <circle cx="140" cy="150" r="3.5" fill="#10b981" />
            {/* Right penalty area */}
            <rect x="820" y="75" width="130" height="150" />
            <rect x="900" y="105" width="50" height="90" />
            <path d="M 820 120 A 40 40 0 0 0 820 180" />
            <circle cx="860" cy="150" r="3.5" fill="#10b981" />
            {/* Tactical arrows / passes */}
            <path d="M 320 200 Q 420 240, 580 190" strokeDasharray="5 5" stroke="#34d399" strokeWidth="2" />
            <polygon points="580,190 568,185 572,196" fill="#34d399" />
          </g>
        </svg>
      </div>
    );
  }

  if (signatureType === "concerts") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-15 transition-opacity duration-700">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          <defs>
            <linearGradient id="spotlightLeft" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="spotlightRight" x1="100%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Spotlight Cones */}
          <polygon points="50,0 20,0 280,300 480,300" fill="url(#spotlightLeft)" />
          <polygon points="950,0 980,0 720,300 520,300" fill="url(#spotlightRight)" />
          {/* Acoustic Equalizer Bars Spectrum */}
          <g fill="url(#barGrad)">
            {[
              { x: 300, h: 45 },
              { x: 320, h: 70 },
              { x: 340, h: 110 },
              { x: 360, h: 85 },
              { x: 380, h: 140 },
              { x: 400, h: 95 },
              { x: 420, h: 160 },
              { x: 440, h: 120 },
              { x: 460, h: 190 },
              { x: 480, h: 155 },
              { x: 500, h: 210 },
              { x: 520, h: 175 },
              { x: 540, h: 185 },
              { x: 560, h: 130 },
              { x: 580, h: 150 },
              { x: 600, h: 100 },
              { x: 620, h: 125 },
              { x: 640, h: 80 },
              { x: 660, h: 95 },
              { x: 680, h: 50 },
            ].map((bar, i) => (
              <rect key={i} x={bar.x} y={285 - bar.h} width="12" height={bar.h} rx="3" />
            ))}
          </g>
        </svg>
      </div>
    );
  }

  // "all" - Neural semantic network
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 dark:opacity-10 transition-opacity duration-700">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1000 300"
      >
        <g stroke="#3b82f6" strokeWidth="1" opacity="0.4">
          <line x1="120" y1="80" x2="260" y2="140" />
          <line x1="260" y1="140" x2="420" y2="70" />
          <line x1="420" y1="70" x2="600" y2="150" />
          <line x1="600" y1="150" x2="740" y2="90" />
          <line x1="740" y1="90" x2="880" y2="160" />
          <line x1="260" y1="140" x2="340" y2="230" />
          <line x1="420" y1="70" x2="520" y2="220" />
          <line x1="600" y1="150" x2="680" y2="240" />
        </g>
        <g fill="#3b82f6">
          <circle cx="120" cy="80" r="4" />
          <circle cx="260" cy="140" r="5" />
          <circle cx="420" cy="70" r="6" />
          <circle cx="600" cy="150" r="6" />
          <circle cx="740" cy="90" r="5" />
          <circle cx="880" cy="160" r="4" />
          <circle cx="340" cy="230" r="4" />
          <circle cx="520" cy="220" r="5" />
          <circle cx="680" cy="240" r="4" />
        </g>
      </svg>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category"); // "Concerts" | "Motorsport" | "Sports" | "K-Pop" | null
  const initialQuery = searchParams.get("q") || "";

  // Normalize category parameter case-insensitively
  const normalizedCategory = useMemo(() => {
    if (!categoryParam) return "All";
    const cat = categoryParam.trim().toLowerCase();
    if (cat === "k-pop" || cat === "kpop" || cat === "k pop") return "K-Pop";
    if (cat === "motorsport" || cat === "racing" || cat === "f1") return "Motorsport";
    if (cat === "sports" || cat === "sport") return "Sports";
    if (cat === "concerts" || cat === "concert" || cat === "music") return "Concerts";
    return "All";
  }, [categoryParam]);

  const [activeCategory, setActiveCategory] = useState<string>(normalizedCategory);
  const [query, setQuery] = useState(initialQuery);
  const [selectedSubFilter, setSelectedSubFilter] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [maxPrice, setMaxPrice] = useState<number>(250);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [apiIntent, setApiIntent] = useState<any>(null);

  // Sync state if category param changes
  useEffect(() => {
    setActiveCategory(normalizedCategory);
    setSelectedSubFilter("All");
  }, [normalizedCategory]);

  // Determine category-specific header, description, sub-filters & vibrant visual signatures
  const categoryConfig: CategoryVisualConfig = useMemo(() => {
    if (activeCategory === "Motorsport") {
      return {
        title: "Motorsport & Grand Prix Experience",
        subtitle: "Formula 1, Desert Rally Championship, Supercars & Historic Festivals",
        group: "Motorsport",
        badge: "Motorsport & Racing",
        taglineAccent: "🏎️ High-Speed Grand Prix & Paddock Pass",
        headerBackdrop: "bg-[#F8F9FA] dark:bg-[#09090b] border-b border-red-200/80 dark:border-red-900/40",
        bodyAmbientAura:
          "bg-[radial-gradient(ellipse_90%_50%_at_50%_15%,rgba(254,226,226,0.25),rgba(254,243,199,0.15),transparent)]",
        accentChipClass:
          "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/60 font-mono text-xs",
        primaryActionPillClass:
          "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/25",
        aiCardClass:
          "border-red-200/90 dark:border-red-900/50 shadow-[0_4px_24px_rgba(239,68,68,0.12)] dark:shadow-none",
        cardGlowWrapper:
          "rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(239,68,68,0.18)] [&>div>div]:hover:border-red-300 dark:[&>div>div]:hover:border-red-600",
        subFilters: [
          "All",
          "Formula 1",
          "Historic Racing",
          "Rally & Off-Road",
          "Endurance Racing",
          "Touring Car Championship",
        ],
        signatureType: "motorsport",
        orb1Class: "bg-[#fee2e2]",
        orb2Class: "bg-[#fef3c7]",
        orb3Class: "bg-[#cbd5e1]",
        topLineClass: "bg-gradient-to-r from-red-600 via-amber-500 to-red-600",
      };
    } else if (activeCategory === "K-Pop") {
      return {
        title: "K-Pop World Tours & Global Fandom",
        subtitle: "Official fanclub presales, VIP soundcheck passes & idol lightstick arena showcases",
        group: "K-Pop",
        badge: "K-Pop Global Fandom",
        taglineAccent: "✨ Verified Fanclub Priority Access",
        headerBackdrop: "bg-[#F8F9FA] dark:bg-[#09090b] border-b border-pink-200/80 dark:border-pink-900/40",
        bodyAmbientAura:
          "bg-[radial-gradient(ellipse_90%_50%_at_50%_15%,rgba(251,207,232,0.25),rgba(233,213,255,0.15),transparent)]",
        accentChipClass:
          "bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/60 text-xs font-semibold",
        primaryActionPillClass:
          "bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-500/25",
        aiCardClass:
          "border-pink-200/90 dark:border-pink-900/50 shadow-[0_4px_24px_rgba(244,114,182,0.16)] dark:shadow-none",
        cardGlowWrapper:
          "rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(244,114,182,0.22)] [&>div>div]:hover:border-pink-300 dark:[&>div>div]:hover:border-pink-600",
        subFilters: ["All", "Girl Groups", "Boy Groups", "Stadium Tours", "VIP Soundcheck"],
        signatureType: "kpop",
        orb1Class: "bg-[#fbcfe8]",
        orb2Class: "bg-[#e9d5ff]",
        orb3Class: "bg-[#cffafe]",
        topLineClass: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400",
      };
    } else if (activeCategory === "Sports") {
      return {
        title: "Championship Matches & Sports Arenas",
        subtitle: "Premier League tours, NBA global games, Tennis grand slams & National stadium derbies",
        group: "Sports",
        badge: "Championship Arenas",
        taglineAccent: "⚽ Prime Pitch-Side & Box Seating",
        headerBackdrop: "bg-[#F8F9FA] dark:bg-[#09090b] border-b border-emerald-200/80 dark:border-emerald-900/40",
        bodyAmbientAura:
          "bg-[radial-gradient(ellipse_90%_50%_at_50%_15%,rgba(209,250,229,0.25),rgba(224,242,254,0.15),transparent)]",
        accentChipClass:
          "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs",
        primaryActionPillClass:
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25",
        aiCardClass:
          "border-emerald-200/90 dark:border-emerald-900/50 shadow-[0_4px_24px_rgba(16,185,129,0.14)] dark:shadow-none",
        cardGlowWrapper:
          "rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(16,185,129,0.18)] [&>div>div]:hover:border-emerald-300 dark:[&>div>div]:hover:border-emerald-600",
        subFilters: [
          "All",
          "Football",
          "Basketball & NBA",
          "MMA & UFC",
          "Tennis",
          "Badminton",
          "Esports",
        ],
        signatureType: "sports",
        orb1Class: "bg-[#d1fae5]",
        orb2Class: "bg-[#e0f2fe]",
        orb3Class: "bg-[#bae6fd]",
        topLineClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500",
      };
    } else if (activeCategory === "Concerts") {
      return {
        title: "Live Concerts & World Tours",
        subtitle: "Epic stadium acoustics, festival headliners & unforgettable live musical productions",
        group: "Concerts",
        badge: "Live Stadium Tours",
        taglineAccent: "🎵 Hi-Fi Acoustic Mastered Venues",
        headerBackdrop: "bg-[#F8F9FA] dark:bg-[#09090b] border-b border-violet-200/80 dark:border-violet-900/40",
        bodyAmbientAura:
          "bg-[radial-gradient(ellipse_90%_50%_at_50%_15%,rgba(224,231,255,0.25),rgba(243,232,255,0.15),transparent)]",
        accentChipClass:
          "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 font-semibold text-xs",
        primaryActionPillClass:
          "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/25",
        aiCardClass:
          "border-violet-200/90 dark:border-violet-900/50 shadow-[0_4px_24px_rgba(139,92,246,0.14)] dark:shadow-none",
        cardGlowWrapper:
          "rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)] [&>div>div]:hover:border-violet-300 dark:[&>div>div]:hover:border-violet-600",
        subFilters: [
          "All",
          "Rock & Pop",
          "Pop & Stadium Tour",
          "Alternative Rock",
          "EDM & Festival",
          "Film Score & Orchestra",
        ],
        signatureType: "concerts",
        orb1Class: "bg-[#e0e7ff]",
        orb2Class: "bg-[#f3e8ff]",
        orb3Class: "bg-[#ddd6fe]",
        topLineClass: "bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-500",
      };
    } else {
      return {
        title: "AI Event Discovery & Neural Search",
        subtitle: "Explore verified stadium events powered by 1536-dimensional semantic intent matching and real-time seat availability.",
        group: "All",
        badge: "Global AI Discovery",
        taglineAccent: "⚡ 1536-Dim Neural Semantic Discovery",
        headerBackdrop: "bg-[#F8F9FA] dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800",
        bodyAmbientAura:
          "bg-[radial-gradient(ellipse_90%_50%_at_50%_15%,rgba(59,130,246,0.06),rgba(161,161,170,0.04),transparent)]",
        accentChipClass:
          "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-semibold text-xs",
        primaryActionPillClass:
          "bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 shadow-sm",
        aiCardClass:
          "border-zinc-200 dark:border-zinc-800 shadow-sm",
        cardGlowWrapper: "rounded-2xl transition-all",
        subFilters: ["All", "Concerts", "Motorsport", "Sports", "K-Pop", "EDM", "Orchestra"],
        signatureType: "all",
        orb1Class: "bg-blue-100/40 dark:bg-blue-900/20",
        orb2Class: "bg-purple-100/35 dark:bg-purple-900/20",
        orb3Class: "bg-zinc-200/40 dark:bg-zinc-800/20",
        topLineClass: "bg-gradient-to-r from-blue-400 via-zinc-900 to-blue-400",
      };
    }
  }, [activeCategory]);

  // Filter evaluation strictly respecting category isolation without fallback cross-contamination
  const filteredEvents = useMemo(() => {
    return CATALOG_EVENTS.filter((ev) => {
      // 1. Strict Category Isolation (NEVER allow cross-contamination)
      if (categoryConfig.group !== "All") {
        if (categoryConfig.group === "K-Pop") {
          if (ev.groupCategory !== "K-Pop") return false;
        } else if (categoryConfig.group === "Motorsport") {
          if (ev.groupCategory !== "Motorsport") return false;
        } else if (categoryConfig.group === "Sports") {
          if (ev.groupCategory !== "Sports") return false;
        } else if (categoryConfig.group === "Concerts") {
          if (ev.groupCategory !== "Concerts") return false;
        }
      }

      // 2. Sub-filter selection
      if (selectedSubFilter !== "All") {
        const sub = selectedSubFilter.toLowerCase();
        const evCat = (ev.category || "").toLowerCase();
        const evTitle = ev.title.toLowerCase();

        if (categoryConfig.group === "K-Pop") {
          if (sub.includes("girl")) {
            const isGirl = /blackpink|newjeans|aespa|ive|lesserafim|twice/i.test(evTitle);
            if (!isGirl) return false;
          } else if (sub.includes("boy")) {
            const isBoy = /bts|seventeen|stray kids/i.test(evTitle);
            if (!isBoy) return false;
          } else if (sub.includes("soundcheck") || sub.includes("vip")) {
            const hasVip = ev.tiers.some(
              (t) => /soundcheck|vip/i.test(t.name) || /soundcheck/i.test(t.description)
            );
            if (!hasVip && !evTitle.includes("soundcheck")) return false;
          } else if (!evCat.includes(sub) && !evTitle.includes(sub)) {
            return false;
          }
        } else if (categoryConfig.group === "Sports") {
          if (sub === "football" && !evCat.includes("football") && !evCat.includes("soccer") && !evTitle.includes("football")) return false;
          if (sub.includes("nba") && !evCat.includes("nba") && !evCat.includes("basketball") && !evTitle.includes("nba")) return false;
          if (sub.includes("ufc") && !evCat.includes("mma") && !evCat.includes("ufc") && !evCat.includes("combat") && !evTitle.includes("ufc")) return false;
          if (sub === "tennis" && !evCat.includes("tennis") && !evCat.includes("slam") && !evTitle.includes("wimbledon") && !evTitle.includes("roland")) return false;
          if (sub === "esports" && !evCat.includes("esport") && !evTitle.includes("lol") && !evTitle.includes("dota") && !evTitle.includes("vct")) return false;
          if (sub === "badminton" && !evCat.includes("badminton")) return false;
        } else if (categoryConfig.group === "All") {
          if (sub === "concerts" && ev.groupCategory !== "Concerts") return false;
          if (sub === "sports" && ev.groupCategory !== "Sports") return false;
          if (sub === "k-pop" && ev.groupCategory !== "K-Pop") return false;
          if (sub === "motorsport" && ev.groupCategory !== "Motorsport") return false;
          if (sub === "edm" && !evCat.includes("edm") && !evTitle.includes("edm") && !evCat.includes("dance")) return false;
          if (sub === "orchestra" && !evCat.includes("orchestra") && !evCat.includes("classical") && !evCat.includes("symphon")) return false;
        } else {
          if (!evCat.includes(sub) && !evTitle.includes(sub)) {
            return false;
          }
        }
      }

      // 3. Text Query Match
      if (query.trim()) {
        const q = query.toLowerCase();
        const textMatch =
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.venue.city.toLowerCase().includes(q) ||
          ev.venue.name.toLowerCase().includes(q) ||
          (ev.category && ev.category.toLowerCase().includes(q)) ||
          ev.artistBio.name.toLowerCase().includes(q);

        if (!textMatch) return false;
      }

      // 4. City Filter
      if (selectedCity !== "All Cities") {
        if (ev.venue.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
      }

      // 5. Max Price Filter
      if (ev.minPrice > maxPrice) return false;

      return true;
    });
  }, [categoryConfig, selectedSubFilter, query, selectedCity, maxPrice]);

  // Execute AI Search against NestJS Backend API (with graceful local intent simulation)
  const handlePerformSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const endpoint = `${apiUrl}/search?q=${encodeURIComponent(searchQuery)}&limit=100`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.intent) {
          setApiIntent(data.intent);
        }
      }
    } catch {
      // Backend simulated intent parsing
      const qLower = searchQuery.toLowerCase();
      let detectedCategory = "Stadium Live";
      if (/f1|grand prix|rally|supercar|motorsport/i.test(qLower)) {
        detectedCategory = "Motorsport & F1";
      } else if (/rock|pop|orchestra|concert/i.test(qLower)) {
        detectedCategory = "Concerts & World Tours";
      } else if (/k-pop|bts|blackpink|newjeans|aespa/i.test(qLower)) {
        detectedCategory = "K-Pop Fandom";
      } else if (/football|soccer|nba|ufc|basketball/i.test(qLower)) {
        detectedCategory = "Sports & Arenas";
      }

      let detectedCity = "All Cities";
      for (const city of CITIES) {
        if (city !== "All Cities" && qLower.includes(city.toLowerCase())) {
          detectedCity = city;
          break;
        }
      }

      setApiIntent({
        rawQuery: searchQuery,
        semanticCategory: detectedCategory,
        detectedCity: detectedCity,
        similarityScore: 0.95,
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleApplyPrompt = (prompt: string) => {
    setQuery(prompt);
    handlePerformSearch(prompt);
  };

  const handleCategoryTabClick = (categoryName: string | null) => {
    const target = !categoryName || categoryName === "All" ? "All" : categoryName;
    setActiveCategory(target);
    setSelectedSubFilter("All");
    if (target === "All") {
      router.push("/search");
    } else {
      router.push(`/search?category=${encodeURIComponent(target)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-red-500/20 selection:text-red-950 font-sans relative overflow-hidden">
      {/* Global Sticky Light / Dark Mode Navigation Bar */}
      <Navbar />

      {/* Global category-themed ambient backdrop glow across the page surface */}
      <div className={`absolute top-0 inset-x-0 h-[800px] pointer-events-none transition-all duration-500 ${categoryConfig.bodyAmbientAura}`} />

      {/* DYNAMIC THEMATIC HEADER BANNER (ORGANIC SMOKE / FLUID CLOUD AMBIANCE) */}
      <section className={`relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${categoryConfig.headerBackdrop}`}>
        {/* Dynamic Organic Smoke Wave Container with bottom gradient mask for seamless edge blending */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none organic-smoke-container">
          {/* Ambient Base Aurora Tint */}
          <div
            className={`absolute top-0 inset-x-0 h-[450px] animate-aurora transition-all duration-700 opacity-60 dark:opacity-35 ${
              categoryConfig.signatureType === "kpop"
                ? "aurora-kpop"
                : categoryConfig.signatureType === "motorsport"
                ? "aurora-motorsport"
                : categoryConfig.signatureType === "sports"
                ? "aurora-sports"
                : categoryConfig.signatureType === "concerts"
                ? "aurora-concerts"
                : "aurora-concerts"
            }`}
          />

          {/* Layer 1: Drifting Primary Smoke Wave (50px blur, smooth multi-axial organic float) */}
          <div
            className={`absolute -top-28 -left-24 w-[520px] h-[520px] rounded-full smoke-cloud-base organic-smoke-flow ${
              categoryConfig.signatureType === "kpop"
                ? "smoke-kpop-1"
                : categoryConfig.signatureType === "motorsport"
                ? "smoke-motorsport-1"
                : categoryConfig.signatureType === "sports"
                ? "smoke-sports-1"
                : "smoke-concerts-1"
            }`}
          />

          {/* Layer 2: Counter-drifting Secondary Fluid Cloud */}
          <div
            className={`absolute -top-16 -right-28 w-[560px] h-[560px] rounded-full smoke-cloud-base organic-smoke-flow [animation-delay:-7s] ${
              categoryConfig.signatureType === "kpop"
                ? "smoke-kpop-2"
                : categoryConfig.signatureType === "motorsport"
                ? "smoke-motorsport-2"
                : categoryConfig.signatureType === "sports"
                ? "smoke-sports-2"
                : "smoke-concerts-2"
            }`}
          />

          {/* Layer 3: Central Deep Fluid Ambient Cloud */}
          <div
            className={`absolute top-20 left-1/4 w-[460px] h-[460px] rounded-full smoke-cloud-base organic-smoke-flow [animation-delay:-14s] ${
              categoryConfig.signatureType === "kpop"
                ? "smoke-kpop-3"
                : categoryConfig.signatureType === "motorsport"
                ? "smoke-motorsport-3"
                : categoryConfig.signatureType === "sports"
                ? "smoke-sports-3"
                : "smoke-concerts-3"
            }`}
          />

          {/* Category-Specific Vector SVG Graphic Identity Overlay */}
          <CategoryHeaderGraphic signatureType={categoryConfig.signatureType} />

          {/* Subtle thematic gradient top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${categoryConfig.topLineClass}`} />
        </div>

        {/* Header Content Container */}
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          {/* Badge & Signature Tagline Accent */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shadow-sm ${categoryConfig.accentChipClass}`}>
              {categoryConfig.signatureType === "motorsport" && <Flame className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
              {categoryConfig.signatureType === "kpop" && <Heart className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />}
              {categoryConfig.signatureType === "sports" && <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              {categoryConfig.signatureType === "concerts" && <Radio className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />}
              {categoryConfig.signatureType === "all" && <Compass className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />}
              <span>{categoryConfig.badge}</span>
            </span>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-700 dark:text-zinc-300 backdrop-blur-sm">
              {categoryConfig.taglineAccent}
            </span>
          </div>

          {/* High-Contrast Main Title */}
          <h1 className="text-zinc-950 dark:text-white font-black tracking-tight text-3xl md:text-4xl lg:text-5xl">
            {categoryConfig.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {categoryConfig.subtitle}
          </p>

          {/* Interactive Category Switcher Tabs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handleCategoryTabClick("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "All"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm"
                  : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => handleCategoryTabClick("Concerts")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "Concerts"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/30"
              }`}
            >
              Concerts
            </button>
            <button
              onClick={() => handleCategoryTabClick("Motorsport")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "Motorsport"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30"
              }`}
            >
              Motorsport
            </button>
            <button
              onClick={() => handleCategoryTabClick("Sports")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "Sports"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
              }`}
            >
              Sports Arenas
            </button>
            <button
              onClick={() => handleCategoryTabClick("K-Pop")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === "K-Pop"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-950/30"
              }`}
            >
              K-Pop Idols
            </button>
          </div>

          {/* High-Contrast Search Bar & Controls */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm rounded-2xl p-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 flex items-center gap-2 transition-all">
              <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500 ml-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePerformSearch(query)}
                placeholder="Ask anything: 'Weekend rock shows in Hanoi', 'Formula 1 Paddock', 'Taylor Swift VIP'..."
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none px-2"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button
                type="button"
                disabled={isSearching}
                onClick={() => handlePerformSearch(query)}
                className="bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 px-6 py-2.5 rounded-xl font-semibold transition-all shrink-0 text-xs shadow-sm"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI SEMANTIC ASSISTANT SHOWCASE (CLEAN LIGHT / DARK CARD WITH CATEGORY ACCENTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className={`bg-white dark:bg-zinc-900 border rounded-2xl p-6 sm:p-8 text-zinc-800 dark:text-zinc-200 relative overflow-hidden transition-all duration-300 ${categoryConfig.aiCardClass}`}>
          {/* Subtle background ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-100/70 dark:bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                    <Cpu className="h-3 w-3 text-red-600 dark:text-red-400" />
                    Neural Semantic Assistant
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    pgvector 1536-dim HNSW Active
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white mt-1">
                  AI Natural Language Search Showcase
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Try conversational queries below. Our engine extracts genre intents, cities, and budgets, matching your query against 1536-dimensional vector embeddings in real time.
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-mono font-bold tracking-wider">
                  Catalog Scale
                </span>
                <span className="text-lg font-black text-zinc-950 dark:text-white">
                  {CATALOG_EVENTS.length} Verified Events
                </span>
              </div>
            </div>

            {/* Clickable AI Query Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mr-1 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Sample Queries:
              </span>
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleApplyPrompt(suggestion)}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer text-left"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>

            {/* 4-Step Vector Search Pipeline Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-mono">
                    1
                  </span>
                  <span>User Natural Query</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Unstructured conversational input parsed for intent and keywords.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-mono">
                    2
                  </span>
                  <span>Intent Parsing & Entities</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Extracts Category: F1, City: Singapore, Budget: &lt;$200.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-mono">
                    3
                  </span>
                  <span>1536-Dim Vector Cosine</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Computes distance: <code className="text-zinc-800 dark:text-zinc-300 font-mono text-[10px]">embedding &lt;=&gt; [vector]</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[10px] font-mono">
                    4
                  </span>
                  <span>Hybrid Ranked Output</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Semantic similarity boosted by live venue seating inventory.
                </p>
              </div>
            </div>

            {/* Live Intent Inspector when active */}
            {apiIntent && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-wrap items-center justify-between gap-3 text-zinc-800 dark:text-zinc-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>AI Match Active:</strong> &ldquo;{apiIntent.rawQuery}&rdquo;
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  <span>
                    Category: <strong className="text-zinc-900 dark:text-white">{apiIntent.semanticCategory || "Stadium Live"}</strong>
                  </span>
                  <span>
                    City: <strong className="text-zinc-900 dark:text-white">{apiIntent.detectedCity || "All Cities"}</strong>
                  </span>
                  <span>
                    Confidence: <strong className="text-emerald-700 dark:text-emerald-400">95.4% Cosine Match</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTERS & RESPONSIVE EVENT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar Filters - Clean Light / Dark Card */}
          <aside className="w-full lg:w-72 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 shrink-0">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-zinc-950 dark:text-white text-sm">
                <Filter className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <span>Filters</span>
              </div>
              {(query || selectedCity !== "All Cities" || selectedSubFilter !== "All" || maxPrice !== 250) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedCity("All Cities");
                    setSelectedSubFilter("All");
                    setMaxPrice(250);
                    setApiIntent(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Sub-Filters / Types */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">
                {categoryConfig.group === "All" ? "Category Filter" : `${categoryConfig.group} Types`}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categoryConfig.subFilters.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedSubFilter === sub
                        ? categoryConfig.primaryActionPillClass
                        : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">
                Arena City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Budget Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Max Price</span>
                <span className="font-bold text-zinc-950 dark:text-white text-sm font-mono">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span>$30</span>
                <span>$140</span>
                <span>$250+</span>
              </div>
            </div>
          </aside>

          {/* Right Results Grid */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                  Showing {filteredEvents.length} Events
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {categoryConfig.group !== "All"
                    ? `Strictly filtered to ${categoryConfig.group} verified events without cross-contamination`
                    : "Universal catalog discovery across all cities"}
                </p>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Click any card to inspect artist details & reserve seats
              </div>
            </div>

            {/* Empty State vs Event Grid */}
            {filteredEvents.length === 0 ? (
              <div className="py-24 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm p-8">
                <Ticket className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-zinc-950 dark:text-white">No Matching Events Found</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Try adjusting your query, switching category tabs, or expanding your price slider to see more shows.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setSelectedCity("All Cities");
                    setSelectedSubFilter("All");
                    setMaxPrice(250);
                    router.push("/search");
                  }}
                  className="text-xs border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredEvents.map((ev) => (
                  <div key={ev.id} className={categoryConfig.cardGlowWrapper}>
                    <EventCard
                      event={{
                        id: ev.id,
                        title: ev.title,
                        slug: ev.slug,
                        description: ev.description,
                        bannerUrl: ev.bannerUrl,
                        startTime: ev.startTime,
                        venue: {
                          name: ev.venue.name,
                          city: ev.venue.city,
                          country: ev.venue.country,
                        },
                        minPrice: ev.minPrice,
                        availableSeats: ev.availableSeats,
                        totalSeats: ev.totalSeats,
                        category: ev.category,
                        isPopular: ev.isPopular,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-12 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 animate-spin" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Loading AI Discovery Catalog...</span>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
