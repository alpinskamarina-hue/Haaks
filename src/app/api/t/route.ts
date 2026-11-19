import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { BOT, cleanPath, isOwnHost, refHost, sourceOf } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

// The site's own page-view counter (admin page «Аналитика»). No cookies; the visitor is a
// daily hash of IP + browser, so nobody can be followed from day to day and no IP is stored.
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return NextResponse.json({ ok: false });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false });
  }
  const rawPath = str(body.path, 300);
  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("/api") || rawPath.startsWith("/zz")) return NextResponse.json({ ok: false });
  const path = cleanPath(rawPath);
  const host = refHost(str(body.referrer, 500));
  const external = host && !isOwnHost(host) ? host : null;
  const utmSource = str(body.utm_source, 60);
  const entry = body.entry === true;
  const source = entry ? sourceOf(external, utmSource, path) : null;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const salt = process.env.CRON_SECRET ?? process.env.HAAKS_SERVER_PASSWORD ?? "haaks";
  const visitor = createHash("sha256").update(`${day}|${ip}|${ua}|${salt}`).digest("hex").slice(0, 16);
  const campaign = entry ? (str(body.utm_campaign, 80) ?? (str(body.ref, 60) ? `ref:${str(body.ref, 60)}` : null)) : null;
  const firstSource = str(body.first_source, 40) ?? source;
  const firstCampaign = str(body.first_campaign, 80) ?? campaign;

  try {
    const supabase = await createClient();
    await supabase.rpc("track_view", {
      p: {
        path,
        visitor,
        entry,
        source,
        ref_host: entry ? external : null,
        utm_source: entry ? utmSource : null,
        utm_medium: entry ? str(body.utm_medium, 60) : null,
        utm_campaign: campaign,
        first_source: firstSource,
        first_campaign: firstCampaign,
        country: request.headers.get("x-vercel-ip-country"),
        lang: str(body.lang, 5)?.toLowerCase().slice(0, 2) ?? null,
        device: /mobile|android|iphone/i.test(ua) ? "mobile" : /ipad|tablet/i.test(ua) ? "tablet" : "desktop",
      },
    });
  } catch (err) {
    console.error("track: failed", err instanceof Error ? err.message : err);
  }
  // The browser keeps the first source it ever came from, so a later sign-up can be credited to it.
  return NextResponse.json({ ok: true, source, campaign });
}
