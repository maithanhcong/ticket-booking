"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Zap,
  Ticket,
  Headphones,
  CheckCircle2,
  Heart,
  Globe,
  ArrowRight,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 text-xs transition-colors duration-300">
      {/* Top Value Proposition & Guarantee Ribbon */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/70 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                  100% Buyer Guarantee
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Every gate code is cryptographically verified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                  Zero-Leakage Vault
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Anti-scalping tokenized customer tickets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                  Instant Turnstile Passes
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Apple Wallet, Google Pay & Offline QR
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                  Fan Concierge Support
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  24/7 dedicated arena event assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission Column (Spans 2 on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="h-full w-full bg-black rounded-[10px] flex items-center justify-center">
                  <span className="font-black text-red-500 text-[10px] tracking-tighter">RIMS</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-zinc-950 dark:text-white text-base leading-none group-hover:text-red-600 transition-colors">
                  AURA<span className="text-red-600">TICKETS</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">
                  Motorsport & Arena
                </span>
              </div>
            </Link>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              The next-generation global gateway for verified stadium concerts, motorsport spectacles, and arena sports. Experience seamless mobile admission and fan-to-fan pass protection worldwide.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                <CheckCircle2 className="h-3 w-3" />
                Verified Ticketing Platform
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                SSL 256-Bit Encrypted
              </span>
            </div>
          </div>

          {/* Explore & Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
              Explore & Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/search?category=Concerts"
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Concerts & World Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/search?category=Motorsport"
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Formula 1 & Motorsports
                </Link>
              </li>
              <li>
                <Link
                  href="/search?category=Sports"
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Premier League & NBA
                </Link>
              </li>
              <li>
                <Link
                  href="/search?category=K-Pop"
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  K-Pop World Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Festival Camping Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Fan Guarantee & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
              Fan Guarantee & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/my-tickets" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  100% Buyer Guarantee
                </Link>
              </li>
              <li>
                <Link href="/my-tickets" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Fan-to-Fan Ticket Transfer
                </Link>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Fraud Protection System
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Help Center & FAQ
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Contact Concierge
                </span>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  About Us
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Press & Media
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Careers
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  Cookie Preferences
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods & Trust Strip */}
        <div className="mt-12 pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-2 font-medium">
              Secure Checkout Methods:
            </span>
            <span className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] tracking-tight">
              APPLE PAY
            </span>
            <span className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] tracking-tight">
              GOOGLE PAY
            </span>
            <span className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] tracking-tight">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] tracking-tight">
              MASTERCARD
            </span>
            <span className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] tracking-tight">
              AMEX
            </span>
            <span className="px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] tracking-tight">
              VERIFIED GATE PASS
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-500">
            © 2026 AuraTickets Global Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
