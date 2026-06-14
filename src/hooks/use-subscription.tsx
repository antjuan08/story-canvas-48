import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TIER_LIMITS, type TierId } from "@/lib/tiers";

type ProfileSub = {
  subscription_tier: TierId;
  subscription_status: string;
  subscription_interval: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  reimagine_credits: number;
};

type UsageCounters = {
  keynotes_count: number;
  podcasts_count: number;
  books_count: number;
  reimagines_count: number;
};

export function useSubscription() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSub | null>(null);
  const [usage, setUsage] = useState<UsageCounters>({
    keynotes_count: 0, podcasts_count: 0, books_count: 0, reimagines_count: 0,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: u }] = await Promise.all([
      supabase.from("profiles")
        .select("subscription_tier, subscription_status, subscription_interval, trial_ends_at, current_period_end, reimagine_credits")
        .eq("id", user.id).maybeSingle(),
      supabase.from("usage_counters")
        .select("keynotes_count, podcasts_count, books_count, reimagines_count")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (p) setProfile(p as ProfileSub);
    if (u) setUsage(u as UsageCounters);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const tier: TierId = profile?.subscription_tier ?? "storyteller";
  const status = profile?.subscription_status ?? "trialing";
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const isTrialing = status === "trialing";
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : 0;
  const trialExpired = isTrialing && trialEnd ? trialEnd.getTime() < Date.now() : false;
  const isActive = ["active", "trialing", "past_due"].includes(status) && !trialExpired;

  const limits = TIER_LIMITS[tier];

  const canCreate = useCallback((kind: "keynote" | "podcast" | "book" | "reimagine"): boolean => {
    if (!isActive) return false;
    if (kind === "reimagine") {
      return limits.reimagined && (profile?.reimagine_credits ?? 0) > 0;
    }
    const cap =
      kind === "keynote" ? limits.keynotes :
      kind === "podcast" ? limits.podcasts :
      limits.books;
    const used =
      kind === "keynote" ? usage.keynotes_count :
      kind === "podcast" ? usage.podcasts_count :
      usage.books_count;
    if (cap === -1) return true;
    return used < cap;
  }, [isActive, limits, profile, usage]);

  return {
    loading,
    profile,
    usage,
    tier,
    status,
    isTrialing,
    isActive,
    daysLeft,
    trialExpired,
    limits,
    credits: profile?.reimagine_credits ?? 0,
    canCreate,
    refetch,
  };
}
