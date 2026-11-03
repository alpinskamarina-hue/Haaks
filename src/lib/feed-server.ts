import type { Profile } from "@/lib/documents";
import { distanceKm, feedScore, workerMatch, type FeedItem, type WorkerMatch } from "@/lib/feed";
import type { requireUser } from "@/lib/auth";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export type ScoredFeedItem = FeedItem & {
  score: number;
  // km from the worker's home, when both places are known.
  distance: number | null;
  action: "hidden" | "taken" | null;
  leadId: string | null;
};

// The worker's feed: every job scored against their trade and cities, with what they did with it.
export async function loadFeed(supabase: Supabase, userId: string, profile: Profile) {
  const [{ data: items }, { data: places }, { data: actions }, { data: leads }] = await Promise.all([
    supabase.rpc("feed_for_me"),
    // Missing until the smart-feed migration has run: the feed then works without distances.
    supabase.rpc("feed_places"),
    supabase.from("feed_actions").select("item_id, action").eq("user_id", userId),
    supabase.from("leads").select("id, feed_item_id").eq("user_id", userId).not("feed_item_id", "is", null),
  ]);
  const actionOf = new Map((actions ?? []).map((a) => [a.item_id as string, a.action as "hidden" | "taken"]));
  const leadOf = new Map((leads ?? []).map((l) => [l.feed_item_id as string, l.id as string]));
  const placeOf = new Map(
    ((places ?? []) as { id: string; lat: number | null; lng: number | null; region: string | null }[]).map((p) => [p.id, p]),
  );
  const match: WorkerMatch = workerMatch(profile);
  const scored: ScoredFeedItem[] = ((items ?? []) as FeedItem[]).map((row) => {
    const place = placeOf.get(row.id);
    const item = { ...row, lat: place?.lat ?? null, lng: place?.lng ?? null, region: place?.region ?? null };
    const km = distanceKm(item, match);
    return {
      ...item,
      translations: item.translations ?? {},
      score: feedScore(item, match),
      distance: km === null ? null : Math.round(km),
      action: actionOf.get(item.id) ?? null,
      leadId: leadOf.get(item.id) ?? null,
    };
  });
  return { items: scored, match, trades: match.trades, regions: match.regions };
}

// A job "fits" when it matches the trade (if one is set) and is within the travel radius
// or in one of the cities (if set). Trade alone (65) is not enough.
export const FIT_SCORE = 70;

export function newFittingCount(items: ScoredFeedItem[]) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return items.filter((i) => i.score >= FIT_SCORE && !i.action && new Date(i.published_at).getTime() > dayAgo).length;
}
