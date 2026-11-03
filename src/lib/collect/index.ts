import type { SupabaseClient } from "@supabase/supabase-js";
import { collectPermits } from "./permits";
import { collectTenders } from "./tenders";
import type { CollectedItem } from "./types";

export const KEEP_DAYS = 30;

export type CollectOptions = { since?: string; only?: "permits" | "tenders"; municipalities?: string[] };

// One run of the daily collector: new permits and tenders into the shared feed,
// jobs older than 30 days out of it. Jobs already in the feed are skipped by fingerprint.
export async function collectFeed(supabase: SupabaseClient, options: CollectOptions = {}) {
  const { data: known, error } = await supabase
    .from("feed_items")
    .select("fingerprint")
    .gt("created_at", new Date(Date.now() - (KEEP_DAYS + 5) * 86400000).toISOString());
  if (error) throw new Error(error.message);
  const skip = new Set((known ?? []).map((r) => r.fingerprint as string).filter(Boolean));

  const [permits, tenders] = await Promise.all([
    options.only === "tenders" ? null : collectPermits({ since: options.since, municipalities: options.municipalities, skip }),
    options.only === "permits" ? null : collectTenders({ since: options.since, skip }).catch((e: Error) => ({ found: 0, items: [], error: e.message })),
  ]);
  const items: CollectedItem[] = [...(permits?.items ?? []), ...(tenders?.items ?? [])];

  let added = 0;
  for (let i = 0; i < items.length; i += 100) {
    const { data, error: insertError } = await supabase
      .from("feed_items")
      .upsert(items.slice(i, i + 100), { onConflict: "fingerprint", ignoreDuplicates: true })
      .select("id");
    if (insertError) throw new Error(insertError.message);
    added += data?.length ?? 0;
  }

  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
  const { count: removed } = await supabase
    .from("feed_items")
    .delete({ count: "exact" })
    .eq("is_demo", false)
    .lt("published_at", cutoff);

  return {
    permits: permits ? { found: permits.found, kept: permits.items.length, errors: permits.errors } : "skipped",
    tenders: tenders ? { found: tenders.found, kept: tenders.items.length, ...("error" in tenders ? { error: tenders.error } : {}) } : "skipped",
    added,
    removed: removed ?? 0,
  };
}
