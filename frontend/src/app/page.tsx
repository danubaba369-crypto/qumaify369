"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import HeroAddress from "@/components/HeroAddress";
import Sidebar from "@/components/Sidebar";
import EmailViewer from "@/components/EmailViewer";
import EmptyState from "@/components/EmptyState";
import { useEmails } from "@/hooks/useEmails";
import { supabase } from "@/lib/supabase";
import { domainService, type DomainRecord } from "@/services/domainService";
import { useAuth } from "@/components/providers/AuthProvider";

function generateRandomString(length: number) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const { user } = useAuth();
  const [prefix, setPrefix] = useState<string>("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [verifiedDomains, setVerifiedDomains] = useState<DomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("artradering.com");
  const [isAuto, setIsAuto] = useState(true);

  const fetchDomains = useCallback(async () => {
    if (!user) return;
    try {
      const domains = await domainService.listDomains();
      const verified = domains.filter(d => d.is_verified);
      setVerifiedDomains(verified);
      
      // If we have verified domains and currently only using the default, 
      // maybe switch to the first verified domain if needed.
    } catch (err) {
    }
  }, [user]);

  // Handle initial domain and address generation
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const platformDefault = "quamify-mail.com";
        
        // Always show platform default initially
        if (mounted && !selectedDomain) {
           setSelectedDomain(platformDefault);
        }

        if (!user) {
          if (mounted) setSelectedDomain(platformDefault);
          return;
        }

        const domains = await domainService.listDomains();
        const verified = domains.filter(d => d.is_verified);
        if (mounted) setVerifiedDomains(verified);

        const forceNew = sessionStorage.getItem("forceNewQuamifyEmail");
        const storedAddress = localStorage.getItem("quamify_active_email");
        
        // Use the first verified domain as preference, fallback to platform default
        const defaultDomain = verified.length > 0 ? verified[0].domain_name : platformDefault;

        if (forceNew === "true" || !storedAddress || !storedAddress.includes("@")) {
          const newPrefix = generateRandomString(10);
          setPrefix(newPrefix);
          setSelectedDomain(defaultDomain);
          localStorage.setItem("quamify_active_email", `${newPrefix}@${defaultDomain}`);
          sessionStorage.removeItem("forceNewQuamifyEmail");
          setIsAuto(true);
        } else {
          const [storedPrefix, storedDomain] = storedAddress.split("@");
          setPrefix(storedPrefix);
          // Check if stored domain is still valid (platform default is always valid)
          const isStillValid = storedDomain === platformDefault || verified.some(v => v.domain_name === storedDomain);
          setSelectedDomain(isStillValid ? (storedDomain || defaultDomain) : defaultDomain);
          setIsAuto(false);
        }
      } catch (err) {
        if (mounted) setSelectedDomain("quamify-mail.com");
      }
    };
    
    init();

    return () => {
      mounted = false;
    };
  }, [user]); 

  // Derive address from prefix and domain
  const address = (prefix && selectedDomain && selectedDomain !== "Loading...") 
    ? `${prefix.toLowerCase().replace(/[^a-z0-9]/g, '')}@${selectedDomain}`
    : "";

  // Update localStorage when address changes
  useEffect(() => {
    if (address) {
      localStorage.setItem("quamify_active_email", address);
    }
  }, [address]);

  const { emails, isLoading } = useEmails(address);
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;

  const handleDomainChange = (newDomain: string) => {
    setSelectedDomain(newDomain);
  };

  const handleAutoGenerate = () => {
    const newPrefix = generateRandomString(10);
    setPrefix(newPrefix);
    setIsAuto(true);
  };

  const simulateEmail = async () => {
    if (!address) return;
    try {
      await supabase.from("emails").insert({
        sender: "test@future.corp",
        subject: "Holographic Protocol Approved",
        recipient_address: address,
        body_text: "Your temporary email sequence has been successfully initialized. Welcome to the Quamify network.\n\nKeep shifting the paradigm.",
        received_at: new Date().toISOString()
      });
    } catch (e) {
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-7xl mx-auto space-y-6 flex-1 px-4 sm:px-0">
      <div className="flex-1 flex flex-col items-center justify-start py-8 sm:py-16">
        <HeroAddress 
          emailAddress={address} 
          prefix={prefix}
          onPrefixChange={(val) => {
            setPrefix(val);
            setIsAuto(false);
          }}
          onAutoGenerate={handleAutoGenerate}
          isAuto={isAuto}
          selectedDomain={selectedDomain}
          verifiedDomains={verifiedDomains}
          onDomainChange={handleDomainChange}
          onSimulate={simulateEmail}
        />
      </div>

      <div className="flex-1 min-h-0 border border-white/10 rounded-3xl overflow-hidden glass-panel flex flex-col shadow-2xl relative mb-8">
        <div className="flex h-full w-full overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="w-8 h-8 border-2 border-[var(--color-brand-pink)] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex-1 h-full">
              <EmptyState />
            </div>
          ) : (
            <Sidebar 
              emails={emails} 
              selectedEmailId={selectedEmailId} 
              onSelectEmail={setSelectedEmailId} 
            />
          )}
        </div>
      </div>

      {/* Floating 3D Modal for Email Reading */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl h-full max-h-[90vh] relative"
            >
              <div 
                className="absolute -inset-1 bg-gradient-to-r from-[var(--color-brand-purple)] via-[var(--color-brand-pink)] to-[var(--color-brand-orange)] rounded-[40px] blur-2xl opacity-40 animate-pulse-glow pointer-events-none"
              ></div>
              <div className="w-full h-full bg-[#050505]/95 rounded-[40px] relative overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                <button 
                  onClick={() => setSelectedEmailId(null)}
                  className="absolute top-6 right-6 z-[110] p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all transform hover:rotate-90 active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div className="flex-1 overflow-hidden">
                  <EmailViewer email={selectedEmail} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
