import { gunzipSync } from "zlib";
import { NextResponse, type NextRequest } from "next/server";
import { postbackKey, vacancyItems, VACANCY_SEARCHES, type GoogleJob } from "@/lib/collect/vacancies";
import { emailEnabled } from "@/lib/email";
import { sendFeedEmails, sendFeedPush, sendFeedTelegram } from "@/lib/feed-notify";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";
import { telegramEnabled } from "@/lib/telegram";

export const maxDuration = 60;

type Answer = { tasks?: { data?: { tag?: string }; result?: { items?: GoogleJob[] }[] | null }[] };

// DataForSEO sends here the answer to one Google Jobs search (gzip JSON), a minute after the hourly
// cron asked for it. New building jobs go into the feed and out to Pro workers at once.
export async function POST(request: NextRequest) {
  const key = postbackKey();
  if (!key || request.nextUrl.searchParams.get("key") !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = Buffer.from(await request.arrayBuffer());
  let answer: Answer;
  try {
    answer = JSON.parse((raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw).toString("utf8")) as Answer;
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }

  const supabase = await createServerAccountClient();
  let found = 0;
  let added = 0;
  for (const task of answer.tasks ?? []) {
    const search = VACANCY_SEARCHES[Number(task.data?.tag ?? request.nextUrl.searchParams.get("tag"))];
    const jobs = (task.result ?? []).flatMap((r) => r.items ?? []);
    found += jobs.length;
    const items = await vacancyItems(jobs, search?.trade);
    if (!items.length) continue;
    const { data, error } = await supabase
      .from("feed_items")
      .upsert(items, { onConflict: "fingerprint", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("vacancies: insert failed", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    added += data?.length ?? 0;
  }

  let alerts: unknown = "no new jobs";
  if (added > 0) {
    const site = await siteUrl();
    alerts = await Promise.all([
      emailEnabled() ? sendFeedEmails(supabase, "instant", site) : "e-mail not set up",
      telegramEnabled() ? sendFeedTelegram(supabase, site) : "Telegram not set up",
      sendFeedPush(supabase, site),
    ]);
  }
  return NextResponse.json({ found, added, alerts });
}
