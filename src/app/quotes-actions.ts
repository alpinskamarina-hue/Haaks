"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cleanDate, draftQuote } from "@/lib/extract";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import { addDays, DEFAULT_TERMS_NL, LINE_KINDS, MAX_QUOTE_PHOTOS, PHOTO_MIME, type Quote, type QuoteLine } from "@/lib/quotes";
import { createAdminClient } from "@/lib/supabase/server";


type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

function refresh() {
  revalidatePath("/dashboard/quotes", "layout");
  revalidatePath("/dashboard/orders", "layout");
}

const money = (v: unknown) => {
  const n = Number(typeof v === "string" ? v.replace(",", ".") : v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const short = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanLines(lines: unknown): QuoteLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.slice(0, 100).map((l) => ({
    kind: (LINE_KINDS as readonly string[]).includes(l?.kind) ? l.kind : "other",
    description: short(l?.description, 500),
    quantity: money(l?.quantity),
    unit: short(l?.unit, 20) || "stuk",
    unit_price: money(l?.unit_price),
    vat_rate: [21, 9, 0].includes(Number(l?.vat_rate)) ? Number(l.vat_rate) : 21,
  }));
}

// OFF-2026-001, OFF-2026-002, ... per worker and year.
async function nextNumber(supabase: Supabase, userId: string) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("number", `OFF-${year}-%`);
  return `OFF-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
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
  const t = getDict(lang);

  await supabase.from("profiles").update({ hourly_rate: hourlyRate || null }).eq("id", user.id);

  // Without AI the worker still gets an editable quote with one labour line.
  let draft: { title: string; intro: string | null; lines: QuoteLine[]; notes: string[] } = {
    title: order?.title ?? "Offerte",
    intro: null,
    lines: [
      { kind: "labour", description: "Arbeid", quantity: 1, unit: "uur", unit_price: hourlyRate, vat_rate: vatRate },
    ],
    notes: [t.aiUnavailable],
  };

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const files = await Promise.all(
        photos.map(async (p) => {
          const { data: blob, error } = await supabase.storage.from("documents").download(p.path);
          if (error || !blob) throw error ?? new Error("Download failed");
          return { base64: Buffer.from(await blob.arrayBuffer()).toString("base64"), mimeType: p.mimeType };
        }),
      );
      const result = await draftQuote({
        description,
        photos: files,
        hourlyRate,
        vatRate,
        clientName: order?.client_name ?? null,
        address: order?.address ?? null,
        lang,
      });
      if (!result) throw new Error("No result");
      draft = { title: result.title, intro: result.intro, lines: cleanLines(result.lines), notes: result.notes };
    } catch (err) {
      console.error("Quote draft failed", err);
      draft.notes = [t.draftFailed];
    }
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      user_id: user.id,
      order_id: order?.id ?? null,
      number: await nextNumber(supabase, user.id),
      title: short(draft.title, 200) || "Offerte",
      client_name: order?.client_name ?? null,
      client_address: order?.address ?? null,
      intro: draft.intro,
      terms: DEFAULT_TERMS_NL,
      lines: draft.lines,
      work_description: description || null,
      photo_paths: photos.map((p) => p.path),
      ai_notes: draft.notes.map((n) => short(n, 500)).filter(Boolean),
      valid_until: addDays(30),
    })
    .select("id")
    .single();
  if (error || !quote) throw new Error(error?.message ?? "Insert failed");

  refresh();
  return { id: quote.id };
}

export async function saveQuote(
  id: string,
  data: Pick<Quote, "title" | "client_name" | "client_address" | "intro" | "terms" | "valid_until" | "lines">,
) {
  const { supabase } = await requireUser();
  await supabase
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
  refresh();
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
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  await admin
    .from("quotes")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_name: name })
    .eq("public_token", token)
    .eq("status", "sent")
    .or(`valid_until.is.null,valid_until.gte.${today}`);
  revalidatePath(`/q/${token}`);
}
