import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_TIER_DAILY_LIMIT = 2;

// Get time until midnight UTC
function getTimeUntilReset(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  const utcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const msUntilReset = utcMidnight.getTime() - now.getTime();
  const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  
  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes}m`;
  }
  
  return { hours, minutes, formatted };
}

export function useEmailUsage() {
  const { user } = useAuth();
  const [emailsSentToday, setEmailsSentToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmailUsage = useCallback(async () => {
    if (!user) {
      setEmailsSentToday(0);
      setIsLoading(false);
      return;
    }

    try {
      // Use UTC dates to match the backend SQL function (CURRENT_DATE uses UTC)
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

      const { count, error } = await supabase
        .from("email_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("sent_at", todayUTC.toISOString())
        .lt("sent_at", tomorrowUTC.toISOString());

      if (error) {
        console.error("Failed to fetch email usage:", error);
        return;
      }

      setEmailsSentToday(count || 0);
    } catch (err) {
      console.error("Error fetching email usage:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmailUsage();
  }, [fetchEmailUsage]);

  const emailsRemaining = Math.max(0, FREE_TIER_DAILY_LIMIT - emailsSentToday);
  const timeUntilReset = getTimeUntilReset();

  return {
    emailsSentToday,
    emailsRemaining,
    dailyLimit: FREE_TIER_DAILY_LIMIT,
    isLoading,
    refetch: fetchEmailUsage,
    timeUntilReset,
    resetTimeLabel: "Resets at midnight UTC",
  };
}
