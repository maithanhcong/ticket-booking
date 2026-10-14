"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Info,
  Check,
  ShieldAlert,
  Lock,
  Activity,
  Radio,
  Compass,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { formatPrice } from "@/lib/utils";

export type SeatStatus = "AVAILABLE" | "LOCKED" | "BOOKED";

export type SeatingLayoutType = "concert" | "motorsport" | "festival";

export interface SeatData {
  id: string;
  sectionId: string;
  sectionName: string;
  row: string;
  seatNumber: string;
  price: number;
  status: SeatStatus;
  x: number; // 2D layout coordinate
  y: number;
}

export function detectLayoutType(
  category?: string,
  title?: string,
  eventId?: string
): SeatingLayoutType {
  const text = `${title || ""} ${category || ""} ${eventId || ""}`.toUpperCase();

  if (
    text.includes("F1") ||
    text.includes("FORMULA") ||
    text.includes("MOTORSPORT") ||
    text.includes("RACING") ||
    text.includes("RALLY") ||
    text.includes("HISTORIC FESTIVAL") ||
    text.includes("GRAND PRIX") ||
    text.includes("LIME ROCK") ||
    text.includes("CIRCUIT") ||
    text.includes("SPEEDWAY") ||
    text.includes("PADDOCK")
  ) {
    return "motorsport";
  }

  if (
    text.includes("CAMPING") ||
    text.includes("CAMP") ||
    text.includes("RV") ||
    text.includes("OPEN GROUNDS") ||
    text.includes("FESTIVAL GROUNDS") ||
    text.includes("TENT") ||
    text.includes("OUTDOOR FESTIVAL")
  ) {
    return "festival";
  }

  return "concert";
}

export interface SeatMapProps {
  eventId?: string;
  category?: string;
  eventTitle?: string;
  layoutType?: SeatingLayoutType;
  wsUrl?: string;
  seats?: SeatData[];
  selectedSeatIds: string[];
  highlightedSeatIds?: string[];
  onToggleSeat: (seat: SeatData) => void;
  onSelectMultipleSeats?: (seats: SeatData[]) => void;
  maxSelectable?: number;
  className?: string;
  activeTierFilter?: string;
  onTierFilterChange?: (tier: string) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  eventId = "evt-cyber-symphony-2026",
  category,
  eventTitle,
  layoutType,
  wsUrl,
  seats: initialSeats,
  selectedSeatIds,
  highlightedSeatIds = [],
  onToggleSeat,
  onSelectMultipleSeats,
  maxSelectable = 6,
  className = "",
  activeTierFilter,
  onTierFilterChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeLayout: SeatingLayoutType =
    layoutType || detectLayoutType(category, eventTitle, eventId);

  // Generate category-specific stadium/circuit/camping layout if seats are not provided
  const [seats, setSeats] = useState<SeatData[]>(() => {
    if (initialSeats && initialSeats.length > 0) return initialSeats;
    return generateSeatsByCategory(category, eventTitle, eventId);
  });

  // WebSocket Live Synchronization State
  const [wsConnected, setWsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncedBatchCount, setSyncedBatchCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // 100ms Batched WebSocket Synchronizer
  useEffect(() => {
    const defaultWsUrl =
      wsUrl || process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000/seating";

    let socket: Socket;
    try {
      socket = io(defaultWsUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 4000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setWsConnected(true);
        socket.emit("join_event", { eventId });
      });

      socket.on("disconnect", () => {
        setWsConnected(false);
      });

      // Listen for 100ms batched status updates emitted by NestJS SeatingGateway
      socket.on(
        "seats:batch_update",
        (data: {
          eventId: string;
          timestamp: number;
          count: number;
          updates: Array<{ seatId: string; status: SeatStatus }>;
        }) => {
          if (!data || data.eventId !== eventId || !Array.isArray(data.updates)) return;

          setSeats((prevSeats) => {
            const updateMap = new Map(data.updates.map((u) => [u.seatId, u.status]));
            let changed = false;

            const next = prevSeats.map((seat) => {
              const updatedStatus = updateMap.get(seat.id);
              if (updatedStatus && updatedStatus !== seat.status) {
                changed = true;
                return { ...seat, status: updatedStatus };
              }
              return seat;
            });

            return changed ? next : prevSeats;
          });

          setLastSyncTime(Date.now());
          setSyncedBatchCount((c) => c + data.updates.length);
        }
      );
    } catch (e) {
      console.warn("WebSocket client connection notice:", e);
    }

    return () => {
      if (socket) {
        socket.emit("leave_event", { eventId });
        socket.disconnect();
      }
    };
  }, [eventId, wsUrl]);

  // Simulate real-time concurrent user activity (interactive live demo)
  const triggerSimulation = () => {
    const available = seats.filter(
      (s) => s.status === "AVAILABLE" && !selectedSeatIds.includes(s.id)
    );
    if (available.length === 0) return;

    // Pick 1-2 random seats
    const targetSeats = available
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(2, available.length));
    const targetIds = targetSeats.map((s) => s.id);

    if (socketRef.current?.connected) {
      socketRef.current.emit("simulate_activity", {
        eventId,
        seatIds: targetIds,
        status: "LOCKED",
      });
    } else {
      // Local immediate optimistic simulation
      setSeats((prev) =>
        prev.map((s) =>
          targetIds.includes(s.id) ? { ...s, status: "LOCKED" } : s
        )
      );
      setSyncedBatchCount((c) => c + targetIds.length);
      setLastSyncTime(Date.now());
    }
  };

  // Pan and Zoom Transformation State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<SeatData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Canvas bounds
  const SEAT_RADIUS = 7;
  const VIRTUAL_WIDTH = 1200;
  const VIRTUAL_HEIGHT = 760;

  // Transient Ctrl-scroll hint toast state
  const [showCtrlZoomHint, setShowCtrlZoomHint] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // TIER & PRICE FILTER STATE (LAYOUT AWARE)
  // ---------------------------------------------------------------------------
  const TABS_BY_LAYOUT: Record<
    SeatingLayoutType,
    Array<{ id: string; label: string }>
  > = {
    concert: [
      { id: "ALL", label: "All Tiers" },
      { id: "sec-vip", label: "VIP Floor ($280)" },
      { id: "sec-lower-center", label: "Lower Bowl ($165)" },
      { id: "sec-balcony", label: "Balcony ($75)" },
    ],
    motorsport: [
      { id: "ALL", label: "All Zones" },
      { id: "sec-grandstand-vip", label: "Grandstand VIP ($280)" },
      { id: "sec-trackside-pit", label: "Trackside Pit ($165)" },
      { id: "sec-bleachers", label: "General Bleachers ($85)" },
    ],
    festival: [
      { id: "ALL", label: "All Zones" },
      { id: "sec-pit-camp", label: "Pit Pass Camp ($280)" },
      { id: "sec-rv-zone", label: "RV Trackside ($165)" },
      { id: "sec-general-camp", label: "General Camping ($85)" },
    ],
  };

  const tierTabs = TABS_BY_LAYOUT[activeLayout] || TABS_BY_LAYOUT.concert;

  const [tierFilter, setTierFilter] = useState<string>(activeTierFilter || "ALL");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(300);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [autoPickQty, setAutoPickQty] = useState<number>(2);
  const [autoPickTier, setAutoPickTier] = useState<string>("ALL");
  const [autoPickNotice, setAutoPickNotice] = useState<string | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTierFilter) {
      setTierFilter(activeTierFilter);
    }
  }, [activeTierFilter]);

  const handleTierChange = (newTier: string) => {
    setTierFilter(newTier);
    if (onTierFilterChange) {
      onTierFilterChange(newTier);
    }
  };

  const isSeatMatched = useCallback(
    (seat: SeatData): boolean => {
      if (tierFilter !== "ALL") {
        if (seat.sectionId === tierFilter) return true;
        // Cross-category tier aliases
        if (
          (tierFilter === "sec-vip" ||
            tierFilter === "sec-grandstand-vip" ||
            tierFilter === "sec-pit-camp") &&
          (seat.sectionId === "sec-vip" ||
            seat.sectionId === "sec-grandstand-vip" ||
            seat.sectionId === "sec-pit-camp")
        ) {
          return true;
        }
        if (
          (tierFilter === "sec-lower-center" ||
            tierFilter === "sec-trackside-pit" ||
            tierFilter === "sec-rv-zone") &&
          (seat.sectionId === "sec-lower-center" ||
            seat.sectionId === "sec-trackside-pit" ||
            seat.sectionId === "sec-rv-zone")
        ) {
          return true;
        }
        if (
          (tierFilter === "sec-balcony" ||
            tierFilter === "sec-bleachers" ||
            tierFilter === "sec-general-camp") &&
          (seat.sectionId === "sec-balcony" ||
            seat.sectionId === "sec-bleachers" ||
            seat.sectionId === "sec-general-camp")
        ) {
          return true;
        }
        if (
          tierFilter === "sec-wings" &&
          (seat.sectionId === "sec-west" || seat.sectionId === "sec-east")
        ) {
          return true;
        }
        return false;
      }
      if (seat.price > maxPriceFilter) {
        return false;
      }
      return true;
    },
    [tierFilter, maxPriceFilter]
  );

  const centerOnCoords = useCallback(
    (vx: number, vy: number) => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.max(0.85, transform.scale);
      const newX = cw / 2 - vx * scale;
      const newY = ch / 2 - vy * scale;
      setTransform({ x: newX, y: newY, scale });
    },
    [transform.scale]
  );

  // Auto-focus and pan smoothly onto AI Recommended seats
  useEffect(() => {
    if (highlightedSeatIds && highlightedSeatIds.length > 0) {
      const targetSeats = seats.filter((s) => highlightedSeatIds.includes(s.id));
      if (targetSeats.length > 0) {
        const avgX = targetSeats.reduce((sum, s) => sum + s.x, 0) / targetSeats.length;
        const avgY = targetSeats.reduce((sum, s) => sum + s.y, 0) / targetSeats.length;
        centerOnCoords(avgX, avgY);
      }
    }
  }, [highlightedSeatIds, seats, centerOnCoords]);

  // Auto-Seat Picker Algorithm ("Best Available")
  const handleAutoPick = () => {
    const available = seats.filter((s) => {
      if (s.status !== "AVAILABLE") return false;
      if (autoPickTier !== "ALL") {
        if (s.sectionId === autoPickTier) return true;
        if (
          (autoPickTier === "sec-vip" ||
            autoPickTier === "sec-grandstand-vip" ||
            autoPickTier === "sec-pit-camp") &&
          (s.sectionId === "sec-vip" ||
            s.sectionId === "sec-grandstand-vip" ||
            s.sectionId === "sec-pit-camp")
        ) {
          return true;
        }
        if (
          (autoPickTier === "sec-lower-center" ||
            autoPickTier === "sec-trackside-pit" ||
            autoPickTier === "sec-rv-zone") &&
          (s.sectionId === "sec-lower-center" ||
            s.sectionId === "sec-trackside-pit" ||
            s.sectionId === "sec-rv-zone")
        ) {
          return true;
        }
        if (
          (autoPickTier === "sec-balcony" ||
            autoPickTier === "sec-bleachers" ||
            autoPickTier === "sec-general-camp") &&
          (s.sectionId === "sec-balcony" ||
            s.sectionId === "sec-bleachers" ||
            s.sectionId === "sec-general-camp")
        ) {
          return true;
        }
        if (
          autoPickTier === "sec-wings" &&
          (s.sectionId === "sec-west" || s.sectionId === "sec-east")
        ) {
          return true;
        }
        return false;
      }
      if (s.price > maxPriceFilter) return false;
      return true;
    });

    if (available.length === 0) {
      setAutoPickNotice("No seats match current criteria");
      setTimeout(() => setAutoPickNotice(null), 3000);
      return;
    }

    if (autoPickQty === 1) {
      available.sort((a, b) => {
        const distA = Math.hypot(a.x - 600, a.y - 40);
        const distB = Math.hypot(b.x - 600, b.y - 40);
        return distA - distB;
      });
      const best = available[0];
      if (onSelectMultipleSeats) {
        onSelectMultipleSeats([best]);
      } else {
        onToggleSeat(best);
      }
      centerOnCoords(best.x, best.y);
      setAutoPickNotice(`Selected Row ${best.row}, Seat ${best.seatNumber} (${best.sectionName})!`);
      setTimeout(() => setAutoPickNotice(null), 3200);
      return;
    }

    // Group by section and row for contiguous block search
    const rowGroups: { [key: string]: SeatData[] } = {};
    for (const s of available) {
      const key = `${s.sectionId}-${s.row}`;
      if (!rowGroups[key]) rowGroups[key] = [];
      rowGroups[key].push(s);
    }

    let bestBlock: SeatData[] | null = null;
    let bestScore = Infinity;

    for (const key of Object.keys(rowGroups)) {
      const rowSeats = rowGroups[key].sort(
        (a, b) => parseInt(a.seatNumber, 10) - parseInt(b.seatNumber, 10)
      );

      for (let i = 0; i <= rowSeats.length - autoPickQty; i++) {
        const window = rowSeats.slice(i, i + autoPickQty);
        let isContiguous = true;
        for (let j = 0; j < window.length - 1; j++) {
          const num1 = parseInt(window[j].seatNumber, 10);
          const num2 = parseInt(window[j + 1].seatNumber, 10);
          if (num2 !== num1 + 1) {
            isContiguous = false;
            break;
          }
        }

        if (isContiguous) {
          const avgX = window.reduce((sum, s) => sum + s.x, 0) / window.length;
          const avgY = window.reduce((sum, s) => sum + s.y, 0) / window.length;
          const score = Math.hypot(avgX - 600, avgY - 40);
          if (score < bestScore) {
            bestScore = score;
            bestBlock = window;
          }
        }
      }
    }

    if (!bestBlock) {
      available.sort((a, b) => {
        const distA = Math.hypot(a.x - 600, a.y - 40);
        const distB = Math.hypot(b.x - 600, b.y - 40);
        return distA - distB;
      });
      bestBlock = available.slice(0, autoPickQty);
    }

    if (bestBlock && bestBlock.length > 0) {
      if (onSelectMultipleSeats) {
        onSelectMultipleSeats(bestBlock);
      } else {
        bestBlock.forEach((s) => {
          if (!selectedSeatIds.includes(s.id)) {
            onToggleSeat(s);
          }
        });
      }
      const avgX = bestBlock.reduce((sum, s) => sum + s.x, 0) / bestBlock.length;
      const avgY = bestBlock.reduce((sum, s) => sum + s.y, 0) / bestBlock.length;
      centerOnCoords(avgX, avgY);
      setAutoPickNotice(
        `Selected ${bestBlock.length} contiguous seats in ${bestBlock[0].sectionName} (Row ${bestBlock[0].row})!`
      );
      setTimeout(() => setAutoPickNotice(null), 3200);
    }
  };

  // Radar Minimap Click-to-Pan Handler
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mCanvas = minimapCanvasRef.current;
    const container = containerRef.current;
    if (!mCanvas || !container) return;

    const rect = mCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const targetVx = (mx / 160) * VIRTUAL_WIDTH;
    const targetVy = (my / 100) * VIRTUAL_HEIGHT;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const newX = cw / 2 - targetVx * transform.scale;
    const newY = ch / 2 - targetVy * transform.scale;

    setTransform((prev) => ({ ...prev, x: newX, y: newY }));
  };

  // ---------------------------------------------------------------------------
  // RADAR MINIMAP 60 FPS RENDER LOOP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const mCanvas = minimapCanvasRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext("2d");
    if (!mCtx) return;

    mCtx.clearRect(0, 0, 160, 100);

    const scaleX = 160 / VIRTUAL_WIDTH;
    const scaleY = 100 / VIRTUAL_HEIGHT;

    // 1. Active Geometry Silhouette on Minimap
    if (activeLayout === "motorsport") {
      mCtx.beginPath();
      mCtx.moveTo(280 * scaleX, 140 * scaleY);
      mCtx.lineTo(920 * scaleX, 140 * scaleY);
      mCtx.bezierCurveTo(1080 * scaleX, 140 * scaleY, 1080 * scaleX, 440 * scaleY, 920 * scaleX, 440 * scaleY);
      mCtx.lineTo(280 * scaleX, 440 * scaleY);
      mCtx.bezierCurveTo(120 * scaleX, 440 * scaleY, 120 * scaleX, 140 * scaleY, 280 * scaleX, 140 * scaleY);
      mCtx.closePath();
      mCtx.strokeStyle = "rgba(244, 244, 245, 0.65)";
      mCtx.lineWidth = 3.5;
      mCtx.stroke();

      // Mini Start / Finish Line Indicator
      mCtx.fillStyle = "#ef4444";
      mCtx.fillRect(600 * scaleX - 1, 412 * scaleY, 2, 56 * scaleY);
    } else if (activeLayout === "festival") {
      // Mini 3-zone color-coded plot boundaries
      mCtx.fillStyle = "rgba(168, 85, 247, 0.4)";
      mCtx.fillRect(140 * scaleX, 110 * scaleY, 420 * scaleX, 180 * scaleY);
      mCtx.fillStyle = "rgba(245, 158, 11, 0.4)";
      mCtx.fillRect(640 * scaleX, 110 * scaleY, 420 * scaleX, 180 * scaleY);
      mCtx.fillStyle = "rgba(16, 185, 129, 0.4)";
      mCtx.fillRect(160 * scaleX, 390 * scaleY, 880 * scaleX, 270 * scaleY);
    } else {
      // Concert Stage silhouette
      mCtx.fillStyle = "rgba(99, 102, 241, 0.5)";
      const stW = 460 * scaleX;
      const stH = 44 * scaleY;
      const stX = ((VIRTUAL_WIDTH - 460) / 2) * scaleX;
      const stY = 40 * scaleY;
      mCtx.fillRect(stX, stY, stW, stH);
    }

    // 2. All seats as miniature points
    for (let i = 0; i < seats.length; i++) {
      const s = seats[i];
      const isSelected = selectedSeatIds.includes(s.id);
      const matched = isSeatMatched(s);

      const mx = s.x * scaleX;
      const my = s.y * scaleY;

      if (!matched) {
        mCtx.fillStyle = "rgba(63, 63, 70, 0.25)";
      } else if (isSelected) {
        mCtx.fillStyle = "#3b82f6";
      } else if (s.status === "AVAILABLE") {
        mCtx.fillStyle = "#10b981";
      } else if (s.status === "LOCKED") {
        mCtx.fillStyle = "#f59e0b";
      } else {
        mCtx.fillStyle = "#3f3f46";
      }

      mCtx.fillRect(mx - 1, my - 1, 2, 2);
    }

    // 3. Viewport Camera Box (glow cyan rect)
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth || 800;
      const ch = containerRef.current.clientHeight || 600;

      const vx0 = -transform.x / transform.scale;
      const vy0 = -transform.y / transform.scale;
      const vx1 = (cw - transform.x) / transform.scale;
      const vy1 = (ch - transform.y) / transform.scale;

      const bx = Math.max(0, vx0 * scaleX);
      const by = Math.max(0, vy0 * scaleY);
      const bw = Math.min(160 - bx, (vx1 - vx0) * scaleX);
      const bh = Math.min(100 - by, (vy1 - vy0) * scaleY);

      mCtx.fillStyle = "rgba(6, 182, 212, 0.18)";
      mCtx.fillRect(bx, by, bw, bh);

      mCtx.strokeStyle = "#06b6d4";
      mCtx.lineWidth = 1.5;
      mCtx.strokeRect(bx, by, bw, bh);
    }
  }, [seats, transform, selectedSeatIds, isSeatMatched, activeLayout]);

  // Automated Bounding Box & Fit-to-Viewport Engine
  const fitToViewport = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    let minX = 80;
    let maxX = 1120;
    let minY = 40;
    let maxY = 700;

    if (seats.length > 0) {
      let seatMinX = Infinity;
      let seatMaxX = -Infinity;
      let seatMinY = Infinity;
      let seatMaxY = -Infinity;

      for (let i = 0; i < seats.length; i++) {
        const s = seats[i];
        if (s.x < seatMinX) seatMinX = s.x;
        if (s.x > seatMaxX) seatMaxX = s.x;
        if (s.y < seatMinY) seatMinY = s.y;
        if (s.y > seatMaxY) seatMaxY = s.y;
      }

      minX = Math.min(seatMinX - 35, 100);
      maxX = Math.max(seatMaxX + 35, 1100);
      minY = Math.min(seatMinY - 25, 40);
      maxY = Math.max(seatMaxY + 35, 680);
    }

    const contentWidth = Math.max(200, maxX - minX);
    const contentHeight = Math.max(200, maxY - minY);
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Safe padding margin (92% viewport fill)
    const scale = Math.min(clientWidth / contentWidth, clientHeight / contentHeight) * 0.92;
    const boundedScale = Math.max(0.35, Math.min(2.5, scale));

    const x = clientWidth / 2 - contentCenterX * boundedScale;
    const y = clientHeight / 2 - contentCenterY * boundedScale;

    setTransform({ x, y, scale: boundedScale });
  }, [seats]);

  const centerSeatMap = fitToViewport;

  // Sync seats and invoke auto-fit when initialSeats prop changes/finishes loading
  const initialFitRef = useRef(false);
  useEffect(() => {
    if (initialSeats && initialSeats.length > 0) {
      setSeats(initialSeats);
      if (!initialFitRef.current) {
        initialFitRef.current = true;
        requestAnimationFrame(() => {
          fitToViewport();
        });
      }
    }
  }, [initialSeats, fitToViewport]);

  // Attach ResizeObserver to canvas container ref to guarantee auto-fit when DOM geometry settles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            fitToViewport();
          });
        }
      }
    });

    resizeObserver.observe(container);

    // Initial check wrapped in requestAnimationFrame
    rafId = requestAnimationFrame(() => {
      fitToViewport();
    });

    window.addEventListener("resize", fitToViewport);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitToViewport);
    };
  }, [fitToViewport]);

  // High-DPI Canvas Rendering Engine (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply pan/zoom transformations
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Draw Arena / Stage / Circuit / Festival Layout Visuals
    drawLayoutBackground(ctx, activeLayout, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 2. Render all seats with fast batch canvas primitives
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const isSelected = selectedSeatIds.includes(seat.id);
      const isHovered = hoveredSeat?.id === seat.id;
      const isDimmed = !isSeatMatched(seat);
      const isAiHighlighted = highlightedSeatIds.includes(seat.id);

      drawSingleSeat(ctx, seat, isSelected, isHovered, SEAT_RADIUS, isDimmed, isAiHighlighted);
    }

    ctx.restore();
    ctx.restore();
  }, [seats, selectedSeatIds, highlightedSeatIds, hoveredSeat, transform, isSeatMatched, activeLayout]);

  // Handle Wheel Zoom with Strict Scroll-Hijack Prevention
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // If Ctrl or Cmd is NOT pressed: DO NOT preventDefault! Allow normal page scroll!
    if (!e.ctrlKey && !e.metaKey) {
      setShowCtrlZoomHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowCtrlZoomHint(false);
      }, 2200);
      return; // Natural webpage scrolling continues uninhibited!
    }

    // Ctrl or Cmd IS pressed: execute smooth canvas zoom
    e.preventDefault();
    setShowCtrlZoomHint(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(0.35, Math.min(3.5, transform.scale * zoomFactor));

    // Zoom centered towards mouse cursor
    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  // Convert client coordinates to virtual coordinates
  const clientToVirtual = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { vx: 0, vy: 0, cx: 0, cy: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const vx = (cx - transform.x) / transform.scale;
    const vy = (cy - transform.y) / transform.scale;
    return { vx, vy, cx, cy };
  };

  // Find seat at coordinates with hit-testing
  const findSeatAt = (vx: number, vy: number): SeatData | null => {
    const hitRadius = SEAT_RADIUS + 3;
    const hitRadiusSq = hitRadius * hitRadius;

    for (let i = 0; i < seats.length; i++) {
      const s = seats[i];
      const dx = vx - s.x;
      const dy = vy - s.y;
      if (dx * dx + dy * dy <= hitRadiusSq) {
        return s;
      }
    }
    return null;
  };

  // Pointer / Mouse Down (Start Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  // Pointer / Mouse Move (Pan or Hover Seat)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      }));
      if (hoveredSeat) setHoveredSeat(null);
      return;
    }

    const { vx, vy, cx, cy } = clientToVirtual(e.clientX, e.clientY);
    const hitSeat = findSeatAt(vx, vy);

    if (hitSeat) {
      setHoveredSeat(hitSeat);
      setTooltipPos({ x: cx, y: cy });
    } else if (hoveredSeat) {
      setHoveredSeat(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Seat Click Interaction
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { vx, vy } = clientToVirtual(e.clientX, e.clientY);
    const hitSeat = findSeatAt(vx, vy);

    if (!hitSeat) return;
    if (!isSeatMatched(hitSeat)) return;

    if (hitSeat.status === "BOOKED") return;
    if (hitSeat.status === "LOCKED") return;

    const isAlreadySelected = selectedSeatIds.includes(hitSeat.id);
    if (!isAlreadySelected && selectedSeatIds.length >= maxSelectable) {
      alert(`Maximum of ${maxSelectable} seats allowed per reservation.`);
      return;
    }

    onToggleSeat(hitSeat);
  };

  // Zoom Controls
  const zoomIn = () => {
    setTransform((prev) => {
      const newScale = Math.min(3.5, prev.scale * 1.25);
      return { ...prev, scale: newScale };
    });
  };

  const zoomOut = () => {
    setTransform((prev) => {
      const newScale = Math.max(0.4, prev.scale / 1.25);
      return { ...prev, scale: newScale };
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-[620px] lg:h-[680px] w-full rounded-2xl bg-zinc-950 border border-zinc-200 overflow-hidden shadow-lg flex flex-col ${className}`}
    >
      {/* Background Matrix Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredSeat(null);
        }}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Floating Hover Tooltip */}
      {hoveredSeat && (
        <div
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75 ease-out"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 8}px` }}
        >
          <div className="rounded-xl border border-zinc-200 bg-white/98 p-2.5 px-3.5 shadow-xl backdrop-blur-md text-xs text-zinc-900 min-w-[170px]">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-1.5 mb-1.5">
              <span className="font-bold text-zinc-900">{hoveredSeat.sectionName}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  selectedSeatIds.includes(hoveredSeat.id)
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : hoveredSeat.status === "AVAILABLE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : hoveredSeat.status === "LOCKED"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {selectedSeatIds.includes(hoveredSeat.id)
                  ? "Selected"
                  : hoveredSeat.status}
              </span>
            </div>
            <div className="space-y-1 text-zinc-500">
              <div className="flex justify-between">
                <span>Row / Seat:</span>
                <span className="font-semibold text-zinc-800">
                  Row {hoveredSeat.row}, #{hoveredSeat.seatNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Standard Price:</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {formatPrice(hoveredSeat.price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Canvas Navigation & Zoom Control Toolbar */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 rounded-xl bg-white/95 border border-zinc-200 p-1 shadow-md backdrop-blur-md text-zinc-700">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-zinc-200 mx-0.5" />
        <button
          onClick={fitToViewport}
          title="Reset View & Center Seat Map"
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </div>

      {/* Transient Non-Intrusive Ctrl+Scroll Zoom Tooltip */}
      {showCtrlZoomHint && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-zinc-200 px-4 py-2.5 text-xs font-medium text-zinc-800 shadow-xl backdrop-blur-md">
            <Info className="h-4 w-4 text-red-600 shrink-0" />
            <span>
              Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-900">Ctrl</kbd> + scroll to zoom the seating map
            </span>
          </div>
        </div>
      )}

      {/* 1. TOP-LEFT: Interactive Tier / Zone Filter & Budget Range Slider */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 max-w-[calc(100%-240px)]">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white/95 border border-zinc-200 px-3 py-1.5 shadow-md backdrop-blur-md text-xs text-zinc-800">
          <span className="text-[11px] font-bold text-zinc-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3 text-red-600" />
            <span>{activeLayout === "motorsport" || activeLayout === "festival" ? "Zone:" : "Tier:"}</span>
          </span>

          {tierTabs.map((tier) => (
            <button
              key={tier.id}
              onClick={() => handleTierChange(tierFilter === tier.id && tier.id !== "ALL" ? "ALL" : tier.id)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                tierFilter === tier.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              {tier.label}
            </button>
          ))}

          <div className="h-3.5 w-px bg-zinc-800 mx-1" />

          {/* Price Range Slider */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
            <span className="text-zinc-500">Max:</span>
            <span className="font-mono font-bold text-emerald-400">${maxPriceFilter}</span>
            <input
              type="range"
              min={75}
              max={280}
              step={5}
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-16 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* 2. AUTO-SEAT PICKER TOOLBAR ("Best Available") */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-900/90 border border-zinc-800/90 px-3 py-1.5 shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Best Available:</span>
          </div>

          <div className="flex items-center bg-zinc-950/80 rounded-lg p-0.5 border border-zinc-800">
            {[1, 2, 4].map((qty) => (
              <button
                key={qty}
                onClick={() => setAutoPickQty(qty)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                  autoPickQty === qty
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {qty} {qty === 1 ? "Seat" : "Seats"}
              </button>
            ))}
          </div>

          <button
            onClick={handleAutoPick}
            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Sparkles className="h-3 w-3" />
            <span>Auto-Pick Best Seats</span>
          </button>

          {autoPickNotice && (
            <span className="text-[11px] text-emerald-400 font-medium animate-in fade-in">
              {autoPickNotice}
            </span>
          )}
        </div>
      </div>

      {/* Real-time WebSocket Live Status & Simulation Action */}
      <div className="absolute top-3 right-3 flex items-center gap-2 rounded-xl bg-zinc-900/90 border border-zinc-800/90 px-3 py-1.5 shadow-xl backdrop-blur-md z-30 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              wsConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                : "bg-amber-400"
            }`}
          />
          <span className="font-mono text-[11px] text-zinc-300 hidden sm:inline">
            {wsConnected ? "Live Sync" : "Simulated"}
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        <button
          onClick={triggerSimulation}
          title="Simulate a concurrent customer locking seats"
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-lg transition-colors"
        >
          <Radio className="h-3 w-3 text-blue-400 animate-pulse" />
          <span>Simulate</span>
        </button>
      </div>

      {/* 3. RADAR MINIMAP (PICTURE-IN-PICTURE STADIUM OVERVIEW) */}
      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1">
        <div className="flex items-center justify-between bg-zinc-900/95 border border-zinc-800/90 rounded-t-xl px-2.5 py-1 backdrop-blur-md text-[10px] font-bold text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Compass className="h-3 w-3 text-cyan-400" />
            <span>Radar Minimap</span>
          </span>
          <button
            onClick={() => setIsMinimapOpen(!isMinimapOpen)}
            className="text-zinc-400 hover:text-white px-1 text-xs"
            title={isMinimapOpen ? "Collapse Minimap" : "Expand Minimap"}
          >
            {isMinimapOpen ? "—" : "□"}
          </button>
        </div>

        {isMinimapOpen && (
          <div className="relative rounded-b-xl overflow-hidden border border-t-0 border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md shadow-2xl">
            <canvas
              ref={minimapCanvasRef}
              width={160}
              height={100}
              onClick={handleMinimapClick}
              className="cursor-crosshair block"
              title="Click anywhere on minimap to jump main viewport"
            />
            <div className="absolute bottom-1 right-1.5 text-[8px] text-zinc-500 font-mono pointer-events-none">
              Click to Pan
            </div>
          </div>
        )}
      </div>

      {/* Selected Seats Counter Chip */}
      {selectedSeatIds.length > 0 && (
        <div className={`absolute bottom-4 z-30 flex items-center gap-2.5 rounded-xl bg-blue-600/95 border border-blue-400/30 px-3.5 py-2 shadow-xl backdrop-blur-md text-white transition-all ${
          isMinimapOpen ? "left-48" : "left-20"
        }`}>
          <div className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span className="text-xs font-bold">
            {selectedSeatIds.length} seat{selectedSeatIds.length > 1 ? "s" : ""} selected
          </span>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// HELPER DRAW FUNCTIONS FOR 60 FPS CANVAS RENDERING
// =========================================================================

// =========================================================================
// HELPER DRAW FUNCTIONS FOR 60 FPS CANVAS RENDERING
// =========================================================================

function drawLayoutBackground(
  ctx: CanvasRenderingContext2D,
  layoutType: SeatingLayoutType,
  virtualWidth: number,
  virtualHeight: number
) {
  if (layoutType === "motorsport") {
    drawMotorsportCircuit(ctx, virtualWidth, virtualHeight);
  } else if (layoutType === "festival") {
    drawFestivalGrounds(ctx, virtualWidth, virtualHeight);
  } else {
    drawConcertStage(ctx, virtualWidth);
  }
}

function drawMotorsportCircuit(ctx: CanvasRenderingContext2D, virtualWidth: number, virtualHeight: number) {
  ctx.save();

  // 1. Asphalt Racetrack Circuit Line (Continuous Loop)
  ctx.beginPath();
  ctx.moveTo(280, 140);
  ctx.lineTo(920, 140);
  ctx.bezierCurveTo(1080, 140, 1080, 440, 920, 440);
  ctx.lineTo(280, 440);
  ctx.bezierCurveTo(120, 440, 120, 140, 280, 140);
  ctx.closePath();

  // Wide Asphalt Surface
  ctx.lineWidth = 56;
  ctx.strokeStyle = "#141416";
  ctx.stroke();

  // Asphalt Texture Inner Band
  ctx.lineWidth = 50;
  ctx.strokeStyle = "#1e1f24";
  ctx.stroke();

  // Inner & Outer Track Boundary Lines
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(244, 244, 245, 0.85)";
  ctx.stroke();

  // 2. Red & White Racing Curbs (Kerbs) on Apexes
  drawKerbArc(ctx, 220, 290, 85, Math.PI * 0.72, Math.PI * 1.28);
  drawKerbArc(ctx, 980, 290, 85, -Math.PI * 0.28, Math.PI * 0.28);

  // 3. Checkered Start / Finish Line Across Main Straightaway at x=600 (y: 412 to 468)
  const sfX = 600;
  const sfYTop = 412;
  const sfYBottom = 468;
  const checkSize = 7;
  const numRows = Math.floor((sfYBottom - sfYTop) / checkSize);
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#ffffff" : "#09090b";
      ctx.fillRect(sfX + c * checkSize - 10, sfYTop + r * checkSize, checkSize, checkSize);
    }
  }

  // Start / Finish Line Annotation
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("START / FINISH LINE 🏁", sfX, 485);

  // 4. Pit Lane & Team Garages (Between x=360 and 840, y=345 to 385)
  ctx.fillStyle = "rgba(30, 31, 36, 0.9)";
  ctx.fillRect(360, 345, 480, 38);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(360, 345, 480, 38);
  ctx.setLineDash([]);

  // Solid Pit Wall Barrier
  ctx.fillStyle = "rgba(113, 113, 122, 0.95)";
  ctx.fillRect(360, 404, 480, 6);

  // Pit Lane Text Label
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PIT LANE & TEAM PADDOCK GARAGES", 600, 368);

  // 5. Trackside Zone Annotations
  ctx.fillStyle = "rgba(212, 212, 216, 0.85)";
  ctx.font = "bold 11px Inter, sans-serif";

  // Grandstand VIP Header (Facing Straightaway)
  ctx.fillText("GRANDSTAND VIP PLATINUM TERRACE ($280)", 600, 508);

  // Trackside Pit Header
  ctx.fillText("TRACKSIDE PIT BOXES ($165)", 600, 240);

  // Turn 1 & Hairpin Bleachers Headers
  ctx.fillText("TURN 1 BLEACHERS ($85)", 180, 130);
  ctx.fillText("HAIRPIN BLEACHERS ($85)", 1020, 130);

  // Backfield RV Camping Header
  ctx.fillText("TRACKSIDE RV PADDOCK CAMPING", 600, 50);

  ctx.restore();
}

function drawKerbArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const steps = 14;
  const angleDelta = (endAngle - startAngle) / steps;
  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + i * angleDelta;
    const a2 = a1 + angleDelta;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, a1, a2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = i % 2 === 0 ? "#dc2626" : "#ffffff";
    ctx.stroke();
  }
}

function drawFestivalGrounds(ctx: CanvasRenderingContext2D, virtualWidth: number, virtualHeight: number) {
  ctx.save();

  // Zone 3: VIP Pit Pass Campground (Top Left)
  ctx.fillStyle = "rgba(88, 28, 135, 0.16)";
  ctx.strokeStyle = "rgba(168, 85, 247, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(140, 110, 420, 180, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ZONE 3 • VIP PIT PASS CAMPGROUND ($280)", 350, 140);

  // Zone 2: RV Hookup Paddock (Top Right)
  ctx.fillStyle = "rgba(180, 83, 9, 0.16)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.65)";
  ctx.beginPath();
  ctx.roundRect(640, 110, 420, 180, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ZONE 2 • NON-TRACKSIDE RV HOOKUPS ($165)", 850, 140);

  // Central Walkway & Amenities Hub
  ctx.fillStyle = "rgba(39, 39, 42, 0.6)";
  ctx.fillRect(520, 20, 160, 360);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "bold 10px Inter, sans-serif";
  ctx.fillText("CENTRAL WALKWAY & HUB", 600, 310);

  // Zone 1: General Admission Camping Field (Bottom Wide)
  ctx.fillStyle = "rgba(6, 78, 59, 0.18)";
  ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
  ctx.beginPath();
  ctx.roundRect(160, 390, 880, 270, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ZONE 1 • GENERAL ADMISSION CAMPING FIELD ($85)", 600, 418);

  // Entry Gates
  ctx.font = "bold 10px Inter, sans-serif";
  ctx.fillStyle = "rgba(244, 244, 245, 0.7)";
  ctx.fillText("GATE A: MAIN WEST TURNSTILES", 240, 80);
  ctx.fillText("GATE B: RV NORTH EXPRESS LANE", 960, 80);
  ctx.fillText("GATE C: SOUTH PADDOCK ENTRY", 600, 690);

  ctx.restore();
}

function drawConcertStage(ctx: CanvasRenderingContext2D, virtualWidth: number) {
  const stageWidth = 460;
  const stageHeight = 44;
  const stageX = (virtualWidth - stageWidth) / 2;
  const stageY = 40;

  // Stage Gradient Fill
  const gradient = ctx.createLinearGradient(stageX, stageY, stageX + stageWidth, stageY);
  gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
  gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.4)");
  gradient.addColorStop(1, "rgba(59, 130, 246, 0.15)");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
  ctx.lineWidth = 1.5;

  // Draw rounded stage curve
  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageWidth, stageHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Stage glow beam
  const beamGradient = ctx.createLinearGradient(virtualWidth / 2, stageY + stageHeight, virtualWidth / 2, stageY + 160);
  beamGradient.addColorStop(0, "rgba(99, 102, 241, 0.18)");
  beamGradient.addColorStop(1, "transparent");
  ctx.fillStyle = beamGradient;
  ctx.beginPath();
  ctx.moveTo(stageX + 40, stageY + stageHeight);
  ctx.lineTo(stageX + stageWidth - 40, stageY + stageHeight);
  ctx.lineTo(stageX + stageWidth + 60, stageY + 160);
  ctx.lineTo(stageX - 60, stageY + 160);
  ctx.closePath();
  ctx.fill();

  // Text label: STAGE
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "4px";
  ctx.fillText("STAGE / PERFORMANCE AREA", virtualWidth / 2, stageY + stageHeight / 2);

  // Section Boundaries & Headers
  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "rgba(161, 161, 170, 0.7)";

  // VIP Zone Header
  ctx.fillText("VIP PLATINUM ORCHESTRA ($280)", virtualWidth / 2, 130);

  // Lower Bowl Headers
  ctx.fillText("WEST WING (LOWER)", virtualWidth / 2 - 340, 270);
  ctx.fillText("LOWER BOWL CENTER ($165)", virtualWidth / 2, 330);
  ctx.fillText("EAST WING (LOWER)", virtualWidth / 2 + 340, 270);

  // Upper Balcony Header
  ctx.fillText("UPPER GRAND BALCONY ($75)", virtualWidth / 2, 530);
}

function drawSingleSeat(
  ctx: CanvasRenderingContext2D,
  seat: SeatData,
  isSelected: boolean,
  isHovered: boolean,
  baseRadius: number,
  isDimmed: boolean = false,
  isAiHighlighted: boolean = false
) {
  const radius = isHovered ? baseRadius + 2.5 : baseRadius;

  ctx.save();
  if (isDimmed) {
    ctx.globalAlpha = 0.20;
  }

  // Aura Glow Pulsing Beacon for AI-Recommended Seats
  if (isAiHighlighted && !isSelected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(seat.x, seat.y, radius + 5.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.95)"; // Vibrant violet aura
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(seat.x, seat.y, radius + 9.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(192, 132, 252, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(seat.x, seat.y, radius, 0, Math.PI * 2);

  if (isSelected) {
    // Vibrant Blue Selection with Outer Neon Halo
    ctx.fillStyle = "#3b82f6";
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Pulse Halo
    ctx.beginPath();
    ctx.arc(seat.x, seat.y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  switch (seat.status) {
    case "AVAILABLE": {
      // Emerald Green
      ctx.fillStyle = isHovered ? "#34d399" : "#10b981";
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Soft glow halo
        ctx.beginPath();
        ctx.arc(seat.x, seat.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    }

    case "LOCKED": {
      // Amber Warning (In someone's cart or locked in Redis)
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tiny inner dot
      ctx.beginPath();
      ctx.arc(seat.x, seat.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#78350f";
      ctx.fill();
      break;
    }

    case "BOOKED": {
      // Zinc Dark (Sold out)
      ctx.fillStyle = "#27272a";
      ctx.fill();

      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// Generate full multi-tier stadium seats with realistic curves
export function generateDefaultStadiumSeats(): SeatData[] {
  const seats: SeatData[] = [];
  let seatCounter = 1;

  // 1. VIP Orchestra / Floor (Front & Center)
  const vipRows = ["A", "B", "C", "D", "E"];
  const vipSeatsPerRow = 24;
  const vipStartY = 160;
  const centerX = 600;

  vipRows.forEach((row, rowIndex) => {
    const y = vipStartY + rowIndex * 26;
    const rowWidth = (vipSeatsPerRow - 1) * 22;
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < vipSeatsPerRow; i++) {
      const x = startX + i * 22;
      const id = `vip-${row}-${i + 1}`;

      // Simulate real-world distribution
      let status: SeatStatus = "AVAILABLE";
      if ((rowIndex === 0 && i > 6 && i < 16) || (rowIndex === 1 && i % 3 === 0)) {
        status = "BOOKED";
      } else if (rowIndex === 2 && (i === 10 || i === 11)) {
        status = "LOCKED";
      }

      seats.push({
        id,
        sectionId: "sec-vip",
        sectionName: "VIP Orchestra",
        row,
        seatNumber: String(i + 1),
        price: 280,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 2. Lower Bowl Tier 1 (Center Curved)
  const tier1Rows = ["F", "G", "H", "J", "K", "L"];
  const tier1StartY = 360;

  tier1Rows.forEach((row, rowIndex) => {
    const seatsCount = 32 + rowIndex * 2;
    const radius = 240 + rowIndex * 24;
    const centerArcX = 600;
    const centerArcY = 140;

    const startAngle = Math.PI * 0.32;
    const endAngle = Math.PI * 0.68;
    const angleStep = (endAngle - startAngle) / (seatsCount - 1);

    for (let i = 0; i < seatsCount; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerArcX + Math.cos(angle) * radius;
      const y = centerArcY + Math.sin(angle) * radius + 100;
      const id = `tier1-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      const hash = (seatCounter * 17) % 100;
      if (hash < 28) status = "BOOKED";
      else if (hash < 38) status = "LOCKED";

      seats.push({
        id,
        sectionId: "sec-lower-center",
        sectionName: "Lower Bowl Center",
        row,
        seatNumber: String(i + 1),
        price: 165,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 3. West Wing (Left Angle)
  const wingRows = ["W1", "W2", "W3", "W4", "W5"];
  wingRows.forEach((row, rowIndex) => {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const x = 200 + i * 18 - rowIndex * 12;
      const y = 290 + rowIndex * 24 + i * 5;
      const id = `west-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((i + rowIndex) % 4 === 0) status = "BOOKED";
      else if (i === 5 && rowIndex === 2) status = "LOCKED";

      seats.push({
        id,
        sectionId: "sec-west",
        sectionName: "West Lower Wing",
        row,
        seatNumber: String(i + 1),
        price: 120,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 4. East Wing (Right Angle)
  wingRows.forEach((row, rowIndex) => {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const x = 760 + i * 18 + rowIndex * 12;
      const y = 355 - i * 5 + rowIndex * 24;
      const id = `east-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((i * 3 + rowIndex) % 5 === 0) status = "BOOKED";

      seats.push({
        id,
        sectionId: "sec-east",
        sectionName: "East Lower Wing",
        row,
        seatNumber: String(i + 1),
        price: 120,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 5. Upper Grand Balcony (Top Tier, Back Rows)
  const balconyRows = ["AA", "BB", "CC", "DD"];
  balconyRows.forEach((row, rowIndex) => {
    const seatsCount = 38;
    const y = 560 + rowIndex * 25;
    const startX = centerX - ((seatsCount - 1) * 20) / 2;

    for (let i = 0; i < seatsCount; i++) {
      const x = startX + i * 20;
      const id = `balcony-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      const hash = (i * 23 + rowIndex * 7) % 100;
      if (hash < 40) status = "BOOKED";
      else if (hash < 48) status = "LOCKED";

      seats.push({
        id,
        sectionId: "sec-balcony",
        sectionName: "Upper Grand Balcony",
        row,
        seatNumber: String(i + 1),
        price: 75,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  return seats;
}

// Generate Motorsport Racetrack Circuit Seats (Grandstand VIP, Trackside Pit, Bleachers, RV)
export function generateMotorsportCircuitSeats(): SeatData[] {
  const seats: SeatData[] = [];
  let seatCounter = 1;
  const centerX = 600;

  // 1. Grandstand VIP ($280) - Along Main Straightaway facing Finish Line
  const vipRows = ["A", "B", "C", "D"];
  const vipSeatsPerRow = 24;
  const startY = 520;

  vipRows.forEach((row, rowIndex) => {
    const y = startY + rowIndex * 25;
    const rowWidth = (vipSeatsPerRow - 1) * 22;
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < vipSeatsPerRow; i++) {
      const x = startX + i * 22;
      const id = `ms-vip-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((rowIndex === 0 && i > 6 && i < 16) || (rowIndex === 1 && i % 4 === 0)) {
        status = "BOOKED";
      } else if (rowIndex === 2 && (i === 10 || i === 11)) {
        status = "LOCKED";
      }

      seats.push({
        id,
        sectionId: "sec-grandstand-vip",
        sectionName: "Grandstand VIP",
        row,
        seatNumber: String(i + 1),
        price: 280,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 2. Trackside Pit ($165) - Above Pit Lane Road Overlooking Garages
  const pitRows = ["P1", "P2", "P3"];
  const pitSeatsPerRow = 20;
  const pitStartY = 255;

  pitRows.forEach((row, rowIndex) => {
    const y = pitStartY + rowIndex * 23;
    const rowWidth = (pitSeatsPerRow - 1) * 22;
    const startX = centerX - rowWidth / 2;

    for (let i = 0; i < pitSeatsPerRow; i++) {
      const x = startX + i * 22;
      const id = `ms-pit-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((i + rowIndex) % 5 === 0) status = "BOOKED";
      else if (i === 7 && rowIndex === 1) status = "LOCKED";

      seats.push({
        id,
        sectionId: "sec-trackside-pit",
        sectionName: "Trackside Pit",
        row,
        seatNumber: String(i + 1),
        price: 165,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 3. General Bleachers ($85) - Turn 1 Apex & Hairpin Curves
  // Turn 1 Bleachers (Outer Left Curve)
  const t1Rows = ["T1-A", "T1-B", "T1-C"];
  t1Rows.forEach((row, rowIndex) => {
    const count = 10;
    const radius = 175 + rowIndex * 22;
    const centerArcX = 220;
    const centerArcY = 290;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 1.25;
    const angleStep = (endAngle - startAngle) / (count - 1);

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerArcX + Math.cos(angle) * radius;
      const y = centerArcY + Math.sin(angle) * radius;
      const id = `ms-t1-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((i * 2 + rowIndex) % 3 === 0) status = "BOOKED";

      seats.push({
        id,
        sectionId: "sec-bleachers",
        sectionName: "General Bleachers",
        row,
        seatNumber: String(i + 1),
        price: 85,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // Hairpin Bleachers (Outer Right Curve)
  const hRows = ["H-A", "H-B", "H-C"];
  hRows.forEach((row, rowIndex) => {
    const count = 10;
    const radius = 175 + rowIndex * 22;
    const centerArcX = 980;
    const centerArcY = 290;
    const startAngle = -Math.PI * 0.25;
    const endAngle = Math.PI * 0.25;
    const angleStep = (endAngle - startAngle) / (count - 1);

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerArcX + Math.cos(angle) * radius;
      const y = centerArcY + Math.sin(angle) * radius;
      const id = `ms-h-${row}-${i + 1}`;

      let status: SeatStatus = "AVAILABLE";
      if ((i * 3 + rowIndex) % 4 === 0) status = "BOOKED";

      seats.push({
        id,
        sectionId: "sec-bleachers",
        sectionName: "General Bleachers",
        row,
        seatNumber: String(i + 1),
        price: 85,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 4. Trackside RV Camping Spots along top perimeter
  const rvSpots = 14;
  const rvRowWidth = (rvSpots - 1) * 36;
  const rvStartX = centerX - rvRowWidth / 2;
  for (let i = 0; i < rvSpots; i++) {
    const x = rvStartX + i * 36;
    const y = 75;
    const id = `ms-rv-RV1-${i + 1}`;

    let status: SeatStatus = "AVAILABLE";
    if (i % 3 === 0) status = "BOOKED";

    seats.push({
      id,
      sectionId: "sec-rv-zone",
      sectionName: "Trackside RV",
      row: "RV1",
      seatNumber: String(i + 1),
      price: 120,
      status,
      x,
      y,
    });
    seatCounter++;
  }

  return seats;
}

// Generate Festival Camping & Open Grounds Spot Grids
export function generateFestivalCampingSeats(): SeatData[] {
  const seats: SeatData[] = [];
  let seatCounter = 1;

  // 1. Zone 3: Pit Pass Camp ($280) - Top Left
  const pitRows = ["VIP-1", "VIP-2", "VIP-3", "VIP-4"];
  pitRows.forEach((row, rIdx) => {
    const count = 12;
    const y = 165 + rIdx * 28;
    for (let i = 0; i < count; i++) {
      const x = 180 + i * 28;
      const id = `fest-pit-${row}-${i + 1}`;
      let status: SeatStatus = "AVAILABLE";
      if ((i + rIdx) % 4 === 0) status = "BOOKED";

      seats.push({
        id,
        sectionId: "sec-pit-camp",
        sectionName: "Pit Pass Camp",
        row,
        seatNumber: String(i + 1),
        price: 280,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 2. Zone 2: Non-Trackside RV ($165) - Top Right
  const rvRows = ["RV-1", "RV-2", "RV-3", "RV-4"];
  rvRows.forEach((row, rIdx) => {
    const count = 10;
    const y = 165 + rIdx * 28;
    for (let i = 0; i < count; i++) {
      const x = 680 + i * 32;
      const id = `fest-rv-${row}-${i + 1}`;
      let status: SeatStatus = "AVAILABLE";
      if ((i * 2 + rIdx) % 5 === 0) status = "BOOKED";

      seats.push({
        id,
        sectionId: "sec-rv-zone",
        sectionName: "RV Trackside",
        row,
        seatNumber: String(i + 1),
        price: 165,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  // 3. Zone 1: General Camping ($85) - Bottom Wide Field
  const campRows = ["C-1", "C-2", "C-3", "C-4", "C-5", "C-6"];
  campRows.forEach((row, rIdx) => {
    const count = 22;
    const y = 450 + rIdx * 30;
    for (let i = 0; i < count; i++) {
      const x = 230 + i * 33;
      const id = `fest-gen-${row}-${i + 1}`;
      let status: SeatStatus = "AVAILABLE";
      const hash = (seatCounter * 29) % 100;
      if (hash < 32) status = "BOOKED";
      else if (hash < 40) status = "LOCKED";

      seats.push({
        id,
        sectionId: "sec-general-camp",
        sectionName: "General Camping",
        row,
        seatNumber: String(i + 1),
        price: 85,
        status,
        x,
        y,
      });
      seatCounter++;
    }
  });

  return seats;
}

// Generate category-specific seats dynamically
export function generateSeatsByCategory(
  category?: string,
  title?: string,
  eventId?: string
): SeatData[] {
  const layout = detectLayoutType(category, title, eventId);
  if (layout === "motorsport") return generateMotorsportCircuitSeats();
  if (layout === "festival") return generateFestivalCampingSeats();
  return generateDefaultStadiumSeats();
}
