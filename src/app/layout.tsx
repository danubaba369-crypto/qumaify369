import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quamify Mail | Holographic Temp Email",
  description: "High-end, futuristic temporary email inbox by Quamify.",
  icons: {
    icon: '/icon.svg',
  }
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-white pt-24 min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <div className="flex-1 flex flex-col pt-24 relative z-10">
            <Header />
            <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-7xl mx-auto space-y-6 flex-1 px-4 sm:px-0">
              {children}
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
