import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { claudeEnabled } from "@/lib/env";
import { LANG_NAMES, type Lang } from "@/lib/i18n";

// What Haaks knows about one firm. Facts come from its website; texts are per language.
export type FirmAbout = {
  site: "ok" | "none" | "failed";
  since: number | null;
  employees: string | null;
  hires_zzp: boolean;
  vacancies: boolean;
  texts: Partial<Record<Lang, { summary: string; works: string[] }>>;
};

export type FirmForAbout = { id: string; name: string; website: string | null; categories: string[] | null; about: FirmAbout | null; about_at: string | null };

const RETRY_DAYS = 7;
const MODEL = "claude-haiku-5-5";

async function fetchHtml(url: string) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; Haaks)", accept: "text/html" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return "";
    return (await res.text()).slice(0, 600_000);
  } catch {
    return "";
  }
}

function toText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Links on the home page to "about us" and "jobs" pages of the same site.
function subpages(html: string, base: URL) {
  const links = [...html.matchAll(/href="([^"#]+)"/gi)].map((m) => m[1]);
  const pick = (re: RegExp) => {
    for (const href of links) {
      if (!re.test(href)) continue;
      try {
        const u = new URL(href, base);
        if (u.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "")) return u.toString();
      } catch {}
    }
    return null;
  };
  return {
    about: pick(/over-?ons|wie-?zijn-?wij|about|het-?bedrijf|ons-?bedrijf/i),
    jobs: pick(/vacature|werken-?bij|careers|jobs|werkenbij/i),
  };
}

const SINCE = /(?:sinds|opgericht(?:\s+in)?|since|founded(?:\s+in)?|al\s+sinds)\s+(?:het\s+jaar\s+)?(19[0-9]{2}|20[0-2][0-9])/i;
const ZZP = /\b(zzp(?:'?ers?)?|onderaannemers?|freelancers?|zelfstandigen)\b/i;

async function readSite(website: string) {
  const base = new URL(website);
  if (!/^https?:$/.test(base.protocol)) return null;
  const home = await fetchHtml(base.toString());
  if (!home) return null;
  const { about, jobs } = subpages(home, base);
  const [aboutHtml, jobsHtml] = await Promise.all([about ? fetchHtml(about) : "", jobs ? fetchHtml(jobs) : ""]);
  const text = [toText(home), toText(aboutHtml), toText(jobsHtml)].join("\n\n").slice(0, 14_000);
  const year = Number(text.match(SINCE)?.[1]) || null;
  return {
    text,
    since: year && year <= new Date().getFullYear() ? year : null,
    vacancies: Boolean(jobs) || /\bvacatures?\b/i.test(text),
    hires_zzp: ZZP.test(text),
  };
}

const Summary = z.object({
  summary: z.string(),
  works: z.array(z.string()),
  employees: z.string().nullable(),
  since: z.number().int().nullable(),
  hires_zzp: z.boolean(),
});

let client: Anthropic | null = null;

async function summarize(name: string, text: string, lang: Lang) {
  client ??= new Anthropic();
  const res = await client.messages.parse({
    model: MODEL,
    // Haiku 5.5 thinks by default: leave room for thinking before the answer.
    max_tokens: 8000,
    output_config: { effort: "low", format: zodOutputFormat(Summary) },
    system:
      "You help foreign construction workers (ZZP) in the Netherlands decide whether to offer their services to a building firm. " +
      "You get the text of the firm's website. Use only what the text says; never guess. " +
      `Write in ${LANG_NAMES[lang]}, in plain short words. ` +
      "summary: 2-3 sentences: what the firm builds or repairs, where, and for which clients. " +
      "works: up to 6 short items of the kinds of work they do (e.g. tiling, roofs, kitchens). " +
      "employees: team size only if the text states it (e.g. '10-25', 'about 40'), otherwise null. " +
      "since: founding year only if stated, otherwise null. " +
      "hires_zzp: true only if the text says they work with ZZP'ers, subcontractors (onderaannemers) or freelancers.",
    messages: [{ role: "user", content: `Firm: ${name}\n\nWebsite text:\n${text}` }],
  });
  if (res.stop_reason !== "end_turn") console.error("firm-about: stop", res.stop_reason, name);
  return res.stop_reason === "refusal" ? null : (res.parsed_output ?? null);
}

// Returns the firm card for this language, reading the website and asking AI on first view.
// The result is stored on the firm by the server account, so every next builder gets it at once.
export async function loadFirmAbout(server: SupabaseClient, firm: FirmForAbout, lang: Lang): Promise<FirmAbout> {
  const stale = !firm.about_at || Date.now() - Date.parse(firm.about_at) > RETRY_DAYS * 86_400_000;
  let about = firm.about;
  if (about && about.site !== "ok" && !stale) return about;
  if (about?.site === "ok" && about.texts[lang]) return about;

  let siteText: string | null = null;
  if (!about || about.site !== "ok") {
    const read = firm.website ? await readSite(firm.website).catch(() => null) : null;
    about = read
      ? { site: "ok", since: read.since, employees: null, hires_zzp: read.hires_zzp, vacancies: read.vacancies, texts: {} }
      : { site: firm.website ? "failed" : "none", since: null, employees: null, hires_zzp: false, vacancies: false, texts: {} };
    siteText = read?.text ?? null;
  } else if (firm.website) {
    siteText = (await readSite(firm.website).catch(() => null))?.text ?? null;
  }

  if (about.site === "ok" && siteText && claudeEnabled()) {
    const ai = await summarize(firm.name, siteText, lang).catch((e) => {
      console.error("firm-about: AI failed", firm.name, e instanceof Error ? e.message : e);
      return null;
    });
    if (ai) {
      about = {
        ...about,
        since: about.since ?? ai.since,
        employees: about.employees ?? ai.employees,
        hires_zzp: about.hires_zzp || ai.hires_zzp,
        texts: { ...about.texts, [lang]: { summary: ai.summary, works: ai.works.slice(0, 6) } },
      };
    }
  }

  await server.from("nearby_firms").update({ about, about_at: new Date().toISOString() }).eq("id", firm.id);
  return about;
}
