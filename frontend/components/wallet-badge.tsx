"use client";

import React, { useState } from "react";
import { Wallet, Plus, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface WalletBadgeProps {
  className?: string;
  showQuickTopUp?: boolean;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({
  className = "",
  showQuickTopUp = true,
}) => {
  const { user, topUp } = useAuth();
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [justToppedUp, setJustToppedUp] = useState(false);

  if (!user) return null;

  const balance = user.balance !== undefined ? user.balance : 1500;

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

  return (
    <div
      className={`flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <Wallet className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono sm:hidden">
          ${Math.round(balance).toLocaleString("en-US")}
        </span>
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono hidden sm:inline">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {showQuickTopUp && (
        <button
          onClick={handleQuickTopUp}
          disabled={isToppingUp}
          title="Add $500 test funds to wallet"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
            justToppedUp
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 border border-zinc-200 dark:border-zinc-700"
          } ${isToppingUp ? "opacity-60 cursor-wait" : ""}`}
        >
          {justToppedUp ? (
            <>
              <Check className="h-3 w-3 text-white" />
              <span>+$500</span>
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              <span>$500</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
