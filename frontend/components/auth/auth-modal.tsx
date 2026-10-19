"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User as UserIcon, Sparkles, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, loginAsGuest, isLoading } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, firstName, lastName);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    }
  };

  const handleQuickDemo = async (preset: "alex" | "demo" | "admin") => {
    setError(null);
    try {
      await loginAsGuest(preset);
    } catch (err: any) {
      setError(err.message || "Could not switch demo user.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 mb-3">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {mode === "login" ? "Welcome Back" : "Create Aura Account"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === "login"
                ? "Sign in to reserve stadium seats & manage tickets"
                : "Join thousands of fans for instant flash sale access"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-5">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "login"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "register"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-blue-400" /> Fast Demo Switching
              </span>
              <Badge variant="glass" className="text-[9px] py-0 px-1.5 text-blue-200">
                1-Click Sign In
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("alex")}
                className="py-1.5 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-medium text-zinc-200 hover:text-white transition-all text-center flex items-center justify-center gap-1"
              >
                <span>Alex Vance</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("demo")}
                className="py-1.5 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-medium text-zinc-200 hover:text-white transition-all text-center flex items-center justify-center gap-1"
              >
                <span>Demo User</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("admin")}
                className="py-1.5 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-medium text-zinc-200 hover:text-white transition-all text-center flex items-center justify-center gap-1"
              >
                <Shield className="h-2.5 w-2.5 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400 block">First Name</label>
                  <div className="relative">
                    <UserIcon className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400 block">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Vance"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 block">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.vance@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 block">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              disabled={isLoading}
              className="w-full font-bold text-xs py-2.5 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Account" : "Complete Registration"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
