"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  QrCode,
  Download,
  Calendar,
  MapPin,
  ChevronLeft,
  ShieldCheck,
  Wifi,
  WifiOff,
  CheckCircle2,
  Lock,
  Plus,
  LogOut,
  User as UserIcon,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  getUserOfflineTickets,
  saveOfflineTicket,
  updateOfflineTicketStatus,
  deleteOfflineTicket,
  generateTicketQRDataUrl,
  generateTicketVerificationHash,
  isOffline,
  addNetworkStatusListener,
  OfflineTicket,
} from "@/lib/offline-tickets";
import { WalletBadge } from "@/components/wallet-badge";
import { AppleWalletButton, GoogleWalletButton } from "@/lib/wallet-pass-generator";

export default function MyTicketsPage() {
  const { user, token, logout, updateLocalBalance, refreshProfile } = useAuth();
  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<OfflineTicket | null>(null);
  const [refundingTicket, setRefundingTicket] = useState<OfflineTicket | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);
  const [refundSuccessToast, setRefundSuccessToast] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming">("all");

  // Fan-to-Fan Ticket Transfer State
  const [transferringTicket, setTransferringTicket] = useState<OfflineTicket | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [securityPin, setSecurityPin] = useState<string>("");
  const [isProcessingTransfer, setIsProcessingTransfer] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Load tickets strictly from the Backend API (authoritative source) with clean IndexedDB offline caching
  const loadTickets = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // 1. If online and JWT token available, sync directly with Backend endpoint GET /api/v1/bookings/my-tickets
      if (token && !isOffline()) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${apiUrl}/bookings/my-tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const serverBookings = await res.json();
          const freshTickets: OfflineTicket[] = [];

          for (const b of serverBookings) {
            if (b.status === "CONFIRMED" || b.status === "REFUNDED") {
              const seatItems =
                b.items?.map((i: any) => ({
                  id: i.seatId || i.seat?.id,
                  row: i.seat?.row || "A",
                  seatNumber: i.seat?.seatNumber || "1",
                  sectionName: i.seat?.section?.name || "Standard",
                  price: Number(i.price),
                })) || [];

              const hash = generateTicketVerificationHash(
                b.bookingReference,
                b.eventId,
                seatItems.map((s: any) => s.id)
              );
              const qrUrl = generateTicketQRDataUrl(
                `TICKETVAULT:${b.bookingReference}:${hash}:${b.eventId}`,
                320
              );

              const offlineTicket: OfflineTicket = {
                id: b.bookingReference,
                userId: user.id, // Strictly scoped to currentUser.id
                bookingId: b.id,
                bookingReference: b.bookingReference,
                eventId: b.eventId,
                eventTitle: b.event?.title || "Live Stadium Tour",
                eventDate: b.event?.startTime || new Date().toISOString(),
                eventVenue: b.event?.venue?.name || "Arena Venue",
                customerName: `${user.firstName} ${user.lastName}`,
                customerEmail: user.email,
                seats: seatItems,
                totalAmount: Number(b.totalAmount),
                qrCodeDataUrl: qrUrl,
                verificationHash: hash,
                cachedAt: new Date(b.createdAt).getTime(),
                status: b.status as "CONFIRMED" | "REFUNDED",
                synced: true,
              };

              freshTickets.push(offlineTicket);
              await saveOfflineTicket(offlineTicket);
            }
          }

          // Purge stale or legacy mock tickets from local IndexedDB for this user
          try {
            const existingLocal = await getUserOfflineTickets(user.id);
            const serverRefs = new Set(freshTickets.map((t) => t.bookingReference || t.id));
            for (const old of existingLocal) {
              if (
                (!serverRefs.has(old.bookingReference) && !serverRefs.has(old.id)) ||
                old.bookingId?.startsWith("bkg-") ||
                old.id === "BK-893120" ||
                old.id === "BK-429015"
              ) {
                await deleteOfflineTicket(old.id);
              }
            }
          } catch (cleanErr) {
            console.warn("[MyTickets] Cleanup of obsolete cache:", cleanErr);
          }

          setTickets(freshTickets);
          setIsLoading(false);
          return;
        }
      }

      // 2. Offline fallback: strictly retrieve verified cached passes from IndexedDB (excluding any legacy mock tickets)
      const localTickets = await getUserOfflineTickets(user.id);
      const validLocalTickets = localTickets.filter(
        (t) =>
          t.userId === user.id &&
          !t.bookingId?.startsWith("bkg-") &&
          t.id !== "BK-893120" &&
          t.id !== "BK-429015"
      );
      setTickets(validLocalTickets);
    } catch (err) {
      console.warn("[MyTickets] Error syncing user tickets:", err);
      try {
        const localTickets = await getUserOfflineTickets(user.id);
        setTickets(
          localTickets.filter(
            (t) =>
              t.userId === user.id &&
              !t.bookingId?.startsWith("bkg-") &&
              t.id !== "BK-893120" &&
              t.id !== "BK-429015"
          )
        );
      } catch {
        setTickets([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Initial load
  useEffect(() => {
    loadTickets();

    // Listen for network status changes
    const cleanup = addNetworkStatusListener(
      () => {
        setIsOfflineMode(false);
        loadTickets();
      },
      () => setIsOfflineMode(true)
    );

    return () => cleanup();
  }, [loadTickets]);

  // Reset tickets on sign out / session switch
  useEffect(() => {
    if (!user) {
      setTickets([]);
      setSelectedTicket(null);
    }
  }, [user]);

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === "upcoming") {
      return new Date(t.eventDate).getTime() >= Date.now();
    }
    return true;
  });

  const handleDownloadQR = (ticket: OfflineTicket) => {
    const a = document.createElement("a");
    a.href = ticket.qrCodeDataUrl;
    a.download = `ticket-${ticket.bookingReference}.svg`;
    a.click();
  };

  // Full Refund Workflow Execution
  const handleConfirmRefund = async (ticket: OfflineTicket) => {
    setIsProcessingRefund(true);
    try {
      if (token && !isOffline()) {
        const targetBookingId = ticket.bookingId || ticket.id;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${apiUrl}/bookings/${targetBookingId}/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to cancel booking on server.");
        }
      }

      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "REFUNDED" } : t))
      );

      // Update IndexedDB
      await updateOfflineTicketStatus(ticket.id, "REFUNDED");

      // Credit wallet balance
      updateLocalBalance(ticket.totalAmount, true);

      // Trigger profile refresh if online
      if (refreshProfile) {
        refreshProfile();
      }

      // Success notification toast
      setRefundSuccessToast(
        `Refund successful: $${ticket.totalAmount.toFixed(2)} was credited back to your Aura Wallet!`
      );
      setTimeout(() => setRefundSuccessToast(null), 5000);

      setRefundingTicket(null);
    } catch (err: any) {
      alert(`Refund Error: ${err.message || "Could not process refund."}`);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Delete / Clear Record strictly for REFUNDED or CANCELLED tickets
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDeleteRecord = async (ticket: OfflineTicket) => {
    if (ticket.status !== "REFUNDED") {
      alert("Active CONFIRMED tickets cannot be deleted to protect your gate admission.");
      return;
    }

    if (!confirm(`Remove record for "${ticket.eventTitle}" (${ticket.bookingReference}) from your ticket history?`)) {
      return;
    }

    setIsDeletingId(ticket.id);
    try {
      // 1. Remove from local IndexedDB
      await deleteOfflineTicket(ticket.id);

      // 2. If online and token available, invoke server delete endpoint
      if (token && !isOffline()) {
        const targetBookingId = ticket.bookingId || ticket.id;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        fetch(`${apiUrl}/bookings/${targetBookingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((e) => console.warn("[Delete] Background booking record delete sync:", e));
      }

      // 3. Remove from React local state
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(null);
      }

      setRefundSuccessToast(`Ticket record ${ticket.bookingReference} removed from history.`);
      setTimeout(() => setRefundSuccessToast(null), 4000);
    } catch (err: any) {
      alert(`Delete Error: ${err.message || "Failed to delete ticket record."}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Fan-to-Fan Ticket Transfer Execution
  const handleConfirmTransfer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!transferringTicket) return;
    setIsProcessingTransfer(true);
    setTransferError(null);

    try {
      if (!recipientEmail || !recipientEmail.includes("@")) {
        throw new Error("Please enter a valid recipient email address.");
      }
      if (!securityPin || securityPin.length < 4) {
        throw new Error("Security PIN must be at least 4 characters.");
      }

      if (token && !isOffline()) {
        const targetBookingId = transferringTicket.bookingId || transferringTicket.id;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const res = await fetch(`${apiUrl}/bookings/${targetBookingId}/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientEmail: recipientEmail.trim(),
            securityPin: securityPin.trim(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to transfer ticket pass on server.");
        }
      }

      // Remove from local IndexedDB store
      await deleteOfflineTicket(transferringTicket.id);

      // Remove from active state
      setTickets((prev) => prev.filter((t) => t.id !== transferringTicket.id));
      if (selectedTicket?.id === transferringTicket.id) {
        setSelectedTicket(null);
      }

      const transferredRef = transferringTicket.bookingReference;
      const toEmail = recipientEmail.trim();

      setTransferringTicket(null);
      setRecipientEmail("");
      setSecurityPin("");
      setRefundSuccessToast(`Ticket pass ${transferredRef} successfully transferred to ${toEmail}. It is now removed from your vault.`);
      setTimeout(() => setRefundSuccessToast(null), 5000);
    } catch (err: any) {
      setTransferError(err.message || "Transfer failed. Please check inputs and try again.");
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-red-500 selection:text-white pb-20 flex flex-col">
      {/* Global Sticky Navbar */}
      <Navbar />

      {/* Refund Success Toast Notification Banner */}
      {refundSuccessToast && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-4 py-3 text-xs flex items-center justify-center gap-2 backdrop-blur-md sticky top-16 z-30">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{refundSuccessToast}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-4 sm:px-6 lg:px-8 py-10 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 uppercase">
                User-Scoped Vault
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Zero Cross-Account Leakage
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                  isOfflineMode
                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {isOfflineMode ? (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span>Offline Mode</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>User Vault Synced</span>
                  </>
                )}
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
              My Digital Ticket Passes
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg">
              {user
                ? `Logged in as ${user.email}. All confirmed tickets are cached locally in your personal IndexedDB store.`
                : "Sign in to access your offline QR gate codes and manage your stadium bookings."}
            </p>
          </div>

          <Link href="/search">
            <Button size="sm" className="gap-2 text-xs font-bold shrink-0 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-xl shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Book More Shows</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {!user ? (
          /* Unauthenticated Empty State */
          <div className="py-20 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 max-w-md mx-auto p-8 shadow-sm">
            <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mx-auto">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Sign In to View Tickets</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Ticket passes and offline QR turnstile codes are strictly scoped to individual customer accounts. Sign in to view and download your verified tickets.
            </p>
            <div className="pt-2">
              <Link href="/auth/login?returnUrl=/my-tickets" className="block w-full">
                <Button
                  className="text-xs font-bold w-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-xl"
                >
                  Sign In / Quick Demo Switch
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Authenticated User Passes */
          <>
            {/* Tab Filters */}
            <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  All Passes ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "upcoming"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  Upcoming Shows
                </button>
              </div>

              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                User: <strong className="text-zinc-900 dark:text-zinc-200 font-mono text-xs">{user.email}</strong>
              </span>
            </div>

            {/* Tickets Grid */}
            {isLoading ? (
              <div className="py-24 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 max-w-lg mx-auto p-8 shadow-sm">
                <div className="h-10 w-10 border-2 border-red-600 dark:border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Loading your tickets...</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Retrieving your verified passes from the server...
                </p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-20 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 max-w-lg mx-auto p-8 shadow-sm">
                <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto shadow-inner">
                  <Ticket className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No tickets found</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  You don&apos;t have any event tickets under <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.email}</span> yet. Discover live concerts, festivals, and arena tours to reserve your seats.
                </p>
                <div className="pt-2">
                  <Link href="/search">
                    <Button size="sm" className="text-xs font-bold bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-xl px-6 py-2.5 shadow-sm">
                      Explore Upcoming Events
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTickets.map((ticket) => {
                  const eventDate = new Date(ticket.eventDate);
                  const formattedDate = eventDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div className="space-y-4">
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 dark:text-red-400 block mb-1">
                              Official Digital Gate Pass
                            </span>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              {ticket.eventTitle}
                            </h3>
                          </div>

                          {ticket.status === "REFUNDED" ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0">
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>REFUNDED</span>
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        {/* Metadata Specs */}
                        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 py-3 border-y border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                            <span>{formattedDate} • 8:00 PM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                            <span className="truncate">{ticket.eventVenue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Ticket className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                            <span>
                              {ticket.seats.length} Seat{ticket.seats.length > 1 ? "s" : ""}:{" "}
                              <strong className="text-zinc-900 dark:text-white">
                                {ticket.seats
                                  .map((s) => `${s.row}-${s.seatNumber}`)
                                  .join(", ")}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Reference & Security Hash */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                          <div>
                            <span>Ref: </span>
                            <strong className="font-mono text-zinc-900 dark:text-zinc-200 text-xs">{ticket.bookingReference}</strong>
                          </div>
                          <div>
                            <span>Hash: </span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{ticket.verificationHash}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions & QR Code Preview */}
                      <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">
                            {ticket.status === "REFUNDED" ? "Refunded" : "Paid Total"}
                          </span>
                          <span
                            className={`text-base font-bold font-mono ${
                              ticket.status === "REFUNDED"
                                ? "text-rose-600 dark:text-rose-400 line-through opacity-75"
                                : "text-zinc-900 dark:text-white"
                            }`}
                          >
                            {formatPrice(ticket.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ticket.status === "REFUNDED" ? (
                            <>
                              <Badge
                                variant="outline"
                                className="text-[11px] text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 py-1 font-semibold"
                              >
                                Credited to Wallet
                              </Badge>

                              {/* Conditional Delete button: ONLY shown for REFUNDED tickets */}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isDeletingId === ticket.id}
                                onClick={() => handleDeleteRecord(ticket)}
                                className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors gap-1.5 interactive-button rounded-xl"
                                title="Remove refunded record from history"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                <span className="hidden sm:inline">Remove Record</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTransferringTicket(ticket)}
                                className="h-8 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors gap-1 interactive-button rounded-xl"
                                title="Transfer ticket pass to another fan"
                              >
                                <Send className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                                <span className="hidden sm:inline">Transfer</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRefundingTicket(ticket)}
                                className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors gap-1 interactive-button rounded-xl"
                                title="Cancel booking and get instant refund"
                              >
                                <RotateCcw className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                                <span className="hidden sm:inline">Cancel & Refund</span>
                                <span className="sm:hidden">Refund</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadQR(ticket)}
                                className="h-8 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl interactive-button"
                                title="Download SVG QR Pass"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => setSelectedTicket(ticket)}
                                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-xs interactive-button"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                <span>View Pass</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mobile Wallet Passes (Apple Wallet & Google Pay) */}
                      {ticket.status === "CONFIRMED" && (
                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2">
                          <AppleWalletButton ticket={ticket} className="flex-1 py-1.5 text-[11px] h-8 justify-center" />
                          <GoogleWalletButton ticket={ticket} className="flex-1 py-1.5 text-[11px] h-8 justify-center" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Fullscreen Offline Gate Pass Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl text-center space-y-5 text-zinc-900 dark:text-zinc-100"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Badge variant="success" className="text-[10px]">
                  User-Scoped Gate Pass
                </Badge>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 text-xs"
                >
                  Close
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  {selectedTicket.eventTitle}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{selectedTicket.eventVenue}</p>
              </div>

              {/* High-Contrast Scannable QR Code */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xs mx-auto border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedTicket.qrCodeDataUrl}
                  alt="Scannable QR Gate Code"
                  className="w-56 h-56 mx-auto"
                />
                <span className="text-[10px] text-zinc-700 font-mono font-bold block mt-1.5">
                  CRYPTOGRAPHIC VALIDATION HASH: {selectedTicket.verificationHash}
                </span>
              </div>

              {/* Ticket Specs summary */}
              <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <strong className="font-mono text-zinc-900 dark:text-white">{selectedTicket.bookingReference}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Seats:</span>
                  <strong className="text-zinc-900 dark:text-white">
                    {selectedTicket.seats.map((s) => `${s.row}-${s.seatNumber}`).join(", ")}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="text-zinc-900 dark:text-white font-medium">{selectedTicket.customerEmail}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <AppleWalletButton ticket={selectedTicket} className="flex-1 justify-center text-xs" />
                  <GoogleWalletButton ticket={selectedTicket} className="flex-1 justify-center text-xs" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadQR(selectedTicket)}
                  className="w-full text-xs font-semibold gap-2 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download SVG Gate Pass</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cancel & Refund Confirmation Modal */}
        {refundingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-zinc-100"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Cancel Booking & Process Full Refund</span>
                </div>
                <button
                  onClick={() => setRefundingTicket(null)}
                  disabled={isProcessingRefund}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-left">
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  {refundingTicket.eventTitle}
                </h4>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Booking Reference:</span>
                    <span className="font-mono text-zinc-900 dark:text-white font-bold">{refundingTicket.bookingReference}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Seats to Release:</span>
                    <span className="text-zinc-900 dark:text-white font-semibold">
                      {refundingTicket.seats.map((s) => `${s.row}-${s.seatNumber}`).join(", ")}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-sm font-bold">
                    <span className="text-zinc-700 dark:text-zinc-300">Total Refund:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                      {formatPrice(refundingTicket.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Instant Wallet Refund Policy</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    100% of your payment ({formatPrice(refundingTicket.totalAmount)}) will be refunded and credited immediately to your active Aura Customer Wallet. The reserved seats will be instantly returned to the pool for other fans.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  disabled={isProcessingRefund}
                  onClick={() => setRefundingTicket(null)}
                  className="w-1/2 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Keep Ticket
                </Button>
                <Button
                  disabled={isProcessingRefund}
                  onClick={() => handleConfirmRefund(refundingTicket)}
                  className="w-1/2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center gap-1.5"
                >
                  {isProcessingRefund ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Confirm Refund</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Fan-to-Fan Ticket Transfer Modal */}
        {transferringTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-zinc-100"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                  <Send className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span>Fan-to-Fan Ticket Transfer</span>
                </div>
                <button
                  onClick={() => {
                    setTransferringTicket(null);
                    setTransferError(null);
                  }}
                  disabled={isProcessingTransfer}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {transferringTicket.eventTitle}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Booking Ref: <span className="font-mono text-red-600 dark:text-red-400 font-bold">{transferringTicket.bookingReference}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Seats Being Transferred:</span>
                    <span className="text-zinc-900 dark:text-white font-semibold">
                      {transferringTicket.seats.map((s) => `${s.row}-${s.seatNumber}`).join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Venue:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{transferringTicket.eventVenue}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-800 dark:text-blue-400">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Official Gate Reassignment</span>
                  </div>
                  <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                    Once confirmed, this gate pass and cryptographic hash will be permanently reassigned to the recipient. It will be removed from your digital vault.
                  </p>
                </div>

                {transferError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{transferError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmTransfer} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                      Recipient Aura Account Email:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sara.connor@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                      Security Authorization PIN:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter at least 4 digits (e.g. 1234)"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all font-mono"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isProcessingTransfer}
                      onClick={() => {
                        setTransferringTicket(null);
                        setTransferError(null);
                      }}
                      className="w-1/2 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProcessingTransfer}
                      className="w-1/2 text-xs font-bold bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-white rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {isProcessingTransfer ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Transferring...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Confirm Transfer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

