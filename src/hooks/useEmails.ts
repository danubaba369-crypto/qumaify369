"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Email } from "@/types";

export function useEmails(recipientAddress: string | null) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    if (!recipientAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("recipient_address", recipientAddress)
        .order("received_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEmails(data as Email[]);
      }
    } catch (err) {
      // Use warn instead of error to prevent Next.js dev overlay from popping up continuously
      // when the user hasn't created the 'emails' table yet.
      console.warn("Supabase fetch warning (expected if table not created):", err);
    } finally {
      setIsLoading(false);
    }
  }, [recipientAddress]);

  useEffect(() => {
    fetchEmails();

    if (!recipientAddress) return;

    // Set up realtime subscription
    const channel = supabase
      .channel("custom-insert-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
          filter: `recipient_address=eq.${recipientAddress}`,
        },
        (payload) => {
          console.log("New email received:", payload.new);
          setEmails((prev) => [payload.new as Email, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientAddress, fetchEmails]);

  return { emails, isLoading, refetch: fetchEmails };
}
