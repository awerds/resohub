import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: "RESO // Global Schumann Resonance & Ionospheric Telemetry",
  description:
    "Interactive 3D planetary visualization and spectral analysis dashboard for Earth-Ionosphere cavity Schumann Resonance (7.83 Hz) telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-dvh w-dvw overflow-hidden flex flex-col bg-[#030712] text-slate-100">
        {children}
      </body>
    </html>
  );
}
