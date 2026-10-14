"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface FavoritesContextType {
  favorites: string[];
  favoriteCount: number;
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (eventId: string) => void;
  clearFavorites: () => void;
  toastMessage: string | null;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  favoriteCount: 0,
  isFavorite: () => false,
  toggleFavorite: () => {},
  clearFavorites: () => {},
  toastMessage: null,
});

const STORAGE_KEY = "auratickets_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (err) {
      console.warn("[Favorites] Failed to read from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  const saveFavorites = useCallback((newFavs: string[]) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
    } catch (err) {
      console.warn("[Favorites] Failed to persist to localStorage:", err);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const toggleFavorite = useCallback(
    (eventId: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(eventId);
        let next: string[];
        if (exists) {
          next = prev.filter((id) => id !== eventId);
          showToast("Removed from Wishlist 💔");
        } else {
          next = [...prev, eventId];
          showToast("Saved to Wishlist ❤️");
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn("[Favorites] Failed to persist to localStorage:", err);
        }
        return next;
      });
    },
    [showToast]
  );

  const isFavorite = useCallback(
    (eventId: string) => {
      return favorites.includes(eventId);
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
    showToast("Wishlist cleared");
  }, [saveFavorites, showToast]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteCount: isHydrated ? favorites.length : 0,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        toastMessage,
      }}
    >
      {children}

      {/* Floating Micro Toast Notification for Wishlist Actions */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 text-xs font-bold shadow-2xl backdrop-blur-md border border-zinc-700/50 dark:border-zinc-300/50 flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
