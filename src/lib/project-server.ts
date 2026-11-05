import type { SupabaseClient } from "@supabase/supabase-js";
import type { Receipt } from "@/lib/orders";
import type { ProjectInvoice, ProjectQuote, ProjectTrip } from "@/lib/project";

const QUOTE_COLS = "id, order_id, status, lines, number, title, accepted_at, created_at, updated_at, sent_at, viewed_at";
const INVOICE_COLS = "id, order_id, number, status, lines, vat_mode, due_date, invoice_date, paid_at, created_at";
const TRIP_COLS = "id, order_id, day, km, from_label, to_label";

type WithOrder<T> = T & { order_id: string | null };

// Everything linked to the builder's orders, one query per kind. Pass one order id for its page.
export async function loadProjectParts(supabase: SupabaseClient, userId: string, orderId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scope = (q: any) => (orderId ? q.eq("order_id", orderId) : q.not("order_id", "is", null));
  type Res<T> = Promise<{ data: T[] | null }>;
  const [quotes, invoices, receipts, trips, reviews, works] = await Promise.all([
    scope(supabase.from("quotes").select(QUOTE_COLS).eq("user_id", userId)).order("created_at", { ascending: false }) as Res<WithOrder<ProjectQuote>>,
    scope(supabase.from("invoices").select(INVOICE_COLS).eq("user_id", userId)).order("invoice_date", { ascending: false }) as Res<WithOrder<ProjectInvoice>>,
    (orderId
      ? supabase.from("receipts").select("*").eq("user_id", userId).eq("order_id", orderId)
      : supabase.from("receipts").select("*").eq("user_id", userId)
    )
      .order("created_at", { ascending: false })
      .limit(2000)
      .returns<Receipt[]>(),
    scope(supabase.from("trips").select(TRIP_COLS).eq("user_id", userId)).order("day", { ascending: false }) as Res<WithOrder<ProjectTrip>>,
    scope(supabase.from("reviews").select("order_id").eq("worker_id", userId)) as Res<{ order_id: string | null }>,
    scope(supabase.from("works").select("order_id").eq("user_id", userId)) as Res<{ order_id: string | null }>,
  ]);
  const by = <T extends { order_id: string | null }>(rows: T[] | null) => {
    const map = new Map<string, T[]>();
    for (const r of rows ?? []) if (r.order_id) map.set(r.order_id, [...(map.get(r.order_id) ?? []), r]);
    return map;
  };
  return {
    quotes: by(quotes.data),
    invoices: by(invoices.data),
    receipts: by(receipts.data),
    allReceipts: receipts.data ?? [],
    trips: by(trips.data),
    reviewed: new Set((reviews.data ?? []).flatMap((r) => (r.order_id ? [r.order_id] : []))),
    worked: new Set((works.data ?? []).flatMap((r) => (r.order_id ? [r.order_id] : []))),
  };
}
