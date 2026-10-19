"use client";

import React, { useState } from "react";
import { OfflineTicket } from "./offline-tickets";
import { CheckCircle2, Download, Smartphone } from "lucide-react";

/**
 * Generates and downloads an Apple Wallet Pass (.pkpass bundle/JSON representation)
 */
export function downloadAppleWalletPass(ticket: OfflineTicket): void {
  const passPayload = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.auratickets.entry",
    serialNumber: ticket.bookingReference || ticket.id,
    teamIdentifier: "AURATICKETS2026",
    organizationName: "AuraTickets Inc.",
    description: `${ticket.eventTitle} Entry Pass`,
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(15, 23, 42)",
    labelColor: "rgb(148, 163, 184)",
    eventTicket: {
      primaryFields: [
        {
          key: "event",
          label: "EVENT",
          value: ticket.eventTitle,
        },
      ],
      secondaryFields: [
        {
          key: "loc",
          label: "VENUE",
          value: ticket.eventVenue,
        },
        {
          key: "date",
          label: "DATE & TIME",
          value: new Date(ticket.eventDate).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
      auxiliaryFields: [
        {
          key: "seats",
          label: "SEAT ASSIGNMENT",
          value: ticket.seats
            .map((s) => `${s.sectionName || "Section"} Row ${s.row}-${s.seatNumber}`)
            .join(", "),
        },
        {
          key: "attendee",
          label: "ATTENDEE",
          value: ticket.customerName || "Verified Guest",
        },
      ],
      backFields: [
        {
          key: "terms",
          label: "TERMS & CONDITIONS",
          value:
            "This digital ticket grants admission to the specified event. Non-transferable once scanned at turnstile. AuraTickets Inc. verified security hash.",
        },
        {
          key: "hash",
          label: "VERIFICATION HASH",
          value: ticket.verificationHash || "SEC-VERIFIED",
        },
      ],
    },
    barcode: {
      format: "PKBarcodeFormatQR",
      message: ticket.bookingReference || ticket.id,
      messageEncoding: "iso-8859-1",
      altText: ticket.bookingReference || ticket.id,
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: ticket.bookingReference || ticket.id,
        messageEncoding: "iso-8859-1",
        altText: ticket.bookingReference || ticket.id,
      },
    ],
  };

  const jsonBlob = new Blob([JSON.stringify(passPayload, null, 2)], {
    type: "application/vnd.apple.pkpass",
  });
  const url = URL.createObjectURL(jsonBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ticket.bookingReference || ticket.id}-apple-wallet.pkpass`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a Google Wallet / Google Pay pass payload
 */
export function downloadGoogleWalletPass(ticket: OfflineTicket): void {
  const googlePayPayload = {
    iss: "auratickets@service.google.com",
    aud: "google",
    typ: "savetogooglepay",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      eventTicketObjects: [
        {
          id: `3388000000022344556.${ticket.bookingReference || ticket.id}`,
          classId: `3388000000022344556.event_${ticket.eventId || "general"}`,
          state: "ACTIVE",
          ticketHolderName: ticket.customerName || "Verified Guest",
          ticketNumber: ticket.bookingReference || ticket.id,
          seatInfo: {
            section: { defaultValue: { language: "en-US", value: ticket.seats[0]?.sectionName || "General" } },
            row: { defaultValue: { language: "en-US", value: ticket.seats.map((s) => s.row).join(",") } },
            seat: { defaultValue: { language: "en-US", value: ticket.seats.map((s) => s.seatNumber).join(",") } },
          },
          barcode: {
            type: "QR_CODE",
            value: ticket.bookingReference || ticket.id,
            alternateText: ticket.bookingReference || ticket.id,
          },
        },
      ],
    },
  };

  const jsonBlob = new Blob([JSON.stringify(googlePayPayload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(jsonBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ticket.bookingReference || ticket.id}-google-pay.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Official styled "Add to Apple Wallet" Button
 */
export function AppleWalletButton({
  ticket,
  onPassGenerated,
  className = "",
}: {
  ticket: OfflineTicket;
  onPassGenerated?: () => void;
  className?: string;
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadAppleWalletPass(ticket);
    setDownloaded(true);
    if (onPassGenerated) onPassGenerated();
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      title="Download and add pass to Apple Wallet (.pkpass)"
      className={`inline-flex items-center justify-center gap-2 bg-black hover:bg-zinc-900 text-white border border-white/20 rounded-xl px-4 py-2 text-xs font-semibold shadow-xl transition-all duration-200 active:scale-95 ${className}`}
    >
      {/* Apple Icon */}
      <svg className="h-4 w-4 fill-current text-white shrink-0" viewBox="0 0 170 170">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.96-12.03-14.64-5.99-9.25-10.74-20.01-14.26-32.28-3.52-12.27-5.28-23.77-5.28-34.5 0-14.89 3.83-27.13 11.48-36.72 7.65-9.6 17.15-14.49 28.5-14.69 4.7 0 9.94 1.15 15.73 3.44 5.79 2.29 9.8 3.5 12.03 3.63 1.9-.26 5.84-1.57 11.82-3.93 5.98-2.36 11.22-3.41 15.73-3.15 11.97.66 21.67 5.08 29.11 13.26-10.42 6.34-15.53 15.11-15.33 26.31.2 8.92 3.69 16.51 10.47 22.77 6.78 6.26 14.88 9.77 24.3 10.53-2.12 6.74-4.82 13.6-8.1 20.59zM119.22 31.42c0-7.23 2.65-14.07 7.95-20.52 5.3-6.45 11.85-10.44 19.65-11.97.2 1.45.3 2.76.3 3.93 0 7.1-2.73 13.9-8.19 20.4-5.46 6.5-12.02 10.37-19.68 11.61-.07-1.12-.1-2.27-.1-3.45z" />
      </svg>
      <span>{downloaded ? "Saved to Wallet ✓" : "Add to Apple Wallet"}</span>
    </button>
  );
}

/**
 * Official styled "Save to Google Pay / Google Wallet" Button
 */
export function GoogleWalletButton({
  ticket,
  onPassGenerated,
  className = "",
}: {
  ticket: OfflineTicket;
  onPassGenerated?: () => void;
  className?: string;
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadGoogleWalletPass(ticket);
    setDownloaded(true);
    if (onPassGenerated) onPassGenerated();
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      title="Save pass to Google Wallet / Google Pay (.json)"
      className={`inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 rounded-xl px-4 py-2 text-xs font-semibold shadow-xl transition-all duration-200 active:scale-95 ${className}`}
    >
      {/* Google G Logo */}
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{downloaded ? "Saved to Pay ✓" : "Save to Google Pay"}</span>
    </button>
  );
}
