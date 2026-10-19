"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Spotlight } from "@/components/ui/spotlight";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "/";

  const { register, loginAsGuest } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, firstName, lastName);
      setSuccess("Account successfully created! Redirecting to AuraTickets...");
      setTimeout(() => {
        router.push(returnUrl);
      }, 700);
    } catch (err: any) {
      setError(err.message || "Registration failed. An account with this email may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-105 transition-transform">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-cyan-400 font-black tracking-wider text-xl flex items-center gap-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            AURA<span className="text-white">TICKETS</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
          Create Your Account
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Unlock instant turnstile gate passes, offline vaults, and priority seating
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden interactive-card">
        {/* Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
                />
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Vance"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
                />
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>

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
                placeholder="alex.vance@example.com"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 interactive-input"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2 font-bold flex items-center justify-center gap-2 interactive-button"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 text-center">
        <Shield className="h-3.5 w-3.5 text-emerald-500" />
        <span>1,500 Virtual Starter Credits Included with Every Account</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-600/40 selection:text-blue-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors backdrop-blur-md"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#3b82f6" />

      <AuroraBackground className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-16">
        <Suspense fallback={<div className="text-center text-zinc-400">Loading registration...</div>}>
          <RegisterForm />
        </Suspense>
      </AuroraBackground>
    </div>
  );
}
