import type { SupabaseClient } from "@supabase/supabase-js";
import { collectPermits } from "./permits";
import { collectTenders } from "./tenders";
import type { CollectedItem } from "./types";
import { collectVacancies } from "./vacancies";

export const KEEP_DAYS = 30;

export type CollectOptions = { since?: string; only?: "permits" | "tenders" | "vacancies"; municipalities?: string[] };

// One run of the daily collector: new permits and tenders into the shared feed,
// jobs older than 30 days out of it (the feed itself shows permits for 7 days). Jobs already in the feed are skipped by fingerprint.
export async function collectFeed(supabase: SupabaseClient, options: CollectOptions = {}) {
  // Jobs already in the feed, and publications read before that were no building work.
  const since = new Date(Date.now() - (KEEP_DAYS + 5) * 86400000).toISOString();
  const [known, skipped] = await Promise.all([fingerprints(supabase, "feed_items", since), fingerprints(supabase, "feed_skipped", since)]);
  const skip = new Set([...known, ...skipped]);
  // Stop reading new permits in time to save them and send the alerts (the function has 60 s).
  const deadline = Date.now() + 38_000;

  // ZZP vacancies are paid searches (Treg): only in their own run, never with the permit runs.
  const [permits, tenders, vacancies] = await Promise.all([
    options.only === "tenders" || options.only === "vacancies" ? null : collectPermits({ since: options.since, municipalities: options.municipalities, skip, deadline }),
    options.only === "permits" || options.only === "vacancies"
      ? null
      : collectTenders({ since: options.since, skip }).catch((e: Error) => ({ found: 0, items: [], error: e.message })),
    options.only === "vacancies" ? collectVacancies({ skip }) : null,
  ]);
  const items: CollectedItem[] = [...(permits?.items ?? []), ...(tenders?.items ?? []), ...(vacancies?.items ?? [])];

  let added = 0;
  for (let i = 0; i < items.length; i += 100) {
    const { data, error: insertError } = await supabase
      .from("feed_items")
      .upsert(items.slice(i, i + 100), { onConflict: "fingerprint", ignoreDuplicates: true })
      .select("id");
    if (insertError) throw new Error(insertError.message);
    added += data?.length ?? 0;
  }

  if (permits?.rejected.length) {
    const rows = permits.rejected.map((fingerprint) => ({ fingerprint }));
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from("feed_skipped").upsert(rows.slice(i, i + 500), { onConflict: "fingerprint", ignoreDuplicates: true });
    }
  }

  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
  const { count: removed } = await supabase
    .from("feed_items")
    .delete({ count: "exact" })
    .eq("is_demo", false)
    .lt("published_at", cutoff)
    // A tender stays until its closing date, even when published more than 30 days ago.
    .or(`expires_at.is.null,expires_at.lt.${new Date().toISOString()}`);
  await supabase.from("feed_skipped").delete().lt("created_at", cutoff);

  return {
    permits: permits
      ? { found: permits.found, kept: permits.items.length, notWork: permits.rejected.length, left: permits.left, errors: permits.errors }
      : "skipped",
    tenders: tenders ? { found: tenders.found, kept: tenders.items.length, ...("error" in tenders ? { error: tenders.error } : {}) } : "skipped",
    vacancies: vacancies
      ? { searches: vacancies.searches, found: vacancies.found, kept: vacancies.items.length, errors: vacancies.errors }
      : "skipped",
    added,
    removed: removed ?? 0,
  };
}

// All fingerprints of a table since a date, 1000 rows a page (the API gives at most 1000 at once).
async function fingerprints(supabase: SupabaseClient, table: "feed_items" | "feed_skipped", since: string) {
  const out: string[] = [];
  for (let page = 0; page < 100; page++) {
    const { data, error } = await supabase
      .from(table)
      .select("fingerprint")
      .gt("created_at", since)
      .order("created_at")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []).map((r) => r.fingerprint as string).filter(Boolean));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}
