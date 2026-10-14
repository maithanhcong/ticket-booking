"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useFavorites } from "@/lib/favorites-context";
import {
  Ticket,
  Search,
  Compass,
  Sparkles,
  LogOut,
  Plus,
  Check,
  Flame,
  ChevronRight,
  Sun,
  Moon,
  Heart,
  Menu,
  X,
  Music,
  Trophy,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, topUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { favoriteCount } = useFavorites();
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [justToppedUp, setJustToppedUp] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const balance = user?.balance !== undefined ? user.balance : 1500;

  const handleQuickTopUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToppingUp) return;

    setIsToppingUp(true);
    try {
      await topUp(500);
      setJustToppedUp(true);
      setTimeout(() => setJustToppedUp(false), 2000);
    } catch (err) {
      console.error("Top up failed:", err);
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleToggleTheme = () => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("disable-transitions");
    }
    toggleTheme();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.documentElement.classList.remove("disable-transitions");
        });
      });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200/90 dark:border-zinc-800/90 shadow-sm"
          : "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50"
      }`}
    >
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo - Motorsport Aesthetic */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
            <div className="h-full w-full bg-black rounded-[10px] flex items-center justify-center">
              <span className="font-black text-red-500 text-[10px] tracking-tighter">RIMS</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tight text-zinc-900 dark:text-white text-sm sm:text-base leading-none group-hover:text-red-600 transition-colors">
              AURA<span className="text-red-600">TICKETS</span>
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">
              Motorsport & Arena
            </span>
          </div>
        </Link>

        {/* Desktop Category Switcher Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2">
          <Link
            href="/search?category=Concerts"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Concerts
          </Link>
          <Link
            href="/search?category=Motorsport"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Motorsport
          </Link>
          <Link
            href="/search?category=Sports"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Sports Arenas
          </Link>
          <Link
            href="/search?category=K-Pop"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            K-Pop Idols
          </Link>
          <Link
            href="/my-tickets"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Ticket className="h-3.5 w-3.5 text-red-600" />
            <span>My Tickets</span>
          </Link>
          <Link
            href="/favorites"
            className="bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Heart className={`h-3.5 w-3.5 ${favoriteCount > 0 ? "text-red-500 fill-red-500" : "text-zinc-500 dark:text-zinc-400"}`} />
            <span>Saved Shows</span>
            {favoriteCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white leading-tight">
                {favoriteCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right Action Cluster: Theme + Search + Wallet/Auth + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Switcher Button with Micro-Tooltip */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:scale-105 transition-all text-zinc-700 dark:text-zinc-200 shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-zinc-700 hover:text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>
            <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-semibold px-2 py-1 rounded shadow-lg border border-zinc-700/50 dark:border-zinc-300/50">
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </div>
          </div>

          {/* AI Search Pill (Icon-only on small mobile to conserve width) */}
          <Link href="/search" className="shrink-0">
            <button
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-sm rounded-full p-2 sm:px-3 sm:py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Compass className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline">AI Search</span>
            </button>
          </Link>

          {/* User Wallet & Profile Capsule */}
          {user ? (
            <div className="flex items-center p-0.5 sm:p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-800 dark:text-zinc-200 shrink-0">
              {/* Balance Pill: Compact on mobile ($1,500), Full on desktop ($1,500.00) */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono sm:hidden">
                  ${Math.round(balance).toLocaleString("en-US")}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono hidden sm:inline">
                  ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Compact Quick Top Up +$500 (Hidden on mobile < sm, available in mobile drawer) */}
              <button
                onClick={handleQuickTopUp}
                disabled={isToppingUp}
                title="Add $500 test funds to wallet"
                className="hidden sm:flex ml-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/60 transition-all items-center gap-1 active:scale-95"
              >
                {justToppedUp ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300 text-[11px]">+$500</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span className="text-[11px]">+$500</span>
                  </>
                )}
              </button>

              {/* User Avatar & Name */}
              <Link
                href="/my-tickets"
                title="Go to My Tickets Vault"
                className="flex items-center gap-1.5 pl-1.5 sm:pl-2 pr-1.5 sm:pr-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0">
                  {user.firstName?.[0] || "U"}{user.lastName?.[0] || ""}
                </div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 hidden md:inline truncate max-w-[100px]">
                  {user.firstName}
                </span>
              </Link>

              {/* Logout Button (Hidden on mobile < sm, available in mobile drawer) */}
              <button
                onClick={logout}
                title="Sign out"
                className="hidden sm:flex h-7 w-7 rounded-full items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mr-0.5"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="shrink-0">
              <Button
                variant="default"
                size="sm"
                className="text-xs font-bold px-3 sm:px-4 rounded-full bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm"
              >
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Hamburger (☰) Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Horizontal Pill Bar on Mobile (Smooth Scrolling Categories) */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar scrollbar-none border-t border-zinc-100 dark:border-zinc-900 border-b border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md py-2 px-3 sm:px-4 flex items-center space-x-2">
        <Link
          href="/search?category=Concerts"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Music className="h-3.5 w-3.5 text-violet-500" />
          <span>Concerts</span>
        </Link>
        <Link
          href="/search?category=Motorsport"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Flame className="h-3.5 w-3.5 text-red-500" />
          <span>Motorsport</span>
        </Link>
        <Link
          href="/search?category=Sports"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Trophy className="h-3.5 w-3.5 text-emerald-500" />
          <span>Sports Arenas</span>
        </Link>
        <Link
          href="/search?category=K-Pop"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <span>K-Pop Idols</span>
        </Link>
        <Link
          href="/my-tickets"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Ticket className="h-3.5 w-3.5 text-red-600" />
          <span>My Tickets</span>
        </Link>
        <Link
          href="/favorites"
          className="shrink-0 bg-zinc-100/90 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200/60 dark:border-zinc-800/80 active:scale-95"
        >
          <Heart className={`h-3.5 w-3.5 ${favoriteCount > 0 ? "text-red-500 fill-red-500" : "text-zinc-500 dark:text-zinc-400"}`} />
          <span>Saved Shows</span>
          {favoriteCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white leading-tight">
              {favoriteCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Drawer / Slide-Down Panel for Complete Menu & Account Info */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* User Account / Wallet Card in Drawer */}
          {user ? (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-white shadow-sm">
                    {user.firstName?.[0] || "U"}{user.lastName?.[0] || ""}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {user.email || "Verified Member"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Wallet Balance
                  </span>
                  <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                    ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={handleQuickTopUp}
                  disabled={isToppingUp}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {justToppedUp ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Added $500!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Top Up $500</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 text-center">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2.5">
                Sign in to access VIP tickets and your digital wallet.
              </p>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full text-xs font-bold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                  Sign In / Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Navigation Directory Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/search?category=Concerts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <Music className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Concerts</span>
            </Link>

            <Link
              href="/search?category=Motorsport"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Flame className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Motorsport</span>
            </Link>

            <Link
              href="/search?category=Sports"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sports Arenas</span>
            </Link>

            <Link
              href="/search?category=K-Pop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">K-Pop Idols</span>
            </Link>

            <Link
              href="/my-tickets"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Ticket className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">My Tickets</span>
            </Link>

            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Heart className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Saved Shows</span>
              {favoriteCount > 0 && (
                <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
                  {favoriteCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
