"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Compass,
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { SeatData } from "@/components/seating/seat-map";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export interface RecommendedSeatInfo {
  id: string;
  sectionName: string;
  row: string;
  seatNumber: string;
  price: number;
  status: string;
}

export interface BookingOptionItem {
  id: string;
  label: string;
  tier: "VIP" | "STANDARD" | "BUDGET";
  rationale: string;
  seats: RecommendedSeatInfo[];
  seatIds: string[];
  totalPrice: number;
  averagePrice: number;
  eventId?: string;
}

export interface EventSummaryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  city: string;
  minPrice: number;
  coverImage: string;
  description: string;
}

export interface AiAssistantResponse {
  type?: "EVENT_LIST" | "SEAT_OPTIONS";
  intent: {
    queryLevel?: "EVENT_LIST" | "SEAT_OPTIONS";
    category?: string | null;
    eventName: string | null;
    city: string | null;
    maxPrice: number | null;
    quantity: number;
    intentType?: "INQUIRY" | "BOOKING_COMMIT";
    preferences: {
      viewDirection: string;
      nearAisle: boolean;
    };
  };
  options?: BookingOptionItem[];
  recommendedSeatIds?: string[];
  recommendedSeats?: RecommendedSeatInfo[];
  events?: EventSummaryItem[];
  rationale: string;
  dynamicMultiplier?: number;
  targetEventId?: string;
}

interface FloatingAiAssistantProps {
  eventId?: string;
  eventTitle?: string;
  availableSeats?: SeatData[];
  onHighlightSeats?: (seatIds: string[]) => void;
  onSelectSeats?: (seats: SeatData[]) => void;
  onClearHighlight?: () => void;
  highlightedSeatIds?: string[];
}

const QUICK_PROMPTS = [
  "Tìm 2 vé VIP gần lối đi",
  "Xem thử các vị trí đẹp dưới $120",
  "Có concert hoặc festival nào hot?",
  "Chốt cho mình 2 vé khán đài trung tâm",
];

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  eventId,
  eventTitle,
  availableSeats = [],
  onHighlightSeats,
  onSelectSeats,
  onClearHighlight,
  highlightedSeatIds = [],
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AiAssistantResponse | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extract current event ID dynamically from URL or props
  const pathEventId = pathname?.match(/\/events\/([^/?#]+)/)?.[1];
  const currentEventId = eventId || pathEventId;
  const isEventPage = Boolean(currentEventId && pathname?.startsWith("/events/"));

  const handleSubmit = async (queryText?: string) => {
    const text = (queryText || prompt).trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "/api/v1";

      const res = await fetch(`${backendUrl}/ai/parse-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          eventId: currentEventId,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI service responded with status ${res.status}`);
      }

      const data: AiAssistantResponse = await res.json();
      setLastResult(data);
      setSelectedOptionIndex(0);

      // If Level 2 with seat recommendations
      if (data.type === "SEAT_OPTIONS" || data.options) {
        const activeOption = data.options?.[0];
        const targetSeatIds = activeOption ? activeOption.seatIds : (data.recommendedSeatIds || []);
        const targetSeats = activeOption ? activeOption.seats : (data.recommendedSeats || []);
        const targetId = activeOption?.eventId || data.targetEventId || currentEventId;

        if (currentEventId && targetId === currentEventId) {
          if (onHighlightSeats && targetSeatIds.length > 0) {
            onHighlightSeats(targetSeatIds);
          }
          window.dispatchEvent(
            new CustomEvent("auratickets:ai-highlight", {
              detail: { seatIds: targetSeatIds, option: activeOption },
            })
          );

          if (data.intent?.intentType === "BOOKING_COMMIT" && targetSeats.length > 0) {
            if (!user) {
              window.dispatchEvent(
                new CustomEvent("auratickets:auth-required", {
                  detail: { redirectUrl: targetId ? `/events/${targetId}` : "/search" },
                })
              );
            } else {
              if (onSelectSeats) {
                const matched = availableSeats.filter((s) => targetSeatIds.includes(s.id));
                if (matched.length > 0) onSelectSeats(matched);
              }
              window.dispatchEvent(
                new CustomEvent("auratickets:ai-select-commit", {
                  detail: { seats: targetSeats, option: activeOption },
                })
              );
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn("AI parse intent failed, executing fallback heuristic:", err);
      executeClientFallback(text);
    } finally {
      setIsLoading(false);
    }
  };

  const executeClientFallback = (userQuery: string) => {
    const qLower = userQuery.toLowerCase();
    const isCategory =
      qLower.includes("concert") ||
      qLower.includes("k-pop") ||
      qLower.includes("motorsport") ||
      qLower.includes("festival") ||
      qLower.includes("đua xe");

    if (isCategory && !isEventPage) {
      // Client-side Level 1 fallback
      const fallbackResult: AiAssistantResponse = {
        type: "EVENT_LIST",
        intent: {
          queryLevel: "EVENT_LIST",
          category: qLower.includes("k-pop") ? "K-Pop" : qLower.includes("motorsport") ? "Motorsport" : "Concert",
          eventName: null,
          city: null,
          maxPrice: null,
          quantity: 2,
          intentType: "INQUIRY",
          preferences: { viewDirection: "ANY", nearAisle: false },
        },
        events: [
          {
            id: "coldplay-music-of-the-spheres-hanoi",
            title: "Coldplay: Music of the Spheres World Tour",
            category: "Concert",
            date: "15 - 16 Th11, 2026",
            venue: "Sân vận động Quốc gia Mỹ Đình, Hà Nội",
            city: "Hanoi",
            minPrice: 85,
            coverImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
            description: "Đại nhạc hội Music of the Spheres với visual vũ trụ laser và vòng tay LED đồng bộ.",
          },
          {
            id: "f1-singapore-grand-prix-arena",
            title: "Formula 1 Singapore Grand Prix: Concert & Trackside Arena",
            category: "Motorsport",
            date: "18 - 20 Th09, 2026",
            venue: "Marina Bay Street Circuit, Singapore",
            city: "Singapore",
            minPrice: 198,
            coverImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
            description: "Chặng đua đêm rực lửa Marina Bay kết hợp đại nhạc hội The Padang Stage quốc tế.",
          },
          {
            id: "seventeen-right-here-world-tour",
            title: "SEVENTEEN [RIGHT HERE] World Tour Singapore",
            category: "K-Pop",
            date: "24 - 25 Th10, 2026",
            venue: "Singapore National Stadium",
            city: "Singapore",
            minPrice: 110,
            coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
            description: "World tour bùng nổ của 13 thành viên SEVENTEEN với dàn dựng sân khấu 360 độ.",
          },
        ],
        rationale: "Tìm thấy các sự kiện nổi bật đang mở bán vé trên AuraTickets.",
      };
      setLastResult(fallbackResult);
      return;
    }

    // Client-side Level 2 fallback
    const isVip = qLower.includes("vip");
    const isCommit = qLower.includes("chốt") || qLower.includes("đặt ngay") || qLower.includes("mua ngay") || qLower.includes("lấy ");
    const qtyMatch = userQuery.match(/(\d+)\s*(ghế|vé|seat|ticket)/i) || userQuery.match(/\b([1-8])\b/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 2;

    const seatsA: RecommendedSeatInfo[] = [
      { id: "sec-vip-A-1", sectionName: "VIP Center Floor", row: "A", seatNumber: "01", price: 180, status: "AVAILABLE" },
      { id: "sec-vip-A-2", sectionName: "VIP Center Floor", row: "A", seatNumber: "02", price: 180, status: "AVAILABLE" },
    ].slice(0, qty);

    const seatsB: RecommendedSeatInfo[] = [
      { id: "sec-lower-G-5", sectionName: "Lower Standard Tier", row: "G", seatNumber: "05", price: 85, status: "AVAILABLE" },
      { id: "sec-lower-G-6", sectionName: "Lower Standard Tier", row: "G", seatNumber: "06", price: 85, status: "AVAILABLE" },
    ].slice(0, qty);

    const targetId = currentEventId || "coldplay-music-of-the-spheres-hanoi";

    const fallbackResult: AiAssistantResponse = {
      type: "SEAT_OPTIONS",
      intent: {
        queryLevel: "SEAT_OPTIONS",
        eventName: eventTitle || "Sự Kiện",
        city: null,
        maxPrice: null,
        quantity: qty,
        intentType: isCommit ? "BOOKING_COMMIT" : "INQUIRY",
        preferences: { viewDirection: isVip ? "CENTER" : "ANY", nearAisle: true },
      },
      targetEventId: targetId,
      options: [
        {
          id: "option-premium",
          label: "Phương án 1: VIP Premium ($180/vé)",
          tier: "VIP",
          rationale: "Khu vực VIP Floor, tầm nhìn chính diện sân khấu tối ưu và gần lối đi.",
          seats: seatsA,
          seatIds: seatsA.map((s) => s.id),
          totalPrice: 180 * qty,
          averagePrice: 180,
          eventId: targetId,
        },
        {
          id: "option-value",
          label: "Phương án 2: Tiết kiệm ($85/vé)",
          tier: "STANDARD",
          rationale: "Tối ưu chi phí tiết kiệm hơn 50%, ghế liền kề cùng hàng view toàn cảnh.",
          seats: seatsB,
          seatIds: seatsB.map((s) => s.id),
          totalPrice: 85 * qty,
          averagePrice: 85,
          eventId: targetId,
        },
      ],
      recommendedSeatIds: seatsA.map((s) => s.id),
      recommendedSeats: seatsA,
      rationale: `Tìm thấy 2 phương án ghế liền kề phù hợp cho ${qty} người.`,
    };

    setLastResult(fallbackResult);
    setSelectedOptionIndex(0);

    if (isEventPage && onHighlightSeats) {
      onHighlightSeats(seatsA.map((s) => s.id));
    }
  };

  const getTargetEventId = (opt?: BookingOptionItem): string | undefined => {
    return opt?.eventId || lastResult?.targetEventId || currentEventId;
  };

  // Button 1: [Khám Phá Trên Sơ Đồ]
  const handleExploreOnMap = (idx = selectedOptionIndex) => {
    if (!lastResult) return;
    const currentOption = lastResult.options?.[idx];
    const targetEventId = getTargetEventId(currentOption);
    const seatIds = currentOption ? currentOption.seatIds : (lastResult.recommendedSeatIds || []);

    if (currentEventId && targetEventId === currentEventId) {
      // User is already on this event's page: Pan/Zoom & Highlight
      if (onHighlightSeats && seatIds.length > 0) {
        onHighlightSeats(seatIds);
      }
      window.dispatchEvent(
        new CustomEvent("auratickets:ai-highlight", {
          detail: { seatIds, option: currentOption },
        })
      );
    } else if (targetEventId) {
      // User is on home or another page: Route directly
      const query = new URLSearchParams();
      query.set("focus", "seating");
      if (seatIds.length > 0) {
        query.set("seats", seatIds.join(","));
      }
      query.set("autoSelect", "false");
      router.push(`/events/${targetEventId}?${query.toString()}`);
    }
  };

  // Button 2: [Chọn Phương Án Này]
  const handleSelectThisOption = (idx = selectedOptionIndex) => {
    if (!lastResult) return;
    const currentOption = lastResult.options?.[idx];
    const targetEventId = getTargetEventId(currentOption);
    const seatIds = currentOption ? currentOption.seatIds : (lastResult.recommendedSeatIds || []);
    const seats = currentOption ? currentOption.seats : (lastResult.recommendedSeats || []);

    // Authentication Guard: block action if user is not signed in
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("auratickets:auth-required", {
          detail: { redirectUrl: targetEventId ? `/events/${targetEventId}` : "/search" },
        })
      );
      if (targetEventId && targetEventId !== currentEventId) {
        router.push(`/auth/login?redirect=${encodeURIComponent(`/events/${targetEventId}`)}`);
      }
      return;
    }

    if (currentEventId && targetEventId === currentEventId) {
      // User is already on this event's page: add to cart directly
      if (onSelectSeats && availableSeats.length > 0) {
        const matched = availableSeats.filter((s) => seatIds.includes(s.id));
        if (matched.length > 0) {
          onSelectSeats(matched);
        }
      }
      window.dispatchEvent(
        new CustomEvent("auratickets:ai-select-commit", {
          detail: { seats, option: currentOption },
        })
      );
    } else if (targetEventId) {
      // Navigate to target event and auto-select
      const query = new URLSearchParams();
      query.set("focus", "seating");
      if (seatIds.length > 0) {
        query.set("seats", seatIds.join(","));
      }
      query.set("autoSelect", "true");
      router.push(`/events/${targetEventId}?${query.toString()}`);
    }
  };

  const handleSelectOptionTab = (idx: number) => {
    setSelectedOptionIndex(idx);
    if (!lastResult?.options?.[idx]) return;

    const opt = lastResult.options[idx];
    const targetId = getTargetEventId(opt);
    if (currentEventId && targetId === currentEventId) {
      if (onHighlightSeats) onHighlightSeats(opt.seatIds);
      window.dispatchEvent(
        new CustomEvent("auratickets:ai-highlight", {
          detail: { seatIds: opt.seatIds, option: opt },
        })
      );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Expanded Dialog Widget */}
      {isOpen ? (
        <div className="w-[390px] sm:w-[440px] rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-violet-500/30 shadow-2xl p-5 text-white flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">
                  Aura AI Concierge
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Hỗ trợ tìm kiếm & đặt vé thông minh
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Đóng trợ lý AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-violet-400" />
              Gợi ý truy vấn nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(qp);
                    handleSubmit(qp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-violet-950/60 border border-zinc-800 hover:border-violet-500/40 text-zinc-300 hover:text-violet-200 transition-all text-left"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: 'Tìm các concert', '2 vé VIP Coldplay'..."
              disabled={isLoading}
              className="w-full h-11 pl-3.5 pr-11 text-xs rounded-2xl bg-zinc-900 border border-zinc-700/80 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. LEVEL 1: EVENT_LIST DISPLAY */}
          {lastResult && lastResult.type === "EVENT_LIST" && lastResult.events && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-violet-500/20 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide text-zinc-300 flex items-center gap-1.5">
                  <span className="text-zinc-500">Mục tiêu:</span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border bg-violet-500/10 text-violet-300 border-violet-500/30">
                    Gợi Ý Khám Phá
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  {lastResult.events.length} Sự kiện phù hợp
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {lastResult.rationale}
              </p>

              <div className="space-y-2 pt-1">
                {lastResult.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-violet-500/40 transition-all flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex gap-2.5 items-center">
                      <img
                        src={ev.coverImage}
                        alt={ev.title}
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {ev.category}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 truncate">
                            <Calendar className="w-2.5 h-2.5" />
                            {ev.date}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-zinc-100 truncate">
                          {ev.title}
                        </h5>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          {ev.venue}
                        </p>
                        <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                          Từ {formatPrice(ev.minPrice)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/events/${ev.id}`)}
                      className="w-full h-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <span>Xem Chi Tiết & Chọn Ghế</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. LEVEL 2: SEAT_OPTIONS DISPLAY */}
          {lastResult && lastResult.type !== "EVENT_LIST" && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-violet-500/20 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {/* Streamlined Intent Status Bar */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide text-zinc-300 flex items-center gap-1.5">
                  <span className="text-zinc-500">Mục tiêu:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                      lastResult.intent?.intentType === "BOOKING_COMMIT"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm"
                        : "bg-violet-500/10 text-violet-300 border-violet-500/30"
                    }`}
                  >
                    {lastResult.intent?.intentType === "BOOKING_COMMIT"
                      ? "Chốt Mua Nhanh"
                      : "Gợi Ý Khám Phá"}
                  </span>
                </span>
              </div>

              {/* Multi-Option Tabs */}
              {lastResult.options && lastResult.options.length > 0 && (
                <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                  {lastResult.options.map((opt, idx) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOptionTab(idx)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                        selectedOptionIndex === idx
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Option Rationale */}
              <div className="space-y-1">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {lastResult.options?.[selectedOptionIndex]?.rationale || lastResult.rationale}
                </p>
              </div>

              {/* Seat Chips for Active Option */}
              {lastResult.options?.[selectedOptionIndex]?.seats && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                    Vị Trí Ghế Được Chỉ Định ({lastResult.options[selectedOptionIndex].seats.length} Ghế)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {lastResult.options[selectedOptionIndex].seats.map((seat) => (
                      <div
                        key={seat.id}
                        className="p-2 rounded-xl bg-zinc-950 border border-violet-500/30 flex flex-col text-[11px]"
                      >
                        <span className="font-bold text-violet-200">
                          {seat.sectionName}
                        </span>
                        <span className="text-zinc-400">
                          Hàng {seat.row} • Ghế {seat.seatNumber}
                        </span>
                        <span className="font-mono font-semibold text-emerald-400 mt-0.5">
                          {formatPrice(seat.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INDEPENDENT ACTION BUTTON CLUSTER FOR ACTIVE OPTION */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExploreOnMap(selectedOptionIndex)}
                    className="flex-1 h-9 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Khám Phá Trên Sơ Đồ
                  </button>
                  <button
                    onClick={() => handleSelectThisOption(selectedOptionIndex)}
                    className="flex-1 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Chọn Phương Án Này
                  </button>
                </div>

                {highlightedSeatIds.length > 0 && onClearHighlight && (
                  <button
                    onClick={onClearHighlight}
                    className="w-full h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] transition-colors"
                  >
                    Xóa Viền Phát Sáng Ghế
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Floating Pill */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-zinc-950/90 hover:bg-zinc-900 border border-violet-500/40 hover:border-violet-400 text-white shadow-xl shadow-violet-950/40 hover:shadow-violet-700/20 backdrop-blur-xl transition-all duration-300 hover:scale-105"
        >
          {/* Pulsing Aura Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 opacity-60 group-hover:opacity-100 blur-sm transition-all animate-pulse" />

          <div className="relative flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                Aura AI Concierge
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-[10px] text-violet-300">
                Hỗ trợ tìm kiếm & đặt vé thông minh
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};
