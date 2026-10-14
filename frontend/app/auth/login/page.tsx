"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Ticket,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Spotlight } from "@/components/ui/spotlight";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "/";

  const { user, login, loginAsGuest, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already authenticated, redirect to return URL
  useEffect(() => {
    if (user && !isSubmitting) {
      router.push(returnUrl);
    }
  }, [user, router, returnUrl, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      setSuccess("Authentication successful! Redirecting...");
      setTimeout(() => {
        router.push(returnUrl);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillDemo = async (preset: "alex" | "demo" = "alex") => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (preset === "alex") {
        setEmail("alex.vance@example.com");
        setPassword("password123");
      }
      await loginAsGuest(preset);
      setSuccess(`Signed in as ${preset === "alex" ? "Alex Vance" : "Demo User"}! Redirecting...`);
      setTimeout(() => {
        router.push(returnUrl);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with demo credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-105 transition-transform">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-cyan-400 font-black tracking-wider text-xl flex items-center gap-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            AURA<span className="text-white">TICKETS</span>
          </span>
        </Link>
        <p className="text-sm text-zinc-300 mt-1">
          Sign in to access your digital ticket vault & fast checkout
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden interactive-card">
        {/* Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

        {/* Demo Fast-Pass Pill */}
        <div className="mb-6 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Demo Fast-Pass</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">TESTING</span>
              </div>
              <p className="text-[11px] text-zinc-400">Alex Vance • 1,500 Aura Credits</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleQuickFillDemo("alex")}
            className="h-7 text-xs font-semibold text-blue-300 border-blue-500/40 hover:bg-blue-600 hover:text-white shrink-0 interactive-button"
          >
            1-Click Sign In
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            disabled={isSubmitting || authLoading}
            className="w-full mt-2 font-bold flex items-center justify-center gap-2 interactive-button"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/auth/register"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 text-center">
        <Shield className="h-3.5 w-3.5 text-emerald-500" />
        <span>Secured by 256-bit JWT Session Isolation</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-600/40 selection:text-blue-100 flex flex-col relative overflow-hidden">
      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors backdrop-blur-md"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#3b82f6" />

      <AuroraBackground className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-16">
        <Suspense fallback={<div className="text-center text-zinc-400">Loading authentication...</div>}>
          <LoginForm />
        </Suspense>
      </AuroraBackground>
    </div>
  );
}
