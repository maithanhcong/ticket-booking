"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  Star,
  Users,
  CheckCircle2,
  Share2,
  Heart,
  ChevronLeft,
  Sparkles,
  Ticket,
  CreditCard,
  X,
  Lock,
  Hourglass,
  QrCode,
  Wifi,
  WifiOff,
  AlertTriangle,
  Download,
  Smartphone,
  LogOut,
  Info,
  Layers,
  Music,
  Compass,
  FileText,
  Car,
  Volume2,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Zap,
  Search,
  Flame,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Spotlight } from "@/components/ui/spotlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SeatMap,
  SeatData,
  generateDefaultStadiumSeats,
  generateSeatsByCategory,
  detectLayoutType,
} from "@/components/seating/seat-map";
import { TimerBadge } from "@/components/checkout/timer-badge";
import { formatPrice } from "@/lib/utils";
import { useCheckoutMachine } from "@/machines/checkoutMachine";

import {
  saveOfflineTicket,
  generateTicketQRDataUrl,
  generateTicketVerificationHash,
  registerTicketServiceWorker,
  addNetworkStatusListener,
  isOffline,
  OfflineTicket,
} from "@/lib/offline-tickets";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { downloadIcsFile, getGoogleCalendarUrl } from "@/lib/calendar-export";
import { getEventByIdOrSlug, CatalogEvent } from "@/lib/events-catalog";
import { WalletBadge } from "@/components/wallet-badge";
import { VirtualWaitingRoom } from "@/components/seating/virtual-waiting-room";
import { AppleWalletButton, GoogleWalletButton } from "@/lib/wallet-pass-generator";

function StadiumCanvasSkeleton() {
  return (
    <div className="relative w-full h-[620px] lg:h-[680px] rounded-2xl bg-zinc-950 border border-zinc-200 overflow-hidden p-8 flex flex-col items-center justify-center animate-pulse select-none">
      <div className="w-80 h-10 rounded-xl bg-zinc-800 border border-zinc-700 mb-10 flex items-center justify-center text-xs font-mono text-zinc-300">
        INITIALIZING 60 FPS SEATING ENGINE...
      </div>
      <div className="space-y-4 w-full max-w-md flex flex-col items-center">
        <div className="flex gap-2.5 justify-center">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
          ))}
        </div>
        <div className="flex gap-2.5 justify-center">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded-full bg-blue-500/40" />
          ))}
        </div>
        <div className="flex gap-2.5 justify-center">
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded-full bg-amber-500/30" />
          ))}
        </div>
      </div>
      <div className="mt-10 text-xs font-semibold text-zinc-400 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
        <span>Calibrating Stadium Viewport & Synchronizing Seat Matrix...</span>
      </div>
    </div>
  );
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, token, logout, topUp, updateLocalBalance, refreshProfile } = useAuth();

  // Dynamically resolve event metadata from the 50+ event catalog
  const event: CatalogEvent = getEventByIdOrSlug(params?.id || "");

  // Favorites & Share State
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = event?.id ? isFavorite(event.id) : false;
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showAuthRequiredBanner, setShowAuthRequiredBanner] = useState<boolean>(false);

  // Live calculated active viewer count with safe reduce fallback
  const activeViewers = 18 + ((event?.id || "event").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 19);

  // AI Highlight & Telemetry State
  const [highlightedSeatIds, setHighlightedSeatIds] = useState<string[]>([]);
  const [dynamicPricing, setDynamicPricing] = useState<{
    surgeMultiplier: number;
    capacityRatio: number;
    velocityLast5Min: number;
    demandNotice: string;
  } | null>(null);

  // Anti-Bot Telemetry: Latency & Shannon Mouse Movement Entropy
  const mountTimeRef = useRef<number>(Date.now());
  const mouseMovesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    const handleMouseMove = (e: MouseEvent) => {
      const arr = mouseMovesRef.current;
      if (arr.length > 80) arr.shift();
      arr.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculateMouseEntropy = (): number => {
    const points = mouseMovesRef.current;
    if (points.length < 5) return 0.15; // Automated headless bot or direct curl execution
    let totalCurvature = 0;
    for (let i = 2; i < points.length; i++) {
      const dx1 = points[i - 1].x - points[i - 2].x;
      const dy1 = points[i - 1].y - points[i - 2].y;
      const dx2 = points[i].x - points[i - 1].x;
      const dy2 = points[i].y - points[i - 1].y;
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      totalCurvature += Math.abs(angle2 - angle1);
    }
    return Math.min(4.5, totalCurvature / (points.length - 2));
  };

  // Fetch real-time Dynamic Surge Pricing from Backend
  useEffect(() => {
    const fetchDynamicPricing = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${backendUrl}/ai/dynamic-pricing/${event.id}`);
        if (res.ok) {
          const data = await res.json();
          setDynamicPricing(data);
        }
      } catch (e) {
        // Graceful silent fallback
      }
    };
    fetchDynamicPricing();
  }, [event.id]);

  // Tab switcher: Overview vs Interactive Seating
  const [activeTab, setActiveTab] = useState<"overview" | "seating">("overview");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("ALL");
  const [isSeatingLoading, setIsSeatingLoading] = useState<boolean>(true);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; caption: string; tag: string } | null>(null);

  const auxiliaryPhotos = [
    {
      url: event.galleryPhotos?.[0] || "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=1200&auto=format&fit=crop",
      title: "Stage & Track Perspective",
      caption: "Unobstructed grandstand sightline capturing full stage and circuit action.",
      tag: "STAGE VIEW",
    },
    {
      url: event.galleryPhotos?.[1] || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop",
      title: "Crowd Atmosphere & Stadium Energy",
      caption: "High-voltage stadium immersion with synchronized lighting and crowd energy.",
      tag: "CROWD ATMOSPHERE",
    },
    {
      url: event.galleryPhotos?.[2] || "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?q=80&w=1200&auto=format&fit=crop",
      title: "VIP Hospitality & Paddock Lounge",
      caption: "All-inclusive hospitality lounge, private bar, and fast-track paddock access.",
      tag: "VIP HOSPITALITY",
    },
  ];

  // Virtual Waiting Room for high-demand event drops (<15% capacity or tagged isHotDrop)
  const isHighDemand = Boolean(
    event.isHotDrop ||
    (event.availableSeats && event.totalSeats && (event.availableSeats / event.totalSeats) < 0.15)
  );

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `auratickets_session_${event.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.expiresAt > Date.now()) {
          setSessionToken(parsed.token);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {}
  }, [event.id]);

  useEffect(() => {
    if (!sessionToken) return;
    const storageKey = `auratickets_session_${event.id}`;
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const diff = Math.max(0, parsed.expiresAt - Date.now());
          if (diff <= 0) {
            setSessionToken(null);
            localStorage.removeItem(storageKey);
            clearInterval(interval);
          } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setSessionTimeRemaining(`${m}:${s.toString().padStart(2, "0")}`);
          }
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionToken, event.id]);

  useEffect(() => {
    const timer = setTimeout(() => setIsSeatingLoading(false), 280);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Local state for event seats to allow instant status updates and prevent double booking
  const [eventSeats, setEventSeats] = useState<SeatData[]>(() =>
    generateSeatsByCategory(event.category, event.title, event.id)
  );

  useEffect(() => {
    setEventSeats(generateSeatsByCategory(event.category, event.title, event.id));
  }, [event.id, event.category, event.title]);

  // Re-fetch booked seats from server and merge with local storage on page load
  useEffect(() => {
    let localBooked: string[] = [];
    try {
      const cached = localStorage.getItem(`auratickets_booked_seats_${event.id}`);
      if (cached) localBooked = JSON.parse(cached);
    } catch (e) {}

    async function fetchSeatStatuses() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${apiUrl}/bookings/events/${event.id}/seats`);
        if (res.ok) {
          const serverSeats = await res.json();
          const serverMap = new Map<string, string>();
          if (Array.isArray(serverSeats)) {
            serverSeats.forEach((s: any) => serverMap.set(s.id, s.status));
          }

          setEventSeats((prev) =>
            prev.map((seat) => {
              if (localBooked.includes(seat.id)) {
                return { ...seat, status: "BOOKED" };
              }
              const sStatus = serverMap.get(seat.id);
              if (sStatus) {
                return { ...seat, status: sStatus as any };
              }
              return seat;
            })
          );
          return;
        }
      } catch (err) {
        console.warn("[Seats] Could not fetch server seat statuses:", err);
      }

      if (localBooked.length > 0) {
        setEventSeats((prev) =>
          prev.map((seat) =>
            localBooked.includes(seat.id) ? { ...seat, status: "BOOKED" } : seat
          )
        );
      }
    }

    fetchSeatStatuses();
  }, [event.id]);

  // ---------------------------------------------------------------------------
  // XSTATE V5 CHECKOUT MACHINE
  // Enforces: SELECTING -> WAITING_ROOM -> HOLDING -> PAYMENT_PENDING -> CONFIRMED / EXPIRED
  const [snapshot, send] = useCheckoutMachine(event.id);


  const {
    selectedSeats,
    subtotal,
    bookingFee,
    facilityCharge,
    grandTotal,
    bookingReference,
    bookingId,
    queuePosition,
    ttlRemainingSeconds,
    isSubmittingPayment,
    qrCodeDataUrl,
    errorMessage,
  } = snapshot.context;

  // Active state booleans
  const isSelecting = snapshot.matches("SELECTING");
  const isWaitingRoom = snapshot.matches("WAITING_ROOM");
  const isHolding = snapshot.matches("HOLDING");
  const isPaymentPending = snapshot.matches("PAYMENT_PENDING");
  const isProcessingPayment = snapshot.matches({ PAYMENT_PENDING: "processing" });
  const isConfirmed = snapshot.matches("CONFIRMED");
  const isExpired = snapshot.matches("EXPIRED");

  // Connect with Global AI Assistant via Window Events
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).__currentAuraEvent = {
      id: event.id,
      title: event.title,
      category: event.category,
      availableSeats: eventSeats,
    };

    const handleAiHighlight = (e: any) => {
      if (e.detail?.seatIds) {
        setHighlightedSeatIds(e.detail.seatIds);
        setActiveTab("seating");
        setTimeout(() => {
          const el = document.getElementById("seating-canvas-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    const handleAuthRequired = () => {
      setShowAuthRequiredBanner(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const handleAiSelectCommit = (e: any) => {
      const seats = e.detail?.seats || [];
      seats.forEach((seat: any) => {
        if (!selectedSeats.some((s) => s.id === seat.id)) {
          send({
            type: "SELECT_SEAT",
            seat: {
              id: seat.id,
              row: seat.row,
              seatNumber: seat.seatNumber,
              price: seat.price,
              sectionName: seat.sectionName,
            },
          });
        }
      });
      setActiveTab("seating");
      setTimeout(() => {
        const el = document.getElementById("seating-canvas-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // If user is not authenticated, prompt login banner
      if (!user) {
        setShowAuthRequiredBanner(true);
      }
    };

    window.addEventListener("auratickets:auth-required", handleAuthRequired);
    window.addEventListener("auratickets:ai-highlight", handleAiHighlight);
    window.addEventListener("auratickets:ai-select-commit", handleAiSelectCommit);

    return () => {
      delete (window as any).__currentAuraEvent;
      window.removeEventListener("auratickets:auth-required", handleAuthRequired);
      window.removeEventListener("auratickets:ai-highlight", handleAiHighlight);
      window.removeEventListener("auratickets:ai-select-commit", handleAiSelectCommit);
    };
  }, [event?.id, event?.title, event?.category, eventSeats, selectedSeats, send, user]);

  // Handle Incoming URL Parameters from Global AI Assistant:
  // e.g. /events/[id]?focus=seating&seats=...&autoSelect=true
  const urlParamsProcessedRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchString = window.location.search;
    if (!searchString || urlParamsProcessedRef.current === searchString) return;

    const queryParams = new URLSearchParams(searchString);
    const focus = queryParams.get("focus");
    const seatsParam = queryParams.get("seats");
    const autoSelectParam = queryParams.get("autoSelect");

    if (!focus && !seatsParam && !autoSelectParam) return;
    urlParamsProcessedRef.current = searchString;

    if (focus === "seating") {
      setActiveTab("seating");
      setTimeout(() => {
        const el = document.getElementById("seating-canvas-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }

    if (seatsParam) {
      const seatIds = seatsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (seatIds.length > 0) {
        setHighlightedSeatIds(seatIds);
      }

      if (autoSelectParam === "true") {
        seatIds.forEach((id) => {
          const found = eventSeats.find((s) => s.id === id);
          if (found) {
            if (!selectedSeats.some((s) => s.id === found.id)) {
              send({
                type: "SELECT_SEAT",
                seat: {
                  id: found.id,
                  row: found.row,
                  seatNumber: found.seatNumber,
                  price: found.price,
                  sectionName: found.sectionName,
                },
              });
            }
          } else {
            const parts = id.split("-");
            const row = parts[parts.length - 2] || "A";
            const num = parts[parts.length - 1] || "1";
            if (!selectedSeats.some((s) => s.id === id)) {
              send({
                type: "SELECT_SEAT",
                seat: {
                  id: id,
                  row: row,
                  seatNumber: num,
                  price: event.minPrice || 120,
                  sectionName: "VIP / Reserved Area",
                },
              });
            }
          }
        });
      }
    }
  }, [eventSeats, selectedSeats, send, event.minPrice]);

  // Modal open when past SELECTING state
  const isModalOpen = !isSelecting;

  // Offline / Service Worker State
  const [offlineStatus, setOfflineStatus] = useState<boolean>(false);
  const [pwaRegistered, setPwaRegistered] = useState<boolean>(false);
  const [cachedTicket, setCachedTicket] = useState<OfflineTicket | null>(null);

  // Payment method selection & Credit Card Form State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"WALLET" | "STRIPE_CARD">("WALLET");
  const [cardData, setCardData] = useState({
    cardNumber: "4242 •••• •••• 4242",
    expiryDate: "12/28",
    cvc: "123",
    cardholderName: "Alex Vance",
  });

  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      if (fullName) {
        setCardData((prev) => ({ ...prev, cardholderName: fullName }));
      }
    }
  }, [user]);

  // Initialize PWA Service Worker and Offline Listeners
  useEffect(() => {
    registerTicketServiceWorker().then((reg) => {
      if (reg) setPwaRegistered(true);
    });

    setOfflineStatus(isOffline());
    const cleanup = addNetworkStatusListener(
      () => setOfflineStatus(false),
      () => setOfflineStatus(true)
    );

    return () => cleanup();
  }, []);

  // ---------------------------------------------------------------------------
  // VIRTUAL WAITING ROOM SIMULATION
  // Automatically moves through virtual queue to demonstrate the state progression
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isWaitingRoom) {
      send({ type: "QUEUE_UPDATE", position: 42, estimatedWaitSeconds: 3 });

      const timer1 = setTimeout(() => {
        send({ type: "QUEUE_UPDATE", position: 14, estimatedWaitSeconds: 1 });
      }, 1200);

      const timer2 = setTimeout(() => {
        const generatedBookingId = `bkg-${Math.random().toString(36).substring(2, 9)}`;
        const generatedRef = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
        const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();

        send({
          type: "QUEUE_PASSED",
          bookingId: generatedBookingId,
          bookingReference: generatedRef,
          expiresAt: expiresAt,
          ttlSeconds: 600,
        });
      }, 2600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isWaitingRoom, send]);

  // Smooth scroll to seat map with optional tier filter preset
  const scrollToSeatMap = (tierId?: string | React.MouseEvent) => {
    if (typeof tierId === "string") {
      setSelectedTierFilter(tierId);
    }
    setActiveTab("seating");
    setTimeout(() => {
      const el = document.getElementById("seating-canvas-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  // Handle multi-seat batch selection from Auto-Seat Picker
  const handleSelectMultipleSeats = (seatsToSelect: SeatData[]) => {
    seatsToSelect.forEach((seat) => {
      if (!selectedSeats.some((s) => s.id === seat.id)) {
        send({
          type: "SELECT_SEAT",
          seat: {
            id: seat.id,
            row: seat.row,
            seatNumber: seat.seatNumber,
            price: seat.price,
            sectionName: seat.sectionName,
          },
        });
      }
    });
  };

  // Handle seat toggling on the seat map
  const handleToggleSeat = (seat: SeatData) => {
    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);
    if (isAlreadySelected) {
      send({ type: "DESELECT_SEAT", seatId: seat.id });
    } else {
      send({
        type: "SELECT_SEAT",
        seat: {
          id: seat.id,
          row: seat.row,
          seatNumber: seat.seatNumber,
          price: seat.price,
          sectionName: seat.sectionName,
        },
      });
    }
  };

  const handleRemoveSeat = (seatId: string) => {
    send({ type: "DESELECT_SEAT", seatId });
  };

  // Trigger Checkout: transitions SELECTING -> WAITING_ROOM (prompts Auth if not logged in)
  const handleStartCheckout = () => {
    if (!user) {
      setShowAuthRequiredBanner(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Call backend reservation endpoint passing real currentUser.id, JWT token and anti-scalper telemetry
    if (token && !isOffline()) {
      const latency = Date.now() - mountTimeRef.current;
      const entropy = calculateMouseEntropy();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      fetch(`${apiUrl}/bookings/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-idempotency-key": `idemp-reserve-${Date.now()}`,
          "X-Interaction-Latency": String(latency),
          "X-Mouse-Entropy": String(entropy.toFixed(2)),
        },
        body: JSON.stringify({
          eventId: event.id,
          seatIds: selectedSeats.map((s) => s.id),
        }),
      })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (data && data.isHoneypot) {
          console.warn("[Anti-Scalper Honeypot Diverted]:", data);
        }
      })
      .catch((e) => console.warn("[Reserve] Background reservation sync:", e));
    }

    send({ type: "PROCEED_TO_QUEUE" });
  };

  // Dismiss / Cancel Checkout Modal & Release Locks
  const handleDismissPaymentModal = () => {
    if (typeof window !== "undefined" && (window as any).__checkoutNavLockCleanups) {
      (window as any).__checkoutNavLockCleanups.forEach((fn: () => void) => fn());
      delete (window as any).__checkoutNavLockCleanups;
    }

    if (isPaymentPending) {
      send({ type: "EXPIRE" });
      send({ type: "RESTART" });
    } else if (isHolding) {
      send({ type: "RELEASE_HOLD" });
    } else {
      send({ type: "RESTART" });
    }
  };

  // Complete Payment & Save Offline Ticket Pass
  const handleCompletePayment = async () => {
    if (isProcessingPayment) return; // Anti-double submission guard

    // Strict authentication guard before payment authorization
    if (!user) {
      setShowAuthRequiredBanner(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Strict wallet balance check ONLY when paying with WALLET
    if (selectedPaymentMethod === "WALLET") {
      const currentBalance = user.balance !== undefined ? user.balance : 1500;
      if (currentBalance < grandTotal) {
        alert(
          `Insufficient wallet balance ($${currentBalance.toFixed(
            2
          )}). Please top up $${(grandTotal - currentBalance).toFixed(
            2
          )} to complete your booking.`
        );
        return;
      }
    }

    send({ type: "SUBMIT_PAYMENT" });

    let ref = bookingReference || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    let bId = bookingId || `bkg-${Math.random().toString(36).substring(2, 9)}`;
    const paymentRef =
      selectedPaymentMethod === "STRIPE_CARD"
        ? `PAY-STRIPE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : `PAY-WALLET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      if (token && !isOffline()) {
        const bookingPayload = {
          eventId: event.id,
          bookingReference: ref,
          paymentMethod: selectedPaymentMethod,
          seatIds: selectedSeats.map((s) => s.id),
          totalAmount: grandTotal,
          status: "CONFIRMED",
        };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${apiUrl}/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-idempotency-key": `idemp-booking-${ref}`,
          },
          body: JSON.stringify(bookingPayload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to finalize booking on server.");
        }

        const confirmedBooking = await res.json();
        if (confirmedBooking?.id) {
          bId = confirmedBooking.id;
        }
        if (confirmedBooking?.bookingReference) {
          ref = confirmedBooking.bookingReference;
        }
      }

      // If Card payment: simulate mock payment gateway processing spinner (1.5s)
      if (selectedPaymentMethod === "STRIPE_CARD") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        // Deduct totalAmount from user balance only for WALLET
        updateLocalBalance(-grandTotal, true);
        if (refreshProfile) {
          refreshProfile();
        }
      }

      const seatIds = selectedSeats.map((s) => s.id);
      const verificationHash = generateTicketVerificationHash(ref, event.id, seatIds);
      const qrPayload = `TICKETVAULT:${ref}:${verificationHash}:${event.id}`;
      const qrUrl = generateTicketQRDataUrl(qrPayload, 300);

      // Save to IndexedDB with strict user-scoped ticket isolation
      const ticketToSave: OfflineTicket = {
        id: ref,
        userId: user.id, // Strictly scoped to authenticated user ID
        bookingId: bId,
        bookingReference: ref,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.startTime,
        eventVenue: event.venue.name,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        seats: selectedSeats.map((s) => ({
          id: s.id,
          row: s.row,
          seatNumber: s.seatNumber,
          sectionName: s.sectionName,
          price: s.price,
        })),
        totalAmount: grandTotal,
        qrCodeDataUrl: qrUrl,
        verificationHash: verificationHash,
        cachedAt: Date.now(),
        status: "CONFIRMED",
        synced: true,
      };

      try {
        await saveOfflineTicket(ticketToSave);
        setCachedTicket(ticketToSave);
      } catch (err) {
        console.warn("[IndexedDB] Failed to cache ticket offline:", err);
      }

      // Immediately switch purchased seats permanently to BOOKED locally
      setEventSeats((prev) =>
        prev.map((seat) =>
          seatIds.includes(seat.id) ? { ...seat, status: "BOOKED" } : seat
        )
      );

      // Persist booked seats to localStorage for reload safety
      try {
        const cacheKey = `auratickets_booked_seats_${event.id}`;
        const existing: string[] = JSON.parse(localStorage.getItem(cacheKey) || "[]");
        const merged = Array.from(new Set([...existing, ...seatIds]));
        localStorage.setItem(cacheKey, JSON.stringify(merged));
      } catch (e) {}

      send({
        type: "PAYMENT_SUCCESS",
        paymentReference: paymentRef,
        qrCodeDataUrl: qrUrl,
      });
    } catch (err: any) {
      alert(`Payment Error: ${err.message || "Could not complete payment."}`);
      send({ type: "PAYMENT_FAILED", error: err.message || "Payment failed" });
    }
  };

  // Ensure ticket is saved as soon as checkout transitions to CONFIRMED
  useEffect(() => {
    if (isConfirmed && cachedTicket && user) {
      saveOfflineTicket({ ...cachedTicket, userId: user.id }).catch((e: any) =>
        console.warn("[IndexedDB] Reactive ticket persistence sync:", e)
      );
    }
  }, [isConfirmed, cachedTicket, user]);


  const handleExpiration = () => {
    send({ type: "EXPIRE" });
  };

  const eventDate = new Date(event.startTime);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 selection:bg-red-500 selection:text-white pb-20">
      {/* Floating 10-Minute Countdown Timer during HOLDING or PAYMENT_PENDING */}
      {(isHolding || isPaymentPending) && (
        <TimerBadge
          initialSeconds={ttlRemainingSeconds > 0 ? ttlRemainingSeconds : 600}
          seatCount={selectedSeats.length}
          onExpire={handleExpiration}
        />
      )}

      {/* Global Sticky Navigation Bar with Theme Switcher */}
      <Navbar />

      {/* Authentication Required Floating Banner / Toast Notification */}
      <AnimatePresence>
        {showAuthRequiredBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl mx-auto select-none"
          >
            <div className="bg-white/98 dark:bg-zinc-900/98 backdrop-blur-2xl border-2 border-amber-500 dark:border-amber-400 p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    Yêu Cầu Đăng Nhập Tài Khoản
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">
                    Vui lòng đăng nhập để tiếp tục đặt vé và thanh toán (Please sign in to continue ticket booking).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Link href={`/auth/login?redirect=${encodeURIComponent(`/events/${event?.id || params?.id}`)}`}>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95">
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập ngay</span>
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAuthRequiredBanner(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Dismiss notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-navigation bar with Back button and PWA Status */}
      <div className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to All Events</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* PWA Network Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                offlineStatus
                  ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {offlineStatus ? (
                <>
                  <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span>Offline Mode (PWA)</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">PWA Cache Ready</span>
                </>
              )}
            </div>

            {/* Favorite / Save Event Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(event.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isFav
                  ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 shadow-sm"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-red-500 text-red-500" : "text-zinc-500 dark:text-zinc-400"}`} />
              <span>{isFav ? "Saved ❤️" : "Save to Wishlist"}</span>
            </button>

            {/* Share Event Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Hero Showcase (Cinematic Dusk Header) */}
      <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url(${event.bannerUrl || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col justify-end min-h-[460px]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-600 text-white shadow-md shadow-red-600/30">
              {event.category}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Shield className="h-3 w-3 text-emerald-400" /> Official Verified Tickets
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>🔥 {activeViewers} people currently viewing</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-rose-300">
              <Zap className="h-3 w-3 text-rose-400" />
              <span>⚡ High Demand: Selling Fast</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight">
            {event.title}
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-zinc-300 font-medium max-w-3xl">
            {event.subtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 flex items-center gap-3 text-white">
                <div className="h-9 w-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Date</span>
                  <span className="text-xs font-semibold text-white">{formattedDate}</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 flex items-center gap-3 text-white">
                <div className="h-9 w-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Time</span>
                  <span className="text-xs font-semibold text-white">{formattedTime}</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 flex items-center gap-3 text-white">
                <div className="h-9 w-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Location</span>
                  <span className="text-xs font-semibold text-white">{event.venue.name}</span>
                </div>
              </div>
            </div>

            {/* Prominent Hero CTA to Interactive Canvas Seat Map */}
            <div className="shrink-0 flex items-center gap-3">
              <Button
                size="lg"
                onClick={scrollToSeatMap}
                className="gap-2 text-sm sm:text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 px-6 py-6 rounded-xl transition-all"
              >
                <Ticket className="h-5 w-5" />
                <span>Choose Seats & Book Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Section Navigation Bar */}
      <div className="sticky top-16 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Info className="h-4 w-4" />
              <span>Event Overview & Guide</span>
            </button>

            <button
              onClick={() => setActiveTab("seating")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "seating"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Interactive Seating & Checkout</span>
              {selectedSeats.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {selectedSeats.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>From</span>
            <span className="text-zinc-900 dark:text-white font-bold text-base font-mono">{formatPrice(event.minPrice)}</span>
          </div>
        </div>
      </div>

      {/* TAB 1: STANDALONE EVENT OVERVIEW SECTION */}
      {activeTab === "overview" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* A. AUXILIARY PHOTO GALLERY (STAGE VIEW, CROWD ATMOSPHERE, VIP HOSPITALITY) */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Auxiliary Venue & Atmosphere Gallery
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    High-resolution live previews showing stage sightlines, crowd energy, and VIP lounges. Click any photo to enlarge.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-fit">
                3 Verified Perspectives
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {auxiliaryPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(photo)}
                  className="group relative h-64 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-sm hover:shadow-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                      {photo.tag}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 inset-x-3 text-white">
                    <h4 className="font-bold text-sm tracking-tight drop-shadow-sm">{photo.title}</h4>
                    <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* B. VERIFIED ORGANIZER BADGE & RICH EDITORIAL OVERVIEW */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{event.organizer?.badge || "Official Verified Promoter"}</span>
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Official Sanctioned Partner
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                  {event.organizer?.name || "AuraTickets Verified Entertainment Network"}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                  {event.organizer?.description || "All ticket sales are protected by cryptographic token verification, anti-scalper turnstile validation, and guaranteed seat holds directly with the venue and promoter."}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center min-w-[120px]">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-bold block">Capacity</span>
                  <span className="text-base font-black text-zinc-950 dark:text-white font-mono" suppressHydrationWarning>{event.venue.capacity.toLocaleString("en-US")}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center min-w-[120px]">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-bold block">Remaining</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">{event.availableSeats}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Editorial Overview & Lineup Guide
              </h4>
              <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                {event.description}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {event.artistBio.biography}
              </p>
            </div>
          </section>

          {/* C. STRUCTURED SCHEDULE & VENUE CARD */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule & Opening Times */}
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm space-y-5 transition-colors duration-300">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Structured Schedule & Access Hours
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> General Gates Open
                  </span>
                  <span className="font-mono font-bold text-zinc-950 dark:text-white">
                    {event.agenda[0]?.time ? `${event.agenda[0].time} (Turnstiles Open)` : "2 Hours Before Show"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> VIP Check-in & Hospitality Desk
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {event.agenda[1]?.time ? `${event.agenda[1].time} - Early Fast-Track` : "3 Hours Before Show"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Main Showcase / Green Flag Start
                  </span>
                  <span className="font-mono font-bold text-zinc-950 dark:text-white">
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Venue Card & Stadium Address */}
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm space-y-5 transition-colors duration-300">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Venue Address & Stadium Concourse
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                    Exact Stadium Address
                  </span>
                  <span className="text-zinc-900 dark:text-white font-semibold text-sm block">
                    {event.venue.name}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300 block mt-0.5">
                    {event.venue.address}, {event.venue.city}, {event.venue.country}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                    Transit & Concourse Access
                  </span>
                  <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {event.venue.transitDirections}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* D. SEAMLESS SEATING INTEGRATION JUMP BAR */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-red-400 tracking-wider">
                Direct Seating Engine
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Ready to choose your seats?
              </h3>
              <p className="text-xs text-zinc-400">
                Launch the interactive 60 FPS seating canvas with live tier filtering and atomic reservation cart.
              </p>
            </div>
            <Button
              size="lg"
              onClick={scrollToSeatMap}
              className="gap-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 shrink-0 px-6 py-6"
            >
              <Ticket className="h-4 w-4" />
              <span>Launch Interactive Seat Map</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 1. Artist / Performer Spotlight */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                <Music className="h-4 w-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Artist & Performer Spotlight</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{event.artistBio.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                  Headliner: {event.artistBio.headliner}
                </span>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{event.artistBio.biography}</p>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2 uppercase tracking-wider">
                    Tour Accolades & Highlights
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(event?.artistBio?.highlights || []).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Quick Overview Box */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 p-6 space-y-5">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-3">
                  <span>Showtime Details</span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    {event?.groupCategory || "Event"}
                  </span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Doors Open</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">2 Hours Before Show</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Venue Capacity</span>
                    <span className="font-semibold text-zinc-900 dark:text-white" suppressHydrationWarning>{event?.venue?.capacity ? event.venue.capacity.toLocaleString("en-US") : "40,000"} Fans</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Total Available Seats</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{event?.availableSeats || 0} Remaining</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Starting Price</span>
                    <span className="font-bold text-zinc-900 dark:text-white text-sm font-mono">{formatPrice(event?.minPrice || 50)}</span>
                  </div>
                </div>

                <Button onClick={scrollToSeatMap} className="w-full text-xs font-bold gap-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-sm">
                  <Ticket className="h-4 w-4" />
                  <span>Choose Your Seats</span>
                </Button>
              </div>
            </div>
          </section>

          {/* 2. Event Agenda & Timeline */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Event Agenda & Schedule</h2>
            </div>

            <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-4 space-y-8">
              {(event?.agenda || []).map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-red-600 border-4 border-white dark:border-zinc-900 shadow-xs" />
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    {item.time}
                  </div>
                  <h4 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">{item.title}</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 font-normal text-xs leading-relaxed mt-1 max-w-2xl">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Venue Location & Facilities Overview */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">Venue Location & Facilities</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 space-y-2">
                <div className="flex items-center gap-2 text-zinc-950 dark:text-white text-sm font-semibold">
                  <Compass className="h-4 w-4 text-red-600" />
                  <span>Transit & Directions</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{event?.venue?.transitDirections || "Transit info available near venue."}</p>
                <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium block pt-1">{event?.venue?.address}, {event?.venue?.city}, {event?.venue?.country}</span>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 space-y-2">
                <div className="flex items-center gap-2 text-zinc-950 dark:text-white text-sm font-semibold">
                  <Car className="h-4 w-4 text-red-600" />
                  <span>Parking Information</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{event?.venue?.parkingInfo || "Parking available at facility."}</p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 space-y-2">
                <div className="flex items-center gap-2 text-zinc-950 dark:text-white text-sm font-semibold">
                  <Volume2 className="h-4 w-4 text-red-600" />
                  <span>Acoustic Profile</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{event?.venue?.acousticProfile || "Mastered arena acoustic profile."}</p>
              </div>
            </div>
          </section>

          {/* 4. Tiered Pricing Breakdown Grid */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">Seating Tiers & Pricing</h2>
                  <p className="text-zinc-700 dark:text-zinc-400 font-medium text-xs mt-0.5">Select any tier to jump directly to the interactive stadium map.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(event?.tiers || []).map((tier) => {
                const tierSectionId = (tier.id || "").toLowerCase().includes("vip")
                  ? "sec-vip"
                  : (tier.id || "").toLowerCase().includes("cat-1") || (tier.id || "").toLowerCase().includes("lower")
                  ? "sec-lower-center"
                  : (tier.id || "").toLowerCase().includes("cat-2") || (tier.id || "").toLowerCase().includes("wing")
                  ? "sec-wings"
                  : "sec-balcony";

                return (
                  <div
                    key={tier.id}
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-4 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all"
                  >
                    <div>
                      {tier.badge && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 mb-2">
                          {tier.badge}
                        </span>
                      )}
                      <h4 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">{tier.name}</h4>
                      <div className="text-2xl font-black text-zinc-950 dark:text-white mt-2 font-mono">{formatPrice(tier.price)}</div>
                      <p className="text-zinc-600 dark:text-zinc-400 font-normal text-xs leading-relaxed mt-2">{tier.description}</p>

                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                        {(tier?.perks || []).map((p, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => scrollToSeatMap(tierSectionId)}
                      className="w-full text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 rounded-xl"
                    >
                      Select {tier.name}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Ticket Tier Benefit Comparison Matrix */}
            <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Ticket Tier Feature Comparison Matrix</span>
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-400 font-medium text-xs mt-0.5">
                    Compare sightlines, acoustic fidelity, hospitality perks, and gate access across all seating sections.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80">
                      <th className="p-4 text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px] w-1/4">
                        Benefit / Feature
                      </th>
                      <th className="p-4 text-zinc-900 dark:text-white font-bold">
                        <div className="text-sm font-black">VIP Platinum</div>
                        <div className="text-xs text-red-600 font-mono font-bold">$280</div>
                      </th>
                      <th className="p-4 text-zinc-900 dark:text-white font-bold">
                        <div className="text-sm font-black">Cat 1 Lower Bowl</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-bold">$165</div>
                      </th>
                      <th className="p-4 text-zinc-900 dark:text-white font-bold">
                        <div className="text-sm font-black">Cat 2 Lower Wings</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-bold">$120</div>
                      </th>
                      <th className="p-4 text-zinc-900 dark:text-white font-bold">
                        <div className="text-sm font-black">Grand Balcony</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-bold">$75</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Stage Proximity & Sightlines</td>
                      <td className="p-4 text-red-700 dark:text-red-400 font-medium">Ultra-Close Front Rows (A–E)</td>
                      <td className="p-4">Prime Elevated Center View</td>
                      <td className="p-4">Dynamic Angled Wing Perspective</td>
                      <td className="p-4">Panoramic Full Stadium Overview</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Acoustic Immersion Profile</td>
                      <td className="p-4 text-red-700 dark:text-red-400 font-medium">Direct Line-Array Dynamic Audio</td>
                      <td className="p-4">Balanced Surround Acoustics</td>
                      <td className="p-4">High-Clarity Stereo Mix</td>
                      <td className="p-4">Ambient Diffused Arena Mix</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Turnstile Gate Access</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Priority VIP Red-Carpet Gate
                        </span>
                      </td>
                      <td className="p-4 text-zinc-700 dark:text-zinc-300">Express Lane Turnstile</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">Standard Main Turnstile</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">Standard Main Turnstile</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Hospitality & Lounge Access</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Private Lounge & Free Drinks
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">Access to Concourse Bar</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">Access to Concourse Bar</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">General Concourse Kiosks</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Exclusive Tour Merchandise</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Lanyard + Collectors Pin
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">Tour Commemorative Badge</td>
                      <td className="p-4 text-zinc-400 dark:text-zinc-500">—</td>
                      <td className="p-4 text-zinc-400 dark:text-zinc-500">—</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-zinc-900 dark:text-white">Seat Cushion & Comfort</td>
                      <td className="p-4 text-red-700 dark:text-red-400 font-medium">Padded Extra-Wide Club Seating</td>
                      <td className="p-4">Contoured Molded Stadium Seat</td>
                      <td className="p-4">Standard Arena Seat</td>
                      <td className="p-4">Standard Arena Seat</td>
                    </tr>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60">
                      <td className="p-4 font-bold text-zinc-900 dark:text-white">Instant Selection</td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          onClick={() => scrollToSeatMap("sec-vip")}
                          className="w-full text-xs font-bold bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl"
                        >
                          Pick VIP Seats
                        </Button>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scrollToSeatMap("sec-lower-center")}
                          className="w-full text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                        >
                          Pick Lower Bowl
                        </Button>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scrollToSeatMap("sec-wings")}
                          className="w-full text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                        >
                          Pick Wings
                        </Button>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scrollToSeatMap("sec-balcony")}
                          className="w-full text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                        >
                          Pick Balcony
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. Policies & Turnstile Security */}
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Event Policies & Admission Guidelines</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="font-bold text-zinc-900 dark:text-white block mb-1">Age Restrictions</span>
                <p className="text-zinc-600 dark:text-zinc-400">{event.policies.ageRestriction}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="font-bold text-zinc-900 dark:text-white block mb-1">Bag & Security Policy</span>
                <p className="text-zinc-600 dark:text-zinc-400">{event.policies.bagPolicy}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="font-bold text-zinc-900 dark:text-white block mb-1">Digital Gate Entry</span>
                <p className="text-zinc-600 dark:text-zinc-400">{event.policies.entryRequirements}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="font-bold text-zinc-900 dark:text-white block mb-1">Refund & Exchange Policy</span>
                <p className="text-zinc-600 dark:text-zinc-400">{event.policies.refundPolicy}</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* TAB 2: INTERACTIVE STADIUM SEATING MAP & CHECKOUT */}
      <section id="seating-canvas-section" className={activeTab === "seating" ? "block" : "hidden"}>
        {isHighDemand && !sessionToken ? (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <VirtualWaitingRoom
              eventId={event.id}
              eventTitle={event.title}
              onQueuePassed={(token: string) => setSessionToken(token)}
            />
          </main>
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {sessionToken && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium mb-6 w-fit">
                <Zap className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>⚡ Queue Passed • 10-Min Session Active:</span>
                <span className="font-bold text-emerald-900">{sessionTimeRemaining || "10:00"}</span>
              </div>
            )}
            {/* Dynamic Surge Pricing Alert Banner */}
            {dynamicPricing && dynamicPricing.surgeMultiplier > 1.0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-amber-500/30 text-amber-900 text-xs shadow-sm mb-6">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500 animate-bounce" />
                  <span className="font-bold text-amber-800">
                    🔥 High Demand Surge Active ({dynamicPricing.surgeMultiplier}x):
                  </span>
                  <span>{dynamicPricing.demandNotice}</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-semibold">
                  Velocity: {dynamicPricing.velocityLast5Min} locks/5m • {Math.round(dynamicPricing.capacityRatio * 100)}% Booked
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Interactive Seating / Circuit Canvas */}
            <div id="seating-canvas-section" className="lg:col-span-8 w-full space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 tracking-tight flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-red-600" />
                    <span>
                      {detectLayoutType(event.category, event.title, event.id) === "motorsport"
                        ? "Interactive Racetrack Circuit & Grandstand Map"
                        : detectLayoutType(event.category, event.title, event.id) === "festival"
                        ? "Interactive Festival Camping & RV Map"
                        : "Interactive Stadium Seating Map"}
                    </span>
                  </h2>
                  <p className="text-zinc-700 font-medium text-xs mt-1">
                    Click any seat or pit zone to add or release it. Multi-seat selection supported.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>🔥 {activeViewers} viewing now</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-zinc-100 text-zinc-950 font-bold border border-zinc-200">
                    {selectedSeats.length} Selected
                  </span>
                </div>
              </div>

              {/* Seating Canvas: Spans 8 columns (lg:col-span-8 w-full min-h-[620px] lg:h-[680px] bg-zinc-950 rounded-2xl border border-zinc-200 overflow-hidden shadow-lg relative) */}
              <div className="w-full min-h-[620px] lg:h-[680px] bg-zinc-950 rounded-2xl border border-zinc-200 overflow-hidden shadow-lg relative">
                {isSeatingLoading ? (
                  <StadiumCanvasSkeleton />
                ) : (
                  <SeatMap
                    eventId={event.id}
                    category={event.category}
                    eventTitle={event.title}
                    seats={eventSeats}
                    selectedSeatIds={(selectedSeats || []).map((s) => s.id)}
                    highlightedSeatIds={highlightedSeatIds}
                    onToggleSeat={handleToggleSeat}
                    onSelectMultipleSeats={handleSelectMultipleSeats}
                    activeTierFilter={selectedTierFilter}
                    onTierFilterChange={setSelectedTierFilter}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>

            {/* Right 4 Cols: Checkout Cart Drawer (lg:col-span-4 sticky top-24) */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-5 text-zinc-900">
                <h3 className="text-lg font-bold text-zinc-950 flex items-center justify-between border-b border-zinc-200 pb-3">
                  <span>Selected Seats</span>
                  <span className="text-xs font-semibold text-zinc-600">
                    {selectedSeats.length} / 10 Max
                  </span>
                </h3>

                {selectedSeats.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <Ticket className="h-10 w-10 mx-auto opacity-30 text-zinc-400" />
                    <p className="text-sm font-bold text-zinc-800">No seats selected yet</p>
                    <p className="text-xs text-zinc-600 font-normal">Click seats on the map to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {(selectedSeats || []).map((seat) => (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-zinc-950 block">{seat.sectionName || "Reserved Seat"}</span>
                            <span className="text-zinc-700 font-semibold text-[11px]">
                              Row {seat.row} • Seat {seat.seatNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-950 text-sm font-mono">{formatPrice(seat.price)}</span>
                            <button
                              onClick={() => handleRemoveSeat(seat.id)}
                              className="text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-lg"
                              title="Remove seat"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-4 border-t border-zinc-200 text-xs text-zinc-700 font-medium">
                      <div className="flex justify-between">
                        <span>Seat Tickets Subtotal</span>
                        <span className="text-zinc-950 font-mono font-bold">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service & Handling Fee</span>
                        <span className="text-zinc-950 font-mono font-bold">{formatPrice(bookingFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Facility & Eco Surcharge</span>
                        <span className="text-zinc-950 font-mono font-bold">{formatPrice(facilityCharge)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-zinc-200 text-sm font-bold text-zinc-950">
                        <span>Total Due</span>
                        <span className="text-zinc-950 text-xl font-black font-mono">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleStartCheckout}
                      className="w-full flex items-center justify-center gap-2 text-base font-bold bg-zinc-900 hover:bg-black text-white rounded-xl shadow-lg shadow-zinc-900/20 py-3.5"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Proceed to Checkout</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        )}
      </section>

      {/* Multi-Channel Share Hub Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
            >
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <Share2 className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Share Event</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                Invite friends and sync {event.title} to your favorite platforms and calendars.
              </p>

              <div className="space-y-3">
                {/* Copy Link Input */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    className="flex-1 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none truncate px-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <span>Copy Link</span>
                    )}
                  </button>
                </div>

                {/* Social Share Buttons */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(`Check out ${event.title} on AuraTickets!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-center gap-1.5"
                  >
                    <span className="text-base">✈️</span>
                    <span className="text-[11px] font-semibold">Telegram</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${event.title} on AuraTickets! ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-center gap-1.5"
                  >
                    <span className="text-base">💬</span>
                    <span className="text-[11px] font-semibold">WhatsApp</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Booked passes for ${event.title} via @AuraTickets! 🎟️`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-all text-center gap-1.5"
                  >
                    <span className="text-base">🐦</span>
                    <span className="text-[11px] font-semibold">X (Twitter)</span>
                  </a>
                </div>

                {/* Calendar Sync Options */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Add to Calendar</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadIcsFile({
                          title: event.title,
                          description: event.description,
                          startTime: event.startTime,
                          endTime: event.endTime,
                          venueName: event.venue?.name,
                          venueCity: event.venue?.city,
                          venueAddress: event.venue?.address,
                          eventUrl: typeof window !== "undefined" ? window.location.href : "",
                        })
                      }
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5 text-red-500" />
                      <span>Apple (.ics)</span>
                    </button>

                    <a
                      href={getGoogleCalendarUrl({
                        title: event.title,
                        description: event.description,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        venueName: event.venue?.name,
                        venueCity: event.venue?.city,
                        venueAddress: event.venue?.address,
                        eventUrl: typeof window !== "undefined" ? window.location.href : "",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span>Google Calendar</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------------------- */}
      {/* CHECKOUT STATE MACHINE MODAL (WAITING_ROOM -> HOLDING -> PAYMENT_PENDING -> CONFIRMED / EXPIRED) */}
      {/* --------------------------------------------------------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              {/* Close Button (Accessible across all states including Confirmed) */}
              <button
                type="button"
                onClick={() => {
                  if (isConfirmed) {
                    send({ type: "RESTART" });
                  } else {
                    handleDismissPaymentModal();
                  }
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20"
                title={isConfirmed ? "Close and return to seats" : "Close and return to seats"}
              >
                <X className="h-5 w-5" />
              </button>

              {/* GUEST FIRST GUARD: If unauthenticated user enters checkout modal */}
              {!user ? (
                <div className="py-4 space-y-6 text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                    <AlertCircle className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs uppercase font-bold">
                      Yêu Cầu Xác Thực Tài Khoản
                    </Badge>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Vui lòng đăng nhập để tiếp tục
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Vui lòng đăng nhập để tiếp tục đặt vé và thanh toán (Please sign in to continue ticket booking).
                    </p>
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>Số ghế đang chọn:</span>
                        <span className="font-bold text-zinc-900 dark:text-white font-mono">{selectedSeats.length} vé</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                        <span>Tổng tiền tạm tính:</span>
                        <span className="font-extrabold text-red-600 dark:text-red-400 font-mono text-sm">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleDismissPaymentModal}
                      className="w-full sm:w-1/2 text-xs border-zinc-300 dark:border-zinc-700 rounded-xl"
                    >
                      Quay lại xem thêm
                    </Button>
                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`}
                      className="w-full sm:w-1/2"
                    >
                      <Button className="w-full gap-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md">
                        <LogIn className="h-4 w-4" />
                        <span>Đăng nhập ngay</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
              {/* STATE 1: WAITING_ROOM (Virtual Flash Sale Queue) */}
              {isWaitingRoom && (
                <div className="py-6 text-center space-y-6">
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white animate-spin" />
                    <Hourglass className="h-10 w-10 text-zinc-800 dark:text-zinc-200 animate-pulse" />
                  </div>

                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 mb-2">
                      High Traffic Flash Sale
                    </span>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Virtual Waiting Room</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto">
                      Fair queue order is being protected. You will automatically be redirected to reserve your seats.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Queue Position:</span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">#{queuePosition || 42}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Estimated Wait:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">A few seconds</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: HOLDING (10-Minute Lock Granted) */}
              {isHolding && (
                <div className="space-y-5">
                  <div>
                    <Badge variant="success" className="text-[10px] uppercase mb-1">
                      Seats Reserved
                    </Badge>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{event.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Reference: <strong className="text-red-600 dark:text-red-400 font-mono">{bookingReference}</strong> • 10-Minute Hold Lease Granted
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Distributed Lock Active</strong>
                      Your seats are protected from race conditions. Complete checkout before the countdown expires.
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-200 dark:border-zinc-700 text-xs">
                    {(selectedSeats || []).map((s) => (
                      <div key={s.id} className="flex justify-between text-zinc-700 dark:text-zinc-300">
                        <span>{s.sectionName} (Row {s.row}, Seat {s.seatNumber})</span>
                        <span className="font-bold text-zinc-900 dark:text-white font-mono">{formatPrice(s.price)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
                      <span>Total Amount</span>
                      <span className="text-zinc-900 dark:text-white font-black font-mono text-base">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => send({ type: "RELEASE_HOLD" })}
                      className="w-1/3 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      Release Seats
                    </Button>
                    <Button
                      onClick={() => {
                        if (!user) {
                          setShowAuthRequiredBanner(true);
                          return;
                        }
                        send({ type: "START_PAYMENT", paymentMethod: "card" });
                      }}
                      className="w-2/3 flex items-center justify-center gap-2 font-bold bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl shadow-md"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Payment</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* STATE 3: PAYMENT_PENDING */}
              {isPaymentPending && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 uppercase mb-1">
                        Active Payment Session
                      </span>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Authorization</h3>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-1 rounded-md">
                      <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <span>Nav Protected</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-4 border border-zinc-200 dark:border-zinc-700 text-xs">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Booking Reference:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-white">{bookingReference}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Total Reserved Seats:</span>
                      <span className="text-zinc-900 dark:text-white font-medium">{selectedSeats.length} seats</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
                      <span>Amount to Authorize:</span>
                      <span className="text-zinc-900 dark:text-white text-base font-mono font-black">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">Select Payment Method</label>
                      {/* Visual Badges for Visa, Mastercard, and Apple Pay */}
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black italic tracking-widest text-blue-700 dark:text-blue-400">
                          VISA
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                          <span className="inline-flex -space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block opacity-90" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block opacity-90" />
                          </span>
                          <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">MC</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 170 170">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.04-14.58-6.19-9.5-10.9-20.2-14.13-32.1-3.23-11.9-4.85-23.08-4.85-33.55 0-14.67 3.8-26.75 11.41-36.24 7.61-9.49 17.1-14.24 28.46-14.24 5.37 0 11.22 1.45 17.55 4.35 6.33 2.9 10.22 4.35 11.66 4.35 1.25 0 5.42-1.52 12.52-4.57 7.09-3.04 13.06-4.35 17.91-3.92 13.88.98 24.88 5.76 33.01 14.34-11.97 7.29-17.84 17.3-17.62 30.04.22 9.9 4.12 18.23 11.72 25 7.6 6.76 16.59 10.51 26.97 11.24-2.4 7.39-5.44 14.73-9.14 22.02zM119.22 31.84c0-7.29 2.58-14.12 7.74-20.49 5.16-6.37 11.65-10.49 19.46-12.35.87 3.59 1.3 7.07 1.3 10.44 0 7.4-2.71 14.43-8.14 21.09-5.43 6.66-12 10.87-19.72 12.63-.22-3.7-.64-7.47-.64-11.32z"/>
                          </svg>
                          <span>Pay</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("WALLET")}
                        className={`rounded-xl border p-3 text-xs flex items-center justify-between font-medium transition-all duration-200 text-left ${
                          selectedPaymentMethod === "WALLET"
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md dark:border-white dark:bg-white dark:text-zinc-950"
                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className={`h-4 w-4 ${selectedPaymentMethod === "WALLET" ? "text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400"}`} />
                          <span>Aura Wallet</span>
                        </div>
                        {selectedPaymentMethod === "WALLET" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white dark:text-zinc-950 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("STRIPE_CARD")}
                        className={`rounded-xl border p-3 text-xs flex items-center justify-between font-medium transition-all duration-200 text-left ${
                          selectedPaymentMethod === "STRIPE_CARD"
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md dark:border-white dark:bg-white dark:text-zinc-950"
                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className={`h-4 w-4 ${selectedPaymentMethod === "STRIPE_CARD" ? "text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400"}`} />
                          <span>Credit / Debit Card</span>
                        </div>
                        {selectedPaymentMethod === "STRIPE_CARD" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white dark:text-zinc-950 shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* WALLET OPTION: Wallet Balance & Instant Top Up Card */}
                  {selectedPaymentMethod === "WALLET" && (() => {
                    const userBal = user?.balance !== undefined ? user.balance : 1500;
                    const hasEnough = userBal >= grandTotal;

                    return (
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <Wallet className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                            <span>Aura Customer Wallet Balance:</span>
                          </span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm">
                            ${userBal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {!hasEnough ? (
                          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                            <div className="text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>
                                Insufficient balance. You need ${(grandTotal - userBal).toFixed(2)} more.
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => topUp(500)}
                              className="w-full h-8 text-xs font-semibold border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 rounded-xl"
                            >
                              Instant Top Up (+$500)
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Sufficient wallet funds available</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => topUp(500)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold"
                            >
                              + Add $500
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* STRIPE_CARD OPTION: Interactive Credit / Debit Card Form */}
                  {selectedPaymentMethod === "STRIPE_CARD" && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-4 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                          <span>Interactive Test Card Form</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded">
                          TEST CARD ACTIVE
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardData.cardholderName}
                            onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                            placeholder="Alex Vance"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white interactive-input"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardData.cardNumber}
                              onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                              placeholder="4242 •••• •••• 4242"
                              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white interactive-input"
                            />
                            <CreditCard className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                              Expire Date (MM/YY)
                            </label>
                            <input
                              type="text"
                              value={cardData.expiryDate}
                              onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                              placeholder="12/28"
                              maxLength={5}
                              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white interactive-input"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                              CVC / CVV
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={cardData.cvc}
                                onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                                placeholder="123"
                                maxLength={4}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white interactive-input"
                              />
                              <Lock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>256-bit SSL Encrypted Mock Gateway</span>
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">Instant Card Approval</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Back navigation and double-submission are disabled during active transaction processing.
                  </div>

                  <Button
                    size="lg"
                    disabled={
                      isProcessingPayment ||
                      (selectedPaymentMethod === "WALLET" && user?.balance !== undefined && user.balance < grandTotal)
                    }
                    onClick={handleCompletePayment}
                    className="w-full flex items-center justify-center gap-2 font-bold bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl shadow-lg py-3.5 interactive-button"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>
                          {selectedPaymentMethod === "STRIPE_CARD"
                            ? "Authorizing Card via Stripe Gateway..."
                            : "Settling Transaction with Wallet..."}
                        </span>
                      </div>
                    ) : selectedPaymentMethod === "STRIPE_CARD" ? (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Pay {formatPrice(grandTotal)} via Card</span>
                      </div>
                    ) : user && user.balance !== undefined && user.balance < grandTotal ? (
                      <span>Top Up Wallet to Pay {formatPrice(grandTotal)} with Wallet</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>Pay {formatPrice(grandTotal)} with Wallet</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled={isProcessingPayment}
                    onClick={handleDismissPaymentModal}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-xl interactive-button"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel & Return to Seats</span>
                  </Button>

                </div>
              )}

              {/* STATE 4: CONFIRMED (Instant Ticket Persistence & Link to My Tickets) */}
              {isConfirmed && (
                <div className="py-4 text-center space-y-5">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Tickets Confirmed!</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Booking Reference: <strong className="text-red-600 dark:text-red-400 font-mono font-bold">{bookingReference}</strong>
                    </p>
                  </div>

                  {/* Offline Renderable QR Code Display */}
                  {qrCodeDataUrl && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl inline-block shadow-xs mx-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeDataUrl}
                        alt="Offline Ticket Gate Pass QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-semibold block mt-1">
                        OFFLINE GATE PASS VERIFIED
                      </span>
                    </div>
                  )}

                  {/* PWA IndexedDB confirmation badge */}
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
                    <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Saved to IndexedDB Vault • Ready in My Tickets</span>
                  </div>

                  {/* Mobile Wallet Integration: Apple Wallet (.pkpass) & Google Wallet Mock */}
                  {(() => {
                    const ticketObj: OfflineTicket = cachedTicket || {
                      id: bookingReference || `BK-${event.id}`,
                      userId: user?.id || "00000000-0000-0000-0000-000000000001",
                      bookingId: bookingReference || `BK-${event.id}`,
                      bookingReference: bookingReference || `BK-${event.id}`,
                      eventId: event.id,
                      eventTitle: event.title,
                      eventDate: event.startTime,
                      eventVenue: `${event.venue.name}, ${event.venue.city}`,
                      customerName: user ? `${user.firstName} ${user.lastName}` : "Verified Guest",
                      customerEmail: user?.email || "guest@example.com",
                      seats: selectedSeats.map((s) => ({
                        id: s.id,
                        row: s.row,
                        seatNumber: s.seatNumber,
                        sectionName: s.sectionName,
                        price: s.price,
                      })),
                      totalAmount: grandTotal,
                      qrCodeDataUrl: qrCodeDataUrl || "",
                      verificationHash: "GATE-PASS-OK",
                      cachedAt: Date.now(),
                      status: "CONFIRMED",
                      synced: true,
                    };

                    return (
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <div className="flex-1">
                          <AppleWalletButton
                            ticket={ticketObj}
                            className="w-full justify-center"
                          />
                        </div>
                        <div className="flex-1">
                          <GoogleWalletButton
                            ticket={ticketObj}
                            className="w-full justify-center"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Link href="/my-tickets" className="flex-1">
                      <Button className="w-full text-xs font-bold gap-1.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl shadow-sm">
                        <Ticket className="h-3.5 w-3.5" />
                        <span>View in My Tickets (Cancel & Refund)</span>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      onClick={() => {
                        if (qrCodeDataUrl) {
                          const a = document.createElement("a");
                          a.href = qrCodeDataUrl;
                          a.download = `ticket-${bookingReference}.svg`;
                          a.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download QR Pass</span>
                    </Button>
                  </div>

                  {/* Secondary Dismiss Action: Return to Seats & Clear Selection */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => send({ type: "RESTART" })}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-xl interactive-button"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Done / Return to Seats</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* STATE 5: EXPIRED */}
              {isExpired && (
                <div className="py-8 text-center space-y-5">
                  <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Reservation Expired</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
                      Your 10-minute seat lock lease has lapsed. The seats have been safely returned to the arena pool.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => send({ type: "RESTART" })}
                      className="w-full font-bold bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl shadow-sm"
                    >
                      Select New Seats
                    </Button>
                  </div>
                </div>
              )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUXILIARY PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                    {lightboxImage.tag}
                  </span>
                  <span className="text-sm font-bold text-white">{lightboxImage.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[72vh] overflow-hidden bg-black flex items-center justify-center p-2">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
                />
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                <span>{lightboxImage.caption}</span>
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Click outside or tap close button</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
