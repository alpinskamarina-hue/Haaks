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
  // ⭐ saved for later.
  saved: boolean;
  // The quote the worker made from this job, if any.
  quote: { status: string; viewed: boolean } | null;
  // Colleagues who sent this job to the worker («Отправить в Haaks»), newest first.
  sharedBy: SharedFrom[];
};

export type SharedFrom = {
  id: string;
  note: string | null;
  created_at: string;
  seen_at: string | null;
  thanked_at: string | null;
  from_name: string | null;
  from_username: string | null;
};

export type HideNote = { reason: string | null; at: string };

// Cards a free worker can open in full per 24 hours (the database enforces it in unlock_feed_item()).
export const FREE_OPENS = 3;

// The worker's feed: every job scored against their trade and cities, with what they did with it.
export async function loadFeed(supabase: Supabase, userId: string, profile: Profile) {
  const [{ data: items }, { data: places }, { data: actions }, { data: leads }, { data: unlocks }, { data: savedRows }, { data: shareRows }] = await Promise.all([
    supabase.rpc("feed_for_me"),
    supabase.rpc("feed_details"),
    supabase.from("feed_actions").select("item_id, action, reason, created_at").eq("user_id", userId),
    supabase.from("leads").select("id, feed_item_id, quote_id").eq("user_id", userId).not("feed_item_id", "is", null),
    supabase.from("feed_unlocks").select("item_id, created_at").eq("user_id", userId),
    supabase.from("feed_saved").select("item_id").eq("user_id", userId),
    supabase.rpc("my_shared_jobs"),
  ]);
  const shares = ((shareRows ?? []) as (SharedFrom & { item_id: string })[]);
  const sharesOf = new Map<string, SharedFrom[]>();
  for (const sh of shares) sharesOf.set(sh.item_id, [...(sharesOf.get(sh.item_id) ?? []), sh]);
  const quoteIds = (leads ?? []).map((l) => l.quote_id as string | null).filter((q): q is string => !!q);
  const { data: quoteRows } = quoteIds.length
    ? await supabase.from("quotes").select("id, status, viewed_at").in("id", quoteIds)
    : { data: [] as { id: string; status: string; viewed_at: string | null }[] };
  const quoteById = new Map((quoteRows ?? []).map((q) => [q.id as string, { status: q.status as string, viewed: !!q.viewed_at }]));
  const quoteOf = new Map((leads ?? []).map((l) => [l.feed_item_id as string, quoteById.get(l.quote_id as string) ?? null]));
  const savedSet = new Set((savedRows ?? []).map((r) => r.item_id as string));
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
      opened: opened.has(item.id) || sharesOf.has(item.id),
      saved: savedSet.has(item.id),
      quote: quoteOf.get(item.id) ?? null,
      sharedBy: sharesOf.get(item.id) ?? [],
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
  // Why jobs were hidden, for the feed tips ("make the radius smaller?").
  const hides: HideNote[] = (actions ?? [])
    .filter((a) => a.action === "hidden")
    .map((a) => ({ reason: (a.reason as string | null) ?? null, at: a.created_at as string }));
  // Sent jobs not looked at yet (the red number on «Мне прислали»), only for jobs still in the feed.
  const inFeed = new Set(scored.map((i) => i.id));
  const sharesUnseen = shares.filter((sh) => !sh.seen_at && inFeed.has(sh.item_id)).length;
  return { items: scored, sharesUnseen, match, trades: match.trades, regions: match.regions, opensLeft, opensInHours, hides };
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
