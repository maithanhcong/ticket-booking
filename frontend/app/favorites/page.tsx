"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { EventCard } from "@/components/event-card";
import { useFavorites } from "@/lib/favorites-context";
import { CATALOG_EVENTS } from "@/lib/events-catalog";
import { Heart, Compass, ArrowRight, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { favorites, favoriteCount, clearFavorites } = useFavorites();

  // Map favorite IDs to event objects from catalog
  const favoriteEvents = useMemo(() => {
    return CATALOG_EVENTS.filter((ev) => favorites.includes(ev.id));
  }, [favorites]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-red-500/20 selection:text-red-950 flex flex-col">
      {/* Sticky Header Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Hero Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/40 mb-3">
              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              <span>Personal Wishlist Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-3">
              <span>Saved Shows & Events</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                {favoriteCount}
              </span>
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Curate your dream stadium experiences, motorsport grand prix passes, and VIP concert tours. Instant access to tickets and calendar sync.
            </p>
          </div>

          {favoriteEvents.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={clearFavorites}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>

              <Link href="/search">
                <Button size="sm" variant="outline" className="gap-2 text-xs font-semibold rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Compass className="h-3.5 w-3.5 text-red-600" />
                  <span>Discover More</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Content Section: Grid or Empty State */}
        {favoriteEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteEvents.map((event, index) => (
              <div key={event.id} className="flex justify-center">
                <EventCard
                  event={{
                    id: event.id,
                    title: event.title,
                    slug: event.slug,
                    description: event.description,
                    bannerUrl: event.bannerUrl,
                    startTime: event.startTime,
                    venue: {
                      name: event.venue.name,
                      city: event.venue.city,
                      country: event.venue.country,
                    },
                    minPrice: event.minPrice,
                    availableSeats: event.availableSeats,
                    totalSeats: event.totalSeats,
                    category: event.category,
                    isPopular: event.isPopular,
                  }}
                  rank={index + 1}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty Vault Graphic State */
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-lg shadow-zinc-200/50 dark:shadow-none">
                <Heart className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
              </div>
              <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Your Wishlist is Empty
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Explore upcoming motorsport festivals, K-Pop world tours, and stadium derby matches to save your favorite passes here.
            </p>

            <Link href="/search" className="mt-6">
              <Button
                size="lg"
                className="gap-2 rounded-2xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-md shadow-zinc-900/10 px-6 py-3"
              >
                <Compass className="h-4 w-4 text-red-500" />
                <span>Browse All Events</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
