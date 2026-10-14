"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("auratickets_theme") || localStorage.getItem("auratickets-theme")) as Theme | null;
      if (stored === "light") {
        setThemeState("light");
        document.documentElement.classList.remove("dark");
      } else {
        // Mặc định cho người mới hoặc khi lưu 'dark'
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      console.warn("Could not access localStorage for theme preference:", e);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("disable-transitions");
    }

    setThemeState(newTheme);
    try {
      localStorage.setItem("auratickets_theme", newTheme);
      localStorage.setItem("auratickets-theme", newTheme);
    } catch (e) {}

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.documentElement.classList.remove("disable-transitions");
        });
      });
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
