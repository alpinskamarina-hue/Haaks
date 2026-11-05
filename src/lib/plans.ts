import type { SupabaseClient } from "@supabase/supabase-js";

// Plans (Nasim, 2026-11-04): Free forever, Pro (jobs first) and Ultra (Pro + AI).
// Prices are per month without btw; a year costs 10 months. Founder price for life for whoever
// pays in the first month after payments open, or until 100 founders.
export type Plan = "free" | "pro" | "ultra";
export const PAID_PLANS = ["pro", "ultra"] as const;
export const PRICES = {
  pro: { month: 29, founder: 19, year: 290, founderYear: 190 },
  ultra: { month: 89, founder: 59, year: 890, founderYear: 590 },
} as const;
export const TRIAL_DAYS = 7;
// The founder counter is shown once there are this many founders; before that only the days.
export const FOUNDER_COUNTER_FROM = 10;
// AI uses per 30 days (Ultra = fair use).
export const AI_LIMITS: Record<Plan, number> = { free: 3, pro: 20, ultra: 300 };

type PlanFields = { plan?: string | null; plan_until?: string | null };

// The plan in force right now: a paid plan or trial ends at plan_until.
export function planOf(p: PlanFields | null | undefined): Plan {
  const plan = p?.plan;
  if (plan !== "pro" && plan !== "ultra") return "free";
  if (p?.plan_until && Date.parse(p.plan_until) <= Date.now()) return "free";
  return plan;
}

export const isPaid = (p: PlanFields | null | undefined) => planOf(p) !== "free";

export type FounderOffer = { open: boolean; endsAt: string | null; founders: number; placesLeft: number; limit: number };

export async function founderOffer(supabase: SupabaseClient): Promise<FounderOffer> {
  const { data } = await supabase
    .rpc("founder_offer")
    .maybeSingle<{ open: boolean; ends_at: string | null; founders: number; places_left: number; founder_limit: number }>();
  return {
    open: Boolean(data?.open),
    endsAt: data?.ends_at ?? null,
    founders: data?.founders ?? 0,
    placesLeft: data?.places_left ?? 100,
    limit: data?.founder_limit ?? 100,
  };
}

export const daysLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
