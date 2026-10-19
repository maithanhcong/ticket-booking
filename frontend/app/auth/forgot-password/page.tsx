"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Mail,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Spotlight } from "@/components/ui/spotlight";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to process password reset request.");
      }

      const result = await res.json().catch(() => ({}));
      setIsSuccess(true);
      setResponseMessage(
        result.message ||
          `Password reset instructions have been dispatched to ${email}. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      // Graceful demo fallback if backend is offline or unreachable
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setIsSuccess(true);
        setResponseMessage(
          `Demo Mode: Password reset link generated for ${email}. Please check your simulated email inbox.`
        );
      } else {
        setError(err.message || "Could not complete reset request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-600/40 selection:text-blue-100 flex flex-col relative overflow-hidden">
      {/* Top back navigation */}
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
        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="font-black tracking-tight text-2xl text-white">
                AURA<span className="text-blue-500">TICKETS</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
              Forgot Your Password?
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Enter your email and we&apos;ll dispatch password reset instructions.
            </p>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden interactive-card">
            {/* Glow Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Instructions Dispatched!</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {responseMessage}
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/auth/login">
                    <Button variant="glow" size="default" className="w-full font-bold text-xs interactive-button">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Error Alert */}
                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Account Email
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
                        <span>Sending reset link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Reset Instructions</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
                  <p className="text-xs text-zinc-400">
                    Remember your password?{" "}
                    <Link
                      href="/auth/login"
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 text-center">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted Token Verification</span>
          </div>
        </div>
      </AuroraBackground>
    </div>
  );
}
