"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Hourglass,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { User } from "@/lib/auth-context";
import { SeatData } from "@/components/seating/seat-map";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  eventId: string;
  eventTitle?: string;
  selectedSeats: SeatData[];
  grandTotal: number;
  bookingReference?: string;
  // State flags from checkoutMachine
  isWaitingRoom?: boolean;
  isHolding?: boolean;
  isPaymentPending?: boolean;
  isConfirmed?: boolean;
  queuePosition?: number;
  errorMessage?: string | null;
  // Callbacks
  onProceedToPayment?: () => void;
  onReleaseHold?: () => void;
  onRestart?: () => void;
  redirectUrl?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  user,
  eventId,
  eventTitle = "Featured Event",
  selectedSeats = [],
  grandTotal = 0,
  bookingReference = "REF-PENDING",
  isWaitingRoom = false,
  isHolding = false,
  isPaymentPending = false,
  isConfirmed = false,
  queuePosition = 1,
  errorMessage = null,
  onProceedToPayment,
  onReleaseHold,
  onRestart,
  redirectUrl,
}: CheckoutModalProps) {
  if (!isOpen) return null;

  const targetRedirect = redirectUrl || `/events/${eventId}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              if (isConfirmed && onRestart) {
                onRestart();
              } else {
                onClose();
              }
            }}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-20 cursor-pointer"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* GUEST FIRST GUARD: When user is not authenticated */}
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

              {/* Order preview snippet */}
              {selectedSeats.length > 0 && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Số ghế đang giữ:</span>
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
                  onClick={onClose}
                  className="w-full sm:w-1/2 text-xs border-zinc-300 dark:border-zinc-700 rounded-xl"
                >
                  Quay lại xem thêm
                </Button>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`}
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
            /* USER IS AUTHENTICATED: RENDER NORMAL CHECKOUT STAGES */
            <div className="space-y-5">
              {/* STATE 1: WAITING_ROOM */}
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
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">#{queuePosition || 1}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Estimated Wait:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">A few seconds</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: HOLDING */}
              {isHolding && (
                <div className="space-y-5">
                  <div>
                    <Badge variant="default" className="text-[10px] uppercase mb-1 bg-emerald-600 text-white">
                      Seats Reserved
                    </Badge>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{eventTitle}</h3>
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
                    {onReleaseHold && (
                      <Button
                        variant="outline"
                        onClick={onReleaseHold}
                        className="w-1/3 text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                      >
                        Release Seats
                      </Button>
                    )}
                    {onProceedToPayment && (
                      <Button
                        onClick={onProceedToPayment}
                        className="flex-1 flex items-center justify-center gap-2 font-bold bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl shadow-md"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Proceed to Payment</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* STATE 3: PAYMENT_PENDING */}
              {isPaymentPending && (
                <div className="space-y-4">
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
                      <span>User Account:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">{user?.email}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Tickets Count:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{selectedSeats.length} Reserved Seats</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
                      <span>Total Charged:</span>
                      <span className="text-zinc-900 dark:text-white font-black font-mono text-base">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
