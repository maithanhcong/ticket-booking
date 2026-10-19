"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventCard, EventCardData, EventCardSkeleton } from "@/components/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Sparkles,
  Zap,
  Shield,
  Search,
  ArrowRight,
  LogOut,
  Compass,
  Flame,
  Star,
  Music,
  Trophy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CATALOG_EVENTS, CatalogEvent } from "@/lib/events-catalog";
import { PersonalizedForYou } from "@/components/ai/PersonalizedForYou";

interface CuratedSectionProps {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor?: string;
  icon: React.ReactNode;
  viewAllLink?: string;
  viewAllText?: string;
  children: React.ReactNode;
}

function CuratedTrack({
  id,
  title,
  subtitle,
  badgeText,
  badgeColor = "border-red-200/80 text-red-600 bg-red-50",
  icon,
  viewAllLink,
  viewAllText = "View All Passes",
  children,
}: CuratedSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (trackRef.current) {
      const scrollAmount = direction === "left" ? -380 : 380;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Hover detection: pauses marquee ticker while cursor is inside
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  // Mouse Grab-and-Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only respond to primary left click
    const container = trackRef.current;
    if (!container) return;

    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !trackRef.current) return;
    e.preventDefault();

    const container = trackRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;

    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }

    let targetScrollLeft = scrollLeftRef.current - walk;
    const halfWidth = container.scrollWidth / 2;

    // Seamless infinite wrap during dragging
    if (halfWidth > container.clientWidth) {
      if (targetScrollLeft >= halfWidth) {
        targetScrollLeft -= halfWidth;
        scrollLeftRef.current -= halfWidth;
      } else if (targetScrollLeft < 0) {
        targetScrollLeft += halfWidth;
        scrollLeftRef.current += halfWidth;
      }
    }

    container.scrollLeft = targetScrollLeft;
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = "grab";
      trackRef.current.style.userSelect = "";
    }
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
    isHoveredRef.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = "grab";
      trackRef.current.style.userSelect = "";
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    hasDraggedRef.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDownRef.current) {
        isDownRef.current = false;
        if (trackRef.current) {
          trackRef.current.style.cursor = "grab";
          trackRef.current.style.userSelect = "";
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Marquee auto-scroll loop
  useEffect(() => {
    let lastTimestamp = performance.now();
    const scrollSpeed = 40;

    const step = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!isHoveredRef.current && !isDownRef.current && trackRef.current) {
        const el = trackRef.current;
        const halfWidth = el.scrollWidth / 2;

        if (halfWidth > el.clientWidth) {
          el.scrollLeft += scrollSpeed * delta;

          if (el.scrollLeft >= halfWidth) {
            el.scrollLeft -= halfWidth;
          } else if (el.scrollLeft < 0) {
            el.scrollLeft += halfWidth;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <section id={id} className="py-8 scroll-mt-28 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${badgeColor}`}
          >
            {icon}
            <span>{badgeText}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
            <span>{title}</span>
          </h2>
          <p className="text-zinc-700 dark:text-zinc-400 font-medium text-xs mt-0.5 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Horizontal Scroll Arrows */}
          <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {viewAllLink && (
            <Link href={viewAllLink}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm">
                <span>{viewAllText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Scrolling Card Track with Continuous 60fps Marquee & Drag Physics */}
      <div
        ref={trackRef}
        onDragStart={(e) => e.preventDefault()}
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClickCapture={handleClickCapture}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-1 no-scrollbar scrollbar-none select-none px-1 sm:px-0 cursor-grab"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "auto",
        }}
      >
        {children}
        {/* Cloned seamless infinite loop elements */}
        {React.Children.map(children, (child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                key: `clone-${index}`,
                "aria-hidden": true,
              } as React.HTMLAttributes<HTMLElement>)
            : child
        )}
      </div>
    </section>
  );
}

interface HeroFeaturedSlide {
  id: string;
  pillar: "Motorsport" | "K-Pop" | "Concerts" | "Sports";
  categoryBadge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  date: string;
  priceFrom: string;
  place: string;
  address: string;
  slug: string;
  bannerUrl: string;
  auroraClass: string;
  ctaColor: string;
  ctaShadow: string;
}

const FEATURED_HERO_SLIDES: HeroFeaturedSlide[] = [
  {
    id: "historic-festival-42-lime-rock",
    pillar: "Motorsport",
    categoryBadge: "MOTORSPORT ON SALE",
    badgeColor: "bg-red-600 text-white shadow-red-600/30",
    title: "Historic Festival 42: Lime Rock Park",
    subtitle:
      "Lime Rock Park's annual Historic Festival is unlike any other automotive showcase in the world. Experience five days of premier motoring magnificence and world-class competition.",
    date: "AUG 30 - SEP 02 / 2026",
    priceFrom: "$110.00",
    place: "Lime Rock Park",
    address: "Lakeville, CT 🏁",
    slug: "historic-festival-42-lime-rock",
    bannerUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1920&q=80",
    auroraClass: "aurora-motorsport",
    ctaColor: "bg-red-600 hover:bg-red-700 text-white",
    ctaShadow: "shadow-red-600/35",
  },
  {
    id: "seventeen-right-here-world-tour",
    pillar: "K-Pop",
    categoryBadge: "K-POP WORLD TOUR",
    badgeColor: "bg-pink-600 text-white shadow-pink-600/30",
    title: "SEVENTEEN [RIGHT HERE] World Tour",
    subtitle:
      "Witness K-Pop powerhouse SEVENTEEN illuminate the National Stadium with a breathtaking 3-hour stadium spectacular, synchronized CARAT lightsticks, and full live band orchestration.",
    date: "NOV 14 - NOV 16 / 2026",
    priceFrom: "$145.00",
    place: "Singapore National Stadium",
    address: "Kallang, Singapore 🌸",
    slug: "seventeen-right-here-world-tour",
    bannerUrl:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1920&q=80",
    auroraClass: "aurora-kpop",
    ctaColor: "bg-pink-600 hover:bg-pink-700 text-white",
    ctaShadow: "shadow-pink-600/35",
  },
  {
    id: "coldplay-music-of-the-spheres-world-tour",
    pillar: "Concerts",
    categoryBadge: "CONCERTS & TOURS",
    badgeColor: "bg-violet-600 text-white shadow-violet-600/30",
    title: "Coldplay: Music of the Spheres World Tour",
    subtitle:
      "A transcendent cosmic spectacle featuring kinetic dance floors, kinetic energy bikes, mind-blowing pyrotechnics, and laser-lit stadium anthems that unite 60,000 voices under the stars.",
    date: "OCT 12 - OCT 15 / 2026",
    priceFrom: "$125.00",
    place: "My Dinh National Stadium",
    address: "Hanoi, Vietnam ✨",
    slug: "coldplay-music-of-the-spheres-world-tour",
    bannerUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80",
    auroraClass: "aurora-concerts",
    ctaColor: "bg-violet-600 hover:bg-violet-700 text-white",
    ctaShadow: "shadow-violet-600/35",
  },
  {
    id: "premier-league-summer-series-london-derby",
    pillar: "Sports",
    categoryBadge: "PREMIER LEAGUE DERBY",
    badgeColor: "bg-emerald-600 text-white shadow-emerald-600/30",
    title: "Premier League Asian Tour: Liverpool vs Arsenal",
    subtitle:
      "English football elite collide in an electrifying pre-season clash in Tokyo. Experience world-class tactical mastery, thunderous stadium roar, and pitch-side VIP hospitality.",
    date: "JUL 26 / 2026",
    priceFrom: "$160.00",
    place: "Japan National Stadium",
    address: "Tokyo, Japan ⚽",
    slug: "premier-league-summer-series-london-derby",
    bannerUrl:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80",
    auroraClass: "aurora-sports",
    ctaColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ctaShadow: "shadow-emerald-600/35",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [activeSection, setActiveSection] = useState("general-admission");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  const [hotWeekEvents, setHotWeekEvents] = useState<EventCardData[]>([]);
  const [hotMonthEvents, setHotMonthEvents] = useState<EventCardData[]>([]);
  const [kpopEvents, setKpopEvents] = useState<EventCardData[]>([]);
  const [sportsEvents, setSportsEvents] = useState<EventCardData[]>([]);
  const [flashSaleEvents, setFlashSaleEvents] = useState<EventCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Automated 5.5-second carousel timer with pause on hover
  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURED_HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);

        const mappedAll: EventCardData[] = CATALOG_EVENTS.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          description: item.description,
          bannerUrl: item.bannerUrl,
          startTime: item.startTime,
          venue: {
            name: item.venue.name,
            city: item.venue.city,
            country: item.venue.country,
          },
          minPrice: item.minPrice,
          availableSeats: item.availableSeats,
          totalSeats: item.totalSeats,
          category: item.category,
          isPopular: item.isPopular,
        }));

        setHotWeekEvents(mappedAll.slice(0, 8));
        setHotMonthEvents(mappedAll.slice(8, 16));
        setKpopEvents(mappedAll.filter((e) => (e.category || "").includes("K-Pop") || (e.title || "").includes("BLACKPINK") || (e.title || "").includes("BTS") || (e.title || "").includes("aespa") || (e.title || "").includes("Seventeen")).slice(0, 8));
        setSportsEvents(mappedAll.filter((e) => (e.category || "").includes("Sports") || (e.category || "").includes("Football") || (e.category || "").includes("NBA") || (e.category || "").includes("F1") || (e.category || "").includes("UFC")).slice(0, 8));
        setFlashSaleEvents(mappedAll.filter((e) => e.availableSeats / (e.totalSeats || 1) < 0.25).slice(0, 8));
      } catch (err) {
        console.error("Error initializing catalog:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const NAV_PILLS = [
    {
      id: "for-you",
      label: "AI FOR YOU (04)",
      icon: <Sparkles className="h-3.5 w-3.5 text-violet-500" />,
    },
    {
      id: "general-admission",
      label: "GENERAL ADMISSION (05)",
      icon: <Ticket className="h-3.5 w-3.5 text-red-500" />,
    },
    {
      id: "camping",
      label: "CAMPING & RV (06)",
      icon: <Flame className="h-3.5 w-3.5 text-amber-500" />,
    },
    {
      id: "hospitality",
      label: "HOSPITALITY (08)",
      icon: <Star className="h-3.5 w-3.5 text-yellow-500" />,
    },
    {
      id: "parking",
      label: "PARKING & PASSES (05)",
      icon: <Trophy className="h-3.5 w-3.5 text-emerald-500" />,
    },
    {
      id: "all-events",
      label: "ALL 51 SHOWS",
      icon: <Music className="h-3.5 w-3.5 text-blue-500" />,
    },
  ];

  const activeSlide = FEATURED_HERO_SLIDES[currentSlide];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F9FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-red-500/20 selection:text-red-950">
      {/* Header Navigation */}
      <Navbar />

      {/* Top Hero Section: Automated Cinematic Featured Showcase Carousel */}
      <section
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className="min-h-[520px] lg:min-h-[580px] w-full min-w-full relative overflow-hidden bg-zinc-950 text-white group/hero select-none flex flex-col justify-end"
      >
        {/* Layered Crossfading Backdrops for all 4 Pillars */}
        {FEATURED_HERO_SLIDES.map((slide, idx) => {
          const isActive = currentSlide === idx;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full min-w-full h-full z-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.bannerUrl}
                alt={slide.title}
                className="h-full w-full min-w-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
              />
              {/* Pillar Ambient Aurora - Subtle hardware-accelerated color tint */}
              <div
                className={`absolute top-0 inset-x-0 w-full h-[320px] pointer-events-none animate-aurora ${slide.auroraClass} opacity-25 mix-blend-screen`}
              />
            </div>
          );
        })}

        {/* Carousel Navigation Arrow Controls (Previous / Next) */}
        <button
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + FEATURED_HERO_SLIDES.length) % FEATURED_HERO_SLIDES.length
            )
          }
          aria-label="Previous featured event"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % FEATURED_HERO_SLIDES.length)
          }
          aria-label="Next featured event"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Foreground Content Container - Full Width on Mobile with px-3 md:px-0 inside max-w-7xl */}
        <div className="relative z-10 max-w-7xl mx-auto w-full min-w-full px-3 md:px-0 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 flex flex-col justify-end">
          {/* Direct typography on raw image with zero dark background boxes */}
          <div className="max-w-2xl px-1 sm:px-0">
            {/* Top Tag & Status Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md transition-all duration-300 ${activeSlide.badgeColor}`}
              >
                {activeSlide.categoryBadge}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/30 text-white/95 shadow-xs">
                Live Verified Booking
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 border border-white/20 text-white/95">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeSlide.pillar} Showcase
              </span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words">
              {activeSlide.title}
            </h1>
            <p className="mt-2 text-xs sm:text-base text-white/95 leading-relaxed line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {activeSlide.subtitle}
            </p>
          </div>

          {/* Metadata Row & Primary CTA Button */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 px-1 sm:px-0">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="bg-black/50 backdrop-blur-md border border-white/20 text-white/95 text-xs px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="text-zinc-300 uppercase tracking-wider text-[10px] font-bold">
                  Date:
                </span>
                <span className="font-semibold text-xs">{activeSlide.date}</span>
              </div>
              <div className="bg-black/50 backdrop-blur-md border border-white/20 text-white/95 text-xs px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="text-zinc-300 uppercase tracking-wider text-[10px] font-bold">
                  Price From:
                </span>
                <span className="font-bold text-red-400 font-mono text-xs">
                  {activeSlide.priceFrom}
                </span>
              </div>
              <div className="bg-black/50 backdrop-blur-md border border-white/20 text-white/95 text-xs px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="text-zinc-300 uppercase tracking-wider text-[10px] font-bold">
                  Place:
                </span>
                <span className="font-semibold text-xs">{activeSlide.place}</span>
              </div>
              <div className="bg-black/50 backdrop-blur-md border border-white/20 text-white/95 text-xs px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="text-zinc-300 uppercase tracking-wider text-[10px] font-bold">
                  Address:
                </span>
                <span className="font-semibold text-xs">{activeSlide.address}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
              <Link href={`/events/${activeSlide.slug}`} className="w-full sm:w-auto">
                <button
                  type="button"
                  className={`w-full sm:w-auto justify-center rounded-xl px-6 sm:px-7 py-3 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${activeSlide.ctaColor} ${activeSlide.ctaShadow}`}
                >
                  <Ticket className="h-4 w-4" />
                  <span>Buy Ticket Now</span>
                </button>
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("general-admission")}
                className="w-full sm:w-auto justify-center bg-black/40 hover:bg-black/60 text-white border border-white/20 rounded-xl px-5 py-3 font-semibold text-xs transition-colors backdrop-blur-md"
              >
                More Info ↗
              </button>
            </div>
          </div>
        </div>

        {/* Position the slide indicator dots/bars directly inside the hero image */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
          {FEATURED_HERO_SLIDES.map((slide, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                className={`focus:outline-none transition-all duration-300 ${
                  isActive
                    ? "w-7 h-1.5 bg-white rounded-full"
                    : "w-2 h-1.5 bg-white/40 rounded-full hover:bg-white/70 cursor-pointer"
                }`}
              />
            );
          })}
        </div>
      </section>

      {/* Sticky Quick-Jump Anchor Category Tabs (Reference: Screenshot 1, 2, 4) */}
      <div className="sticky top-16 z-40 w-full min-w-full border-b border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2">
            {NAV_PILLS.map((pill) => {
              const isActive = activeSection === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => scrollToSection(pill.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? "text-red-600 border-red-500 font-extrabold"
                      : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar inside tab strip */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-1 text-xs">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search festival passes..."
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none w-48"
            />
          </form>
        </div>
      </div>

      {/* Main Curated Multi-Section Container - Clean Light Theme */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* SECTION: AI Tailored Recommendations (Pillar 4: pgvector & text-embedding-004) */}
        <div id="for-you" className="scroll-mt-28">
          <PersonalizedForYou />
        </div>

        {/* SECTION A: General Admission (Screenshot 1 & 2) */}
        <CuratedTrack
          id="general-admission"
          title="General Admission (05 Tickets)"
          subtitle="Single-day flex tickets, trackside perimeter passes, and prime grandstand viewing."
          badgeText="GENERAL ADMISSION"
          badgeColor="border-red-200/80 text-red-600 bg-red-50"
          icon={<Ticket className="h-4 w-4 text-red-600" />}
          viewAllLink="/search"
          viewAllText="View All Tickets"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCardSkeleton />
                </div>
              ))
            : hotWeekEvents.map((event, index) => (
                <div key={event.id} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCard event={event} rank={index + 1} />
                </div>
              ))}
        </CuratedTrack>

        {/* Clean divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 my-8" />

        {/* SECTION B: Camping & RV Paddock Spots (Screenshot 4) */}
        <CuratedTrack
          id="camping"
          title="Camping & RV Paddock Spots"
          subtitle="Trackside reserved RV parking, pit pass camp, and fan zone action camping."
          badgeText="CAMPING & RV"
          badgeColor="border-amber-200/80 text-amber-700 bg-amber-50"
          icon={<Flame className="h-4 w-4 text-amber-600" />}
          viewAllLink="/search"
          viewAllText="Browse RV Spots"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCardSkeleton />
                </div>
              ))
            : hotMonthEvents.map((event) => (
                <div key={event.id} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCard event={event} highlightBadge="RV & Camp" />
                </div>
              ))}
        </CuratedTrack>

        {/* Clean divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 my-8" />

        {/* SECTION C: Paddock Club & VIP Hospitality */}
        <CuratedTrack
          id="hospitality"
          title="Paddock Club & VIP Hospitality"
          subtitle="All-inclusive champagne lounge suites, pit lane walks, and team garage meetups."
          badgeText="VIP HOSPITALITY"
          badgeColor="border-yellow-200/80 text-yellow-800 bg-yellow-50"
          icon={<Star className="h-4 w-4 text-yellow-600" />}
          viewAllLink="/search?category=Sports"
          viewAllText="Explore VIP Club"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCardSkeleton />
                </div>
              ))
            : sportsEvents.map((event) => (
                <div key={event.id} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCard event={event} highlightBadge="Paddock Club" />
                </div>
              ))}
        </CuratedTrack>

        {/* Clean divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 my-8" />

        {/* SECTION D: Paddock Parking & Fast-Track Passes */}
        <CuratedTrack
          id="parking"
          title="Paddock Parking & Fast-Track Gates"
          subtitle="Dedicated infield paved vehicle parking and fast-track express security turnstiles."
          badgeText="PARKING & TURNSTILES"
          badgeColor="border-emerald-200/80 text-emerald-700 bg-emerald-50"
          icon={<Trophy className="h-4 w-4 text-emerald-600" />}
          viewAllLink="/search"
          viewAllText="Reserve Parking"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCardSkeleton />
                </div>
              ))
            : kpopEvents.map((event) => (
                <div key={event.id} className="shrink-0 w-[280px] sm:w-[320px]">
                  <EventCard event={event} highlightBadge="Priority Pass" />
                </div>
              ))}
        </CuratedTrack>

        {/* Clean divider */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 my-8" />

        {/* SECTION E: Full Catalog Showcase Grid */}
        <section id="all-events" className="pt-4 pb-12 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 mb-2 shadow-sm">
                <Ticket className="h-4 w-4 text-red-600" />
                <span>COMPLETE EVENT VAULT</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                All 51+ Verified Events & Passes
              </h2>
              <p className="text-zinc-700 dark:text-zinc-400 font-medium text-xs mt-0.5">
                Click any pass to launch real-time seating and interactive turnstile booking.
              </p>
            </div>

            <Link href="/search">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm">
                <span>Filter & Search Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {CATALOG_EVENTS.slice(0, 9).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/search">
              <Button variant="default" size="lg" className="px-8 font-bold text-sm gap-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-md">
                <span>Explore All 51 Shows in Search Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Enterprise Consumer-Grade Platform Footer */}
      <Footer />
    </div>
  );
}
