"use client";

import { RefreshCw, Globe, Home, LogOut, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isDomains = pathname === "/domains";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl p-4 flex items-center justify-between border-[rgba(255,255,255,0.05)] shadow-xl">
        {/* Logo Text */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl sm:text-3xl font-black tracking-widest bg-gradient-to-r from-[#7d12ff] via-[#ff12b1] to-[#ff8a12] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,18,177,0.4)] uppercase">
            Quamify
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${isHome ? 'text-white' : 'text-gray-400'}`}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link 
            href="/domains" 
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${isDomains ? 'text-white' : 'text-gray-400'}`}
          >
            <Globe className="w-4 h-4" />
            Domains
          </Link>
          {isAdmin && (
            <Link 
              href="/admin/settings" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${pathname === '/admin/settings' ? 'text-white' : 'text-gray-400'}`}
            >
              <Shield className="w-4 h-4 text-red-500" />
              Settings
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isHome && (
            <button 
              className="relative px-6 py-2.5 rounded-full font-medium text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hidden sm:block"
              onClick={() => {
                sessionStorage.setItem("forceNewQuamifyEmail", "true");
                window.location.reload();
              }}
            >
              <div className="absolute inset-0 bg-transparent rounded-full border border-transparent holo-border z-0"></div>
              <div className="relative z-10 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#ff12b1]" />
                <span>Generate New</span>
              </div>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
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
              className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
