import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { feedText, type FeedItem } from "@/lib/feed";
import { alreadyHandled, fittingJobs, loadRecentItems, MATCH_COLUMNS } from "@/lib/feed-notify";
import type { Lang } from "@/lib/i18n";
import type { StaffJob } from "@/lib/staff-feed";

// Step 5d: on the worker's command the employee searches the job feed and prepares a reply
// as a job card. The card has the usual «Отправить» button: nothing is sent without that tap.
export const STAFF_FEED_TOOLS: Anthropic.Tool[] = [
  {
    name: "find_feed_jobs",
    description:
      "Search the Haaks job feed (last 3 days) for the worker. Without a query it returns the jobs that fit the worker's trades and region best. With a query it matches words in the title, description and city (e.g. «tegels Rotterdam»). Returns job ids to use with prepare_job_reply.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to look for, Dutch works best (tegels, badkamer, schilder, Rotterdam)" },
        kind: { type: "string", enum: ["private", "business", "permit", "tender"], description: "private = from private clients, business = companies looking for ZZP, permit = building permits, tender = public tenders" },
      },
    },
  },
  {
    name: "prepare_job_reply",
    description:
      "Prepare a reply to one job from find_feed_jobs. It is shown to the worker as a job card with the Dutch text and a «Send» button; nothing is sent until they tap it. Max 3 per answer.",
    input_schema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
        draft_nl: {
          type: "string",
          description:
            "Short polite Dutch reply from the worker in first person (max 600 characters): greet, what they can do, offer to come and look or call, at most two questions, sign with the first name. Never a price, rate or start date; never invented facts.",
        },
        why: { type: "string", description: "One or two short sentences in the worker's language: why this job fits and what to watch out for" },
        meaning: { type: "string", description: "One line in the worker's language saying what the Dutch reply says" },
      },
      required: ["job_id", "draft_nl", "why", "meaning"],
    },
  },
];

export type StaffJobCard = { feed_item_id: string; job: StaffJob; draft: string; body: string };

type Worker = Parameters<typeof fittingJobs>[0];

export function staffFeedTools(getServer: () => Promise<SupabaseClient>, userId: string, lang: Lang, site: string) {
  let items: Awaited<ReturnType<typeof loadRecentItems>> | null = null;
  const cards: StaffJobCard[] = [];
  const load = async () => (items ??= await loadRecentItems(await getServer(), Date.now()));

  async function run(name: string, raw: unknown): Promise<string> {
    const a = (raw ?? {}) as { query?: string; kind?: string; job_id?: string; draft_nl?: string; why?: string; meaning?: string };

    if (name === "find_feed_jobs") {
      const server = await getServer();
      const [{ data: me }, all, skip] = await Promise.all([
        server.from("profiles").select(`id, plan, plan_until, ${MATCH_COLUMNS}, passport_enabled, passport_token, full_name`).eq("id", userId).single<Worker & { passport_enabled: boolean | null; passport_token: string | null; full_name: string | null }>(),
        load(),
        alreadyHandled(server, "staff", [userId]),
      ]);
      if (!me) return "Profile not found.";
      const words = (a.query ?? "").toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
      let found = all.filter((i) => !a.kind || i.kind === a.kind);
      if (words.length) {
        found = found
          .map((i) => {
            const hay = [i.title, i.summary, i.city, feedText(i as unknown as FeedItem, lang).title].join(" ").toLowerCase();
            return { i, hits: words.filter((w) => hay.includes(w)).length };
          })
          .filter((x) => x.hits > 0)
          .sort((x, y) => y.hits - x.hits || y.i.published - x.i.published)
          .map((x) => x.i);
      } else {
        found = fittingJobs(me, found, skip, Date.now()).map((j) => j.item);
      }
      const top = found.slice(0, 8);
      if (!top.length) return "No matching jobs in the feed right now.";
      const passport = me.passport_enabled && me.passport_token ? `Worker's passport link for the reply: ${site}/p/${me.passport_token}` : "The worker has no public passport yet.";
      return [
        `${top.length} job(s):`,
        ...top.map((i) => {
          const t = feedText(i as unknown as FeedItem, lang);
          const nl = feedText(i as unknown as FeedItem, "nl");
          const taken = skip.has(`${userId}:${i.id}`) ? " [already handled]" : "";
          return `- id ${i.id} · ${i.kind} · ${i.city ?? "?"}${i.budget ? ` · budget ${i.budget}` : ""}${i.timing ? ` · ${i.timing}` : ""}${taken}\n  ${t.title}\n  NL: ${nl.title} — ${nl.summary.slice(0, 300)}`;
        }),
        passport,
        "Only private and business jobs can be answered from the card; for permits and tenders the card opens the feed.",
      ].join("\n");
    }

    if (name === "prepare_job_reply") {
      if (cards.length >= 3) return "Already 3 reply cards in this answer.";
      const item = (await load()).find((i) => i.id === a.job_id);
      if (!item) return "Unknown job id; use an id from find_feed_jobs.";
      const draft = (a.draft_nl ?? "").trim().slice(0, 2000);
      if (!draft) return "The Dutch reply is empty.";
      const fi = item as unknown as FeedItem;
      cards.push({
        feed_item_id: item.id,
        job: { title: feedText(fi, lang).title, kind: item.kind, source: item.source, city: item.city, budget: item.budget, url: item.source_url },
        draft,
        body: [a.why?.trim(), a.meaning?.trim()].filter(Boolean).join("\n\n").slice(0, 2000),
      });
      return "Reply card prepared. It appears under your answer with the Dutch text and a «Send» button; nothing is sent until the worker taps it.";
    }

    return "Unknown tool.";
  }

  return { run, cards };
}
