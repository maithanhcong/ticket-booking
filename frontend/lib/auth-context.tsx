"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  loginAsGuest: (preset?: "alex" | "demo" | "admin") => Promise<void>;
  topUp: (amount?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalBalance: (deltaOrNewBalance: number, isDelta?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "ticketvault_auth_token";
const USER_KEY = "ticketvault_auth_user";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Default Demo User fallback (Alex Vance)
const DEFAULT_DEMO_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "alex.vance@example.com",
  firstName: "Alex",
  lastName: "Vance",
  role: "CUSTOMER",
  balance: 1500.0,
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Restore stored session on mount (Guest first, no auto-login mock)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      // Clean up legacy mock token if present so user is truly guest by default
      if (storedToken === "demo-jwt-token-alex-vance") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        return;
      }

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.id) {
            setToken(storedToken);
            setUser(parsed);
            return;
          }
        } catch {
          // Invalid JSON in localStorage
        }
      }

      // Default state: Guest (null)
      setToken(null);
      setUser(null);
    } catch (e) {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Standard Login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to sign in. Please verify your credentials.");
      }

      const data = await res.json();
      setToken(data.accessToken);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsAuthModalOpen(false);
    } catch (err: any) {
      // If backend is not reached, simulate client login for seamless local testing
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        const fallbackUser: User = {
          id: `user-${Math.random().toString(36).substring(2, 9)}`,
          email,
          firstName: email.split("@")[0],
          lastName: "Member",
          role: "CUSTOMER",
        };
        setToken(`mock-token-${Date.now()}`);
        setUser(fallbackUser);
        localStorage.setItem(TOKEN_KEY, `mock-token-${Date.now()}`);
        localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
        setIsAuthModalOpen(false);
        return;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Registration failed.");
        }

        const data = await res.json();
        setToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
      } catch (err: any) {
        if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
          const fallbackUser: User = {
            id: `user-${Math.random().toString(36).substring(2, 9)}`,
            email,
            firstName,
            lastName,
            role: "CUSTOMER",
          };
          setToken(`mock-token-${Date.now()}`);
          setUser(fallbackUser);
          localStorage.setItem(TOKEN_KEY, `mock-token-${Date.now()}`);
          localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
          setIsAuthModalOpen(false);
          return;
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fast One-Click Demo / Guest Switch
  const loginAsGuest = useCallback(async (preset: "alex" | "demo" | "admin" = "alex") => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return;
      }
    } catch {
      // Backend not running locally -> Use local mock switch
    }

    let mockUser: User = DEFAULT_DEMO_USER;
    if (preset === "admin") {
      mockUser = {
        id: "00000000-0000-0000-0000-000000000003",
        email: "admin@auratickets.com",
        firstName: "System",
        lastName: "Admin",
        role: "ADMIN",
      };
    } else if (preset === "demo") {
      mockUser = {
        id: "00000000-0000-0000-0000-000000000002",
        email: "demo@auratickets.com",
        firstName: "Demo",
        lastName: "Customer",
        role: "CUSTOMER",
      };
    }

    setToken(`token-${preset}-${Date.now()}`);
    setUser(mockUser);
    localStorage.setItem(TOKEN_KEY, `token-${preset}-${Date.now()}`);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    setIsAuthModalOpen(false);
    setIsLoading(false);
  }, []);

  // Sync profile with backend
  const refreshProfile = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken || currentToken.startsWith("demo-") || currentToken.startsWith("token-")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      }
    } catch {
      // quiet fallback
    }
  }, [token]);

  // Sync profile when token changes or on initial restore
  useEffect(() => {
    if (token && !token.startsWith("demo-") && !token.startsWith("token-")) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  // Wallet top-up
  const topUp = useCallback(
    async (amount: number = 500) => {
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      const safeAmount = Number(amount) || 500;

      if (currentToken && !currentToken.startsWith("demo-") && !currentToken.startsWith("token-")) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/top-up`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({ amount: safeAmount }),
          });

          if (res.ok) {
            const updated = await res.json();
            setUser(updated);
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            return;
          }
        } catch {
          // fallback to local update below
        }
      }

      // Local / Offline fallback update
      setUser((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          balance: Number(((prev.balance ?? 1500) + safeAmount).toFixed(2)),
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [token]
  );

  // Directly update local balance after direct booking or refund
  const updateLocalBalance = useCallback((deltaOrNewBalance: number, isDelta: boolean = false) => {
    setUser((prev) => {
      if (!prev) return null;
      const currentBal = prev.balance ?? 1500;
      const nextBal = isDelta
        ? Math.max(0, Number((currentBal + deltaOrNewBalance).toFixed(2)))
        : Math.max(0, Number(deltaOrNewBalance.toFixed(2)));
      const updated = {
        ...prev,
        balance: nextBal,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
        loginAsGuest,
        topUp,
        refreshProfile,
        updateLocalBalance,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
