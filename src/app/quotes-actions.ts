"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cleanDate } from "@/lib/extract";
import { isLang, type Lang } from "@/lib/i18n";
import { createQuoteDraft } from "@/lib/quote-draft";
import { cleanLines, dutchToday, MAX_QUOTE_PHOTOS, money, PHOTO_MIME, short, type Quote } from "@/lib/quotes";
import { createServerAccountClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/dashboard/quotes", "layout");
  revalidatePath("/dashboard/orders", "layout");
}

// Called after the browser has uploaded the site photos to the user's storage folder.
export async function generateQuote(input: {
  orderId: string | null;
  description: string;
  photos: { path: string; mimeType: string }[];
  hourlyRate: number;
  vatRate: number;
}): Promise<{ id: string }> {
  const { supabase, user } = await requireUser();
  const description = short(input.description, 4000);
  const photos = input.photos
    .filter((p) => p.path.startsWith(`${user.id}/quotes/`) && PHOTO_MIME.includes(p.mimeType))
    .slice(0, MAX_QUOTE_PHOTOS);
  const hourlyRate = money(input.hourlyRate);
  const vatRate = [21, 9, 0].includes(Number(input.vatRate)) ? Number(input.vatRate) : 21;
  if (!description && !photos.length) throw new Error("Empty request");

  const [{ data: profile }, { data: order }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", user.id).single(),
    input.orderId
      ? supabase.from("orders").select("id, title, client_name, address").eq("id", input.orderId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";

  await supabase.from("profiles").update({ hourly_rate: hourlyRate || null }).eq("id", user.id);

  const id = await createQuoteDraft(supabase, user.id, lang, {
    orderId: order?.id ?? null,
    title: order?.title ?? null,
    clientName: order?.client_name ?? null,
    address: order?.address ?? null,
    description,
    photos: photos.map((p) => ({
      path: p.path,
      mimeType: p.mimeType,
      base64: async () => {
        const { data: blob, error } = await supabase.storage.from("documents").download(p.path);
        if (error || !blob) throw error ?? new Error("Download failed");
        return Buffer.from(await blob.arrayBuffer()).toString("base64");
      },
    })),
    hourlyRate,
    vatRate,
  });

  refresh();
  return { id };
}

// "Send to client" on the quote page: the worker sends the message from their own phone;
// this only marks the quote as sent, so the client can press "Akkoord" on the link.
export async function markQuoteSent(id: string) {
  const { supabase } = await requireUser();
  await supabase
    .from("quotes")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  refresh();
  revalidatePath("/dashboard/leads", "layout");
}

export async function saveQuote(
  id: string,
  data: Pick<Quote, "title" | "client_name" | "client_address" | "intro" | "terms" | "valid_until" | "lines">,
) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("quotes")
    .update({
      title: short(data.title, 200) || "Offerte",
      client_name: short(data.client_name, 200) || null,
      client_address: short(data.client_address, 300) || null,
      intro: short(data.intro, 3000) || null,
      terms: short(data.terms, 3000) || null,
      valid_until: cleanDate(data.valid_until),
      lines: cleanLines(data.lines),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Quote save failed", error);
    return { ok: false as const };
  }
  refresh();
  return { ok: true as const };
}

export async function setQuoteStatus(id: string, status: Quote["status"]) {
  const { supabase } = await requireUser();
  if (!["draft", "sent", "accepted", "declined"].includes(status)) return;
  await supabase
    .from("quotes")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "accepted" ? {} : { accepted_at: null, accepted_name: null }),
    })
    .eq("id", id);
  refresh();
  revalidatePath("/dashboard/leads", "layout");
}

export async function deleteQuote(id: string) {
  const { supabase } = await requireUser();
  const { data: quote } = await supabase.from("quotes").select("photo_paths").eq("id", id).single();
  if (!quote) return;
  if (quote.photo_paths?.length) await supabase.storage.from("documents").remove(quote.photo_paths);
  await supabase.from("quotes").delete().eq("id", id);
  refresh();
  redirect("/dashboard/quotes");
}

// The client accepts from the public link; no login, so the token is the only key.
export async function acceptQuote(token: string, formData: FormData) {
  const name = short(formData.get("name"), 200);
  if (!name) return;
  const admin = await createServerAccountClient();
  const today = dutchToday();
  await admin
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_name: name })
    .eq("public_token", token)
    .eq("status", "sent")
    .or(`valid_until.is.null,valid_until.gte.${today}`);
  revalidatePath(`/q/${token}`);
}
