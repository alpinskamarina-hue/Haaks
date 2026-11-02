import type { Profile } from "@/lib/documents";
import { feedScore, workerRegions, workerTrades, type FeedItem } from "@/lib/feed";
import type { requireUser } from "@/lib/auth";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export type ScoredFeedItem = FeedItem & { score: number; action: "hidden" | "taken" | null; leadId: string | null };

// The worker's feed: every job scored against their trade and cities, with what they did with it.
export async function loadFeed(supabase: Supabase, userId: string, profile: Profile) {
  const [{ data: items }, { data: actions }, { data: leads }] = await Promise.all([
    supabase.rpc("feed_for_me"),
    supabase.from("feed_actions").select("item_id, action").eq("user_id", userId),
    supabase.from("leads").select("id, feed_item_id").eq("user_id", userId).not("feed_item_id", "is", null),
  ]);
  const actionOf = new Map((actions ?? []).map((a) => [a.item_id as string, a.action as "hidden" | "taken"]));
  const leadOf = new Map((leads ?? []).map((l) => [l.feed_item_id as string, l.id as string]));
  const trades = workerTrades(profile.trade);
  const regions = workerRegions(profile.lead_regions ?? profile.city);
  const scored: ScoredFeedItem[] = ((items ?? []) as FeedItem[]).map((item) => ({
    ...item,
    translations: item.translations ?? {},
    score: feedScore(item, trades, regions),
    action: actionOf.get(item.id) ?? null,
    leadId: leadOf.get(item.id) ?? null,
  }));
  return { items: scored, trades, regions };
}

// A job "fits" when it matches the trade (if one is set) and is in one of the cities (if set).
export const FIT_SCORE = 65;

export function newFittingCount(items: ScoredFeedItem[]) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return items.filter((i) => i.score >= FIT_SCORE && !i.action && new Date(i.published_at).getTime() > dayAgo).length;
}
