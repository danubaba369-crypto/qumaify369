"use client";

import { useState } from "react";
import { Copy, Check, Wand2, Sparkles, Globe } from "lucide-react";
import { motion } from "framer-motion";

interface HeroAddressProps {
  emailAddress: string;
  prefix: string;
  onPrefixChange: (val: string) => void;
  onAutoGenerate: () => void;
  isAuto: boolean;
  selectedDomain: string;
  verifiedDomains: any[];
  onDomainChange: (val: string) => void;
}

export default function HeroAddress({ 
  emailAddress, 
  prefix, 
  onPrefixChange, 
  onAutoGenerate, 
  isAuto,
  selectedDomain,
  verifiedDomains,
  onDomainChange
}: HeroAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!emailAddress) return;
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex justify-center py-4"
    >
      <div className="relative group w-full max-w-3xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-[--color-brand-purple] via-[--color-brand-pink] to-[--color-brand-orange] rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse-glow"></div>
        
        <div className="relative bg-black/40 backdrop-blur-2xl rounded-[40px] p-8 sm:p-12 border border-white/10 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-brand-pink] animate-ping"></span>
            <h2 className="text-xs font-black text-gray-400 tracking-[0.3em] uppercase relative z-10">Active Holographic Inbox</h2>
          </div>
          
          <div className="flex flex-col gap-8 w-full relative z-10">
            {/* Main Interactive Address Input */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-black/60 border border-white/10 rounded-3xl p-2 pl-6 shadow-2xl focus-within:border-[var(--color-brand-pink)]/50 transition-all">
              <input 
                type="text"
                value={prefix}
                onChange={(e) => onPrefixChange(e.target.value)}
                className="flex-1 bg-transparent text-2xl sm:text-3xl font-black text-white outline-none min-w-0"
                placeholder="prefix"
              />
              <span className="text-2xl text-gray-600 font-light">@</span>
              <select 
                value={selectedDomain}
                onChange={(e) => onDomainChange(e.target.value)}
                className="bg-white/5 hover:bg-white/10 text-lg font-bold text-gray-300 px-4 py-3 rounded-2xl outline-none cursor-pointer appearance-none transition-all"
              >
                {/* Always show the currently selected domain as the primary option */}
                <option value={selectedDomain} className="bg-[#050505]">{selectedDomain}</option>
                
                {/* List other verified domains, excluding the currently selected one to avoid duplicates */}
                {verifiedDomains.filter(d => d.domain_name !== selectedDomain).map(d => (
                  <option key={d.id} value={d.domain_name} className="bg-[#050505]">{d.domain_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onAutoGenerate}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  isAuto 
                    ? "bg-[var(--color-brand-pink)] text-white shadow-[0_0_20px_var(--color-brand-pink)]/40" 
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Auto-Gen
              </button>

              <button
                onClick={handleCopy}
                disabled={!emailAddress}
                className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  copied 
                    ? "bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]" 
                    : "bg-white text-black hover:shadow-[0_0_30px_rgba(255,18,177,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? "Copied to Vault" : "Copy Active Address"}
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-6 opacity-40">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
              <Globe className="w-3 h-3" />
              <span className="text-[10px] font-mono tracking-tighter uppercase">{selectedDomain}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-mono tracking-tighter uppercase">SSL/Holo-Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
