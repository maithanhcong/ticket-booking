import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { GlobalAiAssistant } from "@/components/ai/GlobalAiAssistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuraTickets | Next-Gen Stadium & Concert Booking",
  description:
    "High-concurrency ticket booking engine featuring real-time stadium seat selection, distributed lock protection, and dark-mode immersion.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('auratickets_theme');
                  if (stored === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Mặc định cho người mới hoặc khi lưu 'dark'
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#F8F9FA] text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100 antialiased min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              {children}
              <GlobalAiAssistant />
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
