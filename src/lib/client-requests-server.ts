// Server side of «Vakman gezocht»: publishing a checked client request into the feed and taking it out.

import type { SupabaseClient } from "@supabase/supabase-js";
import { FEED_TEXTS, REQUEST_DAYS, firstName, requestTexts, type ClientRequest } from "@/lib/client-requests";
import { postcodePlace } from "@/lib/collect/geo";
import { COLLECT_LANGS } from "@/lib/collect/types";
import { emailEnabled } from "@/lib/email";
import { sendFeedEmails, sendFeedPush, sendFeedTelegram } from "@/lib/feed-notify";
import { telegramEnabled } from "@/lib/telegram";

// Haaks approved the request: it goes into the feed (section «Заказы») and out to fitting builders.
export async function publishClientRequest(server: SupabaseClient, id: string, site: string) {
  const { data: req, error } = await server.from("client_requests").select("*").eq("id", id).single<ClientRequest>();
  if (error || !req) throw new Error(error?.message ?? "Request not found");
  if (req.status === "published" && req.feed_item_id) return req;

  const place = req.lat == null ? await postcodePlace(req.postcode).catch(() => null) : null;
  const lat = req.lat ?? place?.lat ?? null;
  const lng = req.lng ?? place?.lng ?? null;
  const city = req.city ?? place?.place ?? place?.gemeente ?? null;
  const texts = { ...req, city };
  const translations = Object.fromEntries(COLLECT_LANGS.map((lang) => [lang, requestTexts(texts, lang)]));
  const now = new Date();
  const expires = new Date(now.getTime() + REQUEST_DAYS * 86400000);

  const { data: item, error: insertError } = await server
    .from("feed_items")
    .insert({
      source: "client",
      source_name: `Klant · ${firstName(req.name)}`,
      kind: "private",
      title: translations.nl.title,
      summary: translations.nl.summary,
      translations,
      trades: req.trades,
      city,
      postcode: req.postcode,
      region: place?.gemeente ?? city,
      lat,
      lng,
      timing: FEED_TEXTS.nl.when[req.timing],
      budget: req.budget,
      // Contacts open only after the client chooses a builder (client_replies).
      contact: null,
      published_at: now.toISOString(),
      expires_at: expires.toISOString(),
      fingerprint: `client-${req.id}`,
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !item) throw new Error(insertError?.message ?? "Feed insert failed");

  const { error: updateError } = await server
    .from("client_requests")
    .update({ status: "published", feed_item_id: item.id, city, lat, lng, published_at: now.toISOString(), expires_at: expires.toISOString(), reject_reason: null })
    .eq("id", req.id);
  if (updateError) throw new Error(updateError.message);

  try {
    await Promise.all([
      emailEnabled() ? sendFeedEmails(server, "instant", site) : null,
      telegramEnabled() ? sendFeedTelegram(server, site) : null,
      sendFeedPush(server, site),
    ]);
  } catch (e) {
    console.error("client request: alerts failed", e instanceof Error ? e.message : e);
  }
  return req;
}

// The request leaves the feed: rejected by Haaks, or the client chose a builder / stopped.
export async function takeRequestOffline(server: SupabaseClient, req: Pick<ClientRequest, "id" | "feed_item_id">, status: "rejected" | "closed", reason?: string) {
  await server
    .from("client_requests")
    .update({ status, ...(reason ? { reject_reason: reason } : {}) })
    .eq("id", req.id);
  if (req.feed_item_id) await server.from("feed_items").update({ expires_at: new Date().toISOString() }).eq("id", req.feed_item_id);
}
