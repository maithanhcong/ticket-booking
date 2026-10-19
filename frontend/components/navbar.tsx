"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useFavorites } from "@/lib/favorites-context";
import {
  Ticket,
  Compass,
  LogOut,
  Plus,
  Check,
  Sun,
  Moon,
  Heart,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function CategoryLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = pathname === "/search" ? searchParams?.get("category") : null;

  const categories = [
    {
      name: "Concerts",
      href: "/search?category=Concerts",
      isActive: pathname === "/search" && currentCategory === "Concerts",
    },
    {
      name: "Motorsport",
      href: "/search?category=Motorsport",
      isActive: pathname === "/search" && currentCategory === "Motorsport",
    },
    {
      name: "Sports Arenas",
      href: "/search?category=Sports",
      isActive: pathname === "/search" && currentCategory === "Sports",
    },
    {
      name: "K-Pop Idols",
      href: "/search?category=K-Pop",
      isActive: pathname === "/search" && currentCategory === "K-Pop",
    },
  ];

  return (
    <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => {
        const activeClass = cat.isActive
          ? "bg-zinc-900 text-white dark:bg-white/10 dark:text-white border-zinc-800 dark:border-white/20 shadow-xs"
          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-transparent";

        return (
          <Link
            key={cat.name}
            href={cat.href}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all ${activeClass}`}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}

function CategoryLinksFallback() {
  const categories = [
    { name: "Concerts", href: "/search?category=Concerts" },
    { name: "Motorsport", href: "/search?category=Motorsport" },
    { name: "Sports Arenas", href: "/search?category=Sports" },
    { name: "K-Pop Idols", href: "/search?category=K-Pop" },
  ];

  return (
    <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => (
        <Link
          key={cat.name}
          href={cat.href}
          className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, topUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { favoriteCount } = useFavorites();
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [justToppedUp, setJustToppedUp] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
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
          ? "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200/90 dark:border-zinc-800/90 shadow-xs"
          : "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50"
      }`}
    >
      {/* 3-Column Fixed Height Container */}
      <div className="w-full h-16 px-4 md:px-8 flex items-center justify-between gap-2 md:gap-4">
        {/* Left Cluster: Brand Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 sm:gap-2.5 group">
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

        {/* Middle Cluster: Category Navigation Links */}
        <div className="flex-1 min-w-0 mx-2 sm:mx-4 md:mx-6 flex items-center justify-center">
          <Suspense fallback={<CategoryLinksFallback />}>
            <CategoryLinks />
          </Suspense>
        </div>

        {/* Right Cluster: Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Theme Toggle Button */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:scale-105 transition-all text-zinc-700 dark:text-zinc-200 shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-zinc-700 hover:text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>
            <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-semibold px-2 py-1 rounded shadow-lg border border-zinc-700/50 dark:border-zinc-300/50">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </div>
          </div>

          {/* AI Search */}
          <Link href="/search" className="shrink-0">
            <button
              type="button"
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-xs rounded-full p-2 sm:px-3 sm:py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Compass className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline">AI Search</span>
            </button>
          </Link>

          {/* User State */}
          {user ? (
            <>
              {/* Wallet Balance Pill */}
              <div
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 shadow-xs text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 shrink-0"
                title={`Aura Wallet: $${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>${Math.round(balance).toLocaleString("en-US")}</span>
              </div>

              {/* Avatar Dropdown Anchor */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-label="Open user menu"
                  className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-red-500/30 transition-all shrink-0 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-zinc-950 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-black text-white shadow-xs">
                    {user.firstName?.[0] || "U"}{user.lastName?.[0] || ""}
                  </div>
                </button>

                {/* Popover / Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>

                    {/* Quick Top-Up Button */}
                    <div className="px-1 py-1 mb-1">
                      <button
                        type="button"
                        onClick={handleQuickTopUp}
                        disabled={isToppingUp}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Top Up Wallet</span>
                        </span>
                        <span className="font-mono text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-md font-bold">
                          {justToppedUp ? "Added $500!" : "+$500"}
                        </span>
                      </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-0.5">
                      <Link
                        href="/my-tickets"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors"
                      >
                        <Ticket className="h-4 w-4 text-red-500" />
                        <span>My Tickets</span>
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Heart className={`h-4 w-4 ${favoriteCount > 0 ? "text-red-500 fill-red-500" : "text-zinc-400"}`} />
                          <span>Saved Shows</span>
                        </span>
                        {favoriteCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-600 text-white leading-tight">
                            {favoriteCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/80" />

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="shrink-0">
              <Button
                variant="default"
                size="sm"
                className="text-xs font-bold px-3.5 sm:px-4 rounded-full bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 shadow-xs"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
