import type { SupabaseClient } from "@supabase/supabase-js";
import { aiAllowed } from "@/lib/free-limits";
import { draftQuote } from "@/lib/extract";
import { getDict, type Lang } from "@/lib/i18n";
import { addDays, cleanLines, DEFAULT_TERMS_NL, dutchToday, money, short, type QuoteLine } from "@/lib/quotes";

// OFF-2026-001, OFF-2026-002, ... per worker and year.
export async function nextQuoteNumber(supabase: SupabaseClient, userId: string) {
  const year = dutchToday().slice(0, 4);
  const { data } = await supabase.from("quotes").select("number").eq("user_id", userId).like("number", `OFF-${year}-%`);
  // Highest number + 1, so a deleted quote does not make the next number repeat.
  const max = Math.max(0, ...(data ?? []).map((q) => Number(q.number.split("-")[2]) || 0));
  return `OFF-${year}-${String(max + 1).padStart(3, "0")}`;
}

// Makes a draft quote: AI writes the lines when it is switched on, otherwise one labour
// line at the worker's rate that they price themselves. Used by the quote form and by
// "Make offer" on a job.
export async function createQuoteDraft(
  supabase: SupabaseClient,
  userId: string,
  lang: Lang,
  input: {
    orderId: string | null;
    title: string | null;
    // Dutch text for the client when AI is off, e.g. the job's own summary.
    intro?: string | null;
    clientName: string | null;
    address: string | null;
    description: string;
    photos: { path: string; base64: () => Promise<string>; mimeType: string }[];
    hourlyRate: number;
    vatRate: number;
  },
) {
  const t = getDict(lang);
  const hourlyRate = money(input.hourlyRate);
  let draft: { title: string; intro: string | null; lines: QuoteLine[]; notes: string[] } = {
    title: input.title ?? "Offerte",
    intro: input.intro ?? null,
    lines: [
      { kind: "labour", description: "Arbeid", quantity: 1, unit: "uur", unit_price: hourlyRate, vat_rate: input.vatRate },
    ],
    notes: [],
  };

  if (await aiAllowed(supabase)) {
    try {
      const files = await Promise.all(
        input.photos.map(async (p) => ({ base64: await p.base64(), mimeType: p.mimeType })),
      );
      const result = await draftQuote({
        description: input.description,
        photos: files,
        hourlyRate,
        vatRate: input.vatRate,
        clientName: input.clientName,
        address: input.address,
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
      user_id: userId,
      order_id: input.orderId,
      number: await nextQuoteNumber(supabase, userId),
      title: short(draft.title, 200) || "Offerte",
      client_name: input.clientName,
      client_address: input.address,
      intro: draft.intro,
      terms: DEFAULT_TERMS_NL,
      lines: draft.lines,
      work_description: input.description || null,
      photo_paths: input.photos.map((p) => p.path),
      ai_notes: draft.notes.map((n) => short(n, 500)).filter(Boolean),
      valid_until: addDays(30),
    })
    .select("id")
    .single();
  if (error || !quote) throw new Error(error?.message ?? "Insert failed");
  return quote.id as string;
}
