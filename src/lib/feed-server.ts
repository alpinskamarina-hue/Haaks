import type { Profile } from "@/lib/documents";
import { distanceKm, feedScore, workerMatch, type FeedItem, type WorkerMatch } from "@/lib/feed";
import type { requireUser } from "@/lib/auth";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export type ScoredFeedItem = FeedItem & {
  score: number;
  // km from the worker's home, when both places are known.
  distance: number | null;
  // When the job came into the feed.
  added_at: string;
  action: "hidden" | "taken" | null;
  leadId: string | null;
  // A free worker opened this card with one of their free opens: shown like for Pro.
  opened: boolean;
};

// Cards a free worker can open in full per 24 hours (the database enforces it in unlock_feed_item()).
export const FREE_OPENS = 3;

// The worker's feed: every job scored against their trade and cities, with what they did with it.
export async function loadFeed(supabase: Supabase, userId: string, profile: Profile) {
  const [{ data: items }, { data: places }, { data: actions }, { data: leads }, { data: unlocks }] = await Promise.all([
    supabase.rpc("feed_for_me"),
    supabase.rpc("feed_details"),
    supabase.from("feed_actions").select("item_id, action").eq("user_id", userId),
    supabase.from("leads").select("id, feed_item_id").eq("user_id", userId).not("feed_item_id", "is", null),
    supabase.from("feed_unlocks").select("item_id, created_at").eq("user_id", userId),
  ]);
  const opened = new Set((unlocks ?? []).map((u) => u.item_id as string));
  const actionOf = new Map((actions ?? []).map((a) => [a.item_id as string, a.action as "hidden" | "taken"]));
  const leadOf = new Map((leads ?? []).map((l) => [l.feed_item_id as string, l.id as string]));
  const placeOf = new Map(
    ((places ?? []) as { id: string; lat: number | null; lng: number | null; region: string | null; added_at: string }[]).map((p) => [p.id, p]),
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
      added_at: place?.added_at ?? item.published_at,
      action: actionOf.get(item.id) ?? null,
      leadId: leadOf.get(item.id) ?? null,
      opened: opened.has(item.id),
    };
  });
  // Opens in the last 24 hours count; an opened card stays open for good.
  const recent = (unlocks ?? [])
    .map((u) => new Date(u.created_at as string).getTime())
    .filter((t) => t > Date.now() - DAY)
    .sort((a, b) => a - b);
  const opensLeft = Math.max(0, FREE_OPENS - recent.length);
  // When all are used: hours until the earliest of them is 24 hours old.
  const opensInHours = opensLeft > 0 ? 0 : Math.max(1, Math.ceil((recent[0] + DAY - Date.now()) / 3600000));
  return { items: scored, match, trades: match.trades, regions: match.regions, opensLeft, opensInHours };
}

// A job "fits" when it matches the trade (if one is set) and is within the travel radius
// or in one of the cities (if set). Trade alone (65) is not enough.
export const FIT_SCORE = 70;

const DAY = 24 * 60 * 60 * 1000;

// Jobs newer than this are "new": since the given visit, or the last 24 hours for a worker
// who never opened the feed.
export function newSince(seenAt: string | null | undefined) {
  return seenAt ? new Date(seenAt).getTime() : Date.now() - DAY;
}

export const isNewJob = (item: ScoredFeedItem, since: number) => !item.action && new Date(item.added_at).getTime() > since;

// The number on the "Feed" button: fitting jobs that came in since the worker last opened the feed.
export function newFittingCount(items: ScoredFeedItem[], seenAt?: string | null) {
  const since = newSince(seenAt);
  return items.filter((i) => i.score >= FIT_SCORE && isNewJob(i, since)).length;
}

// Opening the feed: the badge starts from now. A new visit (after 30 minutes away) also
// moves the "new" marks on, so they stay put while the worker clicks through the sections.
export async function markFeedSeen(
  supabase: Supabase,
  userId: string,
  profile: { feed_seen_at?: string | null; feed_last_visit?: string | null },
) {
  const now = new Date();
  const seen = profile.feed_seen_at ? new Date(profile.feed_seen_at).getTime() : 0;
  const newVisit = now.getTime() - seen > 30 * 60 * 1000;
  const lastVisit = newVisit ? (profile.feed_seen_at ?? null) : (profile.feed_last_visit ?? null);
  await supabase
    .from("profiles")
    .update(newVisit ? { feed_seen_at: now.toISOString(), feed_last_visit: lastVisit } : { feed_seen_at: now.toISOString() })
    .eq("id", userId);
  return lastVisit;
}
