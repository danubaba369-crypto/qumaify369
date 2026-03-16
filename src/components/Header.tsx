"use client";

import { RefreshCw, Globe, Home, LogOut, User as UserIcon, Shield, Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHome = pathname === "/";
  const isDomains = pathname === "/domains";
  const isAdminPage = pathname?.startsWith('/admin');

  const navLinks = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    { href: "/domains", label: "Domains", icon: Globe, active: isDomains },
    ...(isAdmin ? [{ href: "/admin/settings", label: "Settings", icon: Shield, active: pathname === '/admin/settings', isAdmin: true }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl p-4 flex items-center justify-between border-[rgba(255,255,255,0.05)] shadow-xl relative z-20">
        {/* Logo Text */}
        <Link href="/" className="flex items-center shrink-0">
          <span className="text-xl sm:text-3xl font-black tracking-widest bg-gradient-to-r from-[#7d12ff] via-[#ff12b1] to-[#ff8a12] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,18,177,0.4)] uppercase">
            Quamify
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${link.active ? 'text-white' : 'text-gray-400'}`}
            >
              <link.icon className={`w-4 h-4 ${link.isAdmin ? 'text-red-500' : ''}`} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4 sm:pl-4 sm:border-l border-white/10">
              <div className="flex flex-col items-end hidden lg:flex">
                <span className="text-xs text-white font-medium truncate max-w-[150px]">{user.email}</span>
                <span className="text-[10px] text-[var(--color-brand-gold)]">Premium Plan</span>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-white text-black text-xs sm:text-sm font-bold hover:bg-gray-100 transition-all active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-4 right-4 mt-2 md:hidden z-10"
          >
            <div className="glass-panel rounded-2xl p-4 space-y-2 border-[rgba(255,255,255,0.05)] shadow-2xl">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${link.active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <link.icon className={`w-5 h-5 ${link.isAdmin ? 'text-red-500' : ''}`} />
                  <span className="font-bold uppercase tracking-wider text-xs">{link.label}</span>
                </Link>
              ))}
              {user && (
                <div className="pt-2 mt-2 border-t border-white/10">
                   <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7d12ff] to-[#ff12b1] flex items-center justify-center text-white text-xs font-bold">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] text-gray-400 truncate w-full">{user.email}</span>
                        <span className="text-[8px] text-[var(--color-brand-gold)] font-bold uppercase">Authorized Admin</span>
                    </div>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
