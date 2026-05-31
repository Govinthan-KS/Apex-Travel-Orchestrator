import type { Metadata } from "next";
import { PrimeReactProvider } from "primereact/api";
import { SessionProvider } from "next-auth/react";

import "primeicons/primeicons.css";

/* ── Our Theme & Globals — the real magic starts here ── */
import "./globals.css";

/* ── Components — the building blocks of this lime-green empire ── */
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Apex Travel Orchestrator",
  description:
    "AI-powered multi-agent travel planning system — plan, book, and manage trips with intelligent orchestration.",
};

/*
 * Root Layout
 * -----------
 * The skeleton that holds this whole lime-green fever dream together.
 * Now with a reactive Navbar and global MongoDB-green toasts.
 *
 * This navbar is the only thing keeping this app from floating
 * away into the cloud. Literally.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
          <SessionProvider>
            <ToastProvider>
              <Navbar />
              {children}
            </ToastProvider>
          </SessionProvider>
      </body>
    </html>
  );
}
