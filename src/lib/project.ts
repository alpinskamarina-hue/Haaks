import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { totals, type Order, type Receipt } from "@/lib/orders";
import { quoteTotals, dutchToday, type Quote } from "@/lib/quotes";
import { KM_RATE } from "@/lib/trips";

// An order seen as a project: which stage it is in, what it brings in, and what to do next.
// Everything is derived from the quotes, invoices, receipts and trips already linked to it.

export type ProjectQuote = Pick<Quote, "id" | "status" | "lines" | "number" | "title" | "accepted_at" | "created_at" | "updated_at"> & {
  sent_at?: string | null;
  viewed_at?: string | null;
};
export type ProjectInvoice = Pick<Invoice, "id" | "number" | "status" | "lines" | "vat_mode" | "due_date" | "invoice_date" | "paid_at" | "created_at">;
export type ProjectTrip = { id: string; day: string; km: number | string; from_label: string; to_label: string };

export const STAGES = ["quote", "agreed", "work", "done", "paid"] as const;
export type Stage = (typeof STAGES)[number];
export type Group = "work" | "pay" | "done";

export type NextStep = {
  kind: "overdue" | "awaitPay" | "noAnswer" | "sendQuote" | "makeQuote" | "invoice" | "review" | "work";
  href: string;
  tone: "info" | "warn" | "bad";
  n?: number;
  date?: string;
};

export type ProjectSummary = {
  stage: Stage;
  group: Group;
  price: number | null;
  priceKind: "accepted" | "offered" | "invoiced" | null;
  materials: number;
  receiptCount: number;
  km: number;
  tripsCost: number;
  earned: number | null;
  invoicedOpen: number;
  next: NextStep | null;
};

// The last sign of life on a sent quote: when it was sent or when the client last opened it.
const lastTouch = (q: ProjectQuote) => [q.sent_at ?? q.updated_at, q.viewed_at ?? ""].sort().at(-1)!;
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) / 864e5);

export function summarize(p: {
  order: Order;
  quotes: ProjectQuote[];
  invoices: ProjectInvoice[];
  receipts: Receipt[];
  trips: ProjectTrip[];
  hasReview: boolean;
  hasWork: boolean;
}): ProjectSummary {
  const today = dutchToday();
  const { order, quotes, receipts, trips } = p;
  const invoices = p.invoices;
  const accepted = quotes.find((q) => q.status === "accepted");
  const offered = quotes.find((q) => q.status === "sent") ?? quotes.find((q) => q.status === "draft");
  const sentInvoices = invoices.filter((i) => i.status !== "draft");
  const unpaid = sentInvoices.filter((i) => i.status === "sent");
  const paid = sentInvoices.filter((i) => i.status === "paid");
  const invoicedExcl = sentInvoices.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).excl, 0);

  // Money without btw: what the client pays the builder minus what the job cost them.
  let price: number | null = null;
  let priceKind: ProjectSummary["priceKind"] = null;
  if (accepted) {
    price = quoteTotals(accepted.lines).excl;
    priceKind = "accepted";
  } else if (sentInvoices.length) {
    price = invoicedExcl;
    priceKind = "invoiced";
  } else if (offered) {
    price = quoteTotals(offered.lines).excl;
    priceKind = "offered";
  }
  const sum = totals(receipts);
  const km = trips.reduce((s, t) => s + (Number(t.km) || 0), 0);
  const tripsCost = Math.round(km * KM_RATE * 100) / 100;
  const earned = priceKind && priceKind !== "offered" && price !== null ? Math.round((price - sum.excl - tripsCost) * 100) / 100 : null;

  const busy = receipts.length > 0 || trips.length > 0;
  const allPaid = paid.length > 0 && unpaid.length === 0 && (order.status === "closed" || !accepted || invoicedExcl >= quoteTotals(accepted.lines).excl - 0.01);
  const stage: Stage = allPaid
    ? "paid"
    : unpaid.length || order.status === "closed"
      ? "done"
      : accepted
        ? busy
          ? "work"
          : "agreed"
        : quotes.length || !busy
          ? "quote"
          : "work";
  const group: Group = unpaid.length ? "pay" : stage === "paid" || order.status === "closed" ? "done" : "work";

  // The one thing to do next, most urgent first.
  let next: NextStep | null = null;
  const overdue = unpaid.find((i) => i.due_date && i.due_date < today);
  if (overdue) next = { kind: "overdue", href: `/dashboard/invoices/${overdue.id}`, tone: "bad", n: days(overdue.due_date!, today) };
  else if (unpaid[0]) next = { kind: "awaitPay", href: `/dashboard/invoices/${unpaid[0].id}`, tone: "info", date: unpaid[0].due_date ?? undefined };
  else if (!accepted && offered?.status === "sent" && days(lastTouch(offered), today) >= 3)
    next = { kind: "noAnswer", href: `/dashboard/quotes/${offered.id}`, tone: "warn", n: days(lastTouch(offered), today) };
  else if (!accepted && offered?.status === "draft") next = { kind: "sendQuote", href: `/dashboard/quotes/${offered.id}`, tone: "info" };
  else if (!accepted && !quotes.length && !sentInvoices.length && order.status === "open")
    next = { kind: "makeQuote", href: `/dashboard/quotes/new?order=${order.id}`, tone: "info" };
  else if (accepted && order.status === "open" && !sentInvoices.length)
    next = { kind: "invoice", href: `/dashboard/invoices?order=${order.id}`, tone: "info" };
  else if (stage === "paid" || order.status === "closed") {
    if (!p.hasReview) next = { kind: "review", href: `/dashboard/orders/${order.id}#review`, tone: "info" };
    else if (!p.hasWork) next = { kind: "work", href: `/dashboard/works/new?order=${order.id}`, tone: "info" };
  }

  return {
    stage,
    group,
    price,
    priceKind,
    materials: Math.round(sum.excl * 100) / 100,
    receiptCount: sum.count,
    km: Math.round(km),
    tripsCost,
    earned,
    invoicedOpen: unpaid.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).incl, 0),
    next,
  };
}

export type ProjectEvent = { at: string; icon: string; key: string; vars: Record<string, string>; href?: string };

// What happened on the project, newest first.
export function projectEvents(p: {
  order: Order;
  quotes: ProjectQuote[];
  invoices: ProjectInvoice[];
  receipts: Receipt[];
  trips: ProjectTrip[];
  euro: (n: number) => string;
  photos?: { kind: string; created_at: string }[];
  notes?: { body: string; created_at: string }[];
  kindLabel?: (k: string) => string;
}): ProjectEvent[] {
  const ev: ProjectEvent[] = [{ at: p.order.created_at, icon: "📁", key: "evCreated", vars: {} }];
  for (const q of p.quotes) {
    const href = `/dashboard/quotes/${q.id}`;
    const vars = { number: q.number, sum: p.euro(quoteTotals(q.lines).incl) };
    ev.push({ at: q.created_at, icon: "📝", key: "evQuoteMade", vars, href });
    if (q.sent_at) ev.push({ at: q.sent_at, icon: "📤", key: "evQuoteSent", vars, href });
    if (q.viewed_at) ev.push({ at: q.viewed_at, icon: "👀", key: "evQuoteViewed", vars, href });
    if (q.accepted_at) ev.push({ at: q.accepted_at, icon: "✅", key: "evAccepted", vars, href });
  }
  for (const i of p.invoices) {
    const href = `/dashboard/invoices/${i.id}`;
    const vars = { number: i.number, sum: p.euro(invoiceTotals(i.lines, i.vat_mode).incl) };
    if (i.status !== "draft") ev.push({ at: i.invoice_date, icon: "🧾", key: "evInvoiceSent", vars, href });
    if (i.paid_at) ev.push({ at: i.paid_at, icon: "💶", key: "evPaid", vars, href });
  }
  for (const r of p.receipts) {
    ev.push({
      at: r.purchased_on ?? r.created_at,
      icon: "🛒",
      key: "evReceipt",
      vars: { shop: r.store_name ?? "", sum: r.total_incl_vat !== null ? p.euro(Number(r.total_incl_vat)) : "" },
    });
  }
  // Photos of one kind on one day become a single line.
  const groups = new Map<string, { at: string; kind: string; n: number }>();
  for (const ph of p.photos ?? []) {
    const key = `${ph.created_at.slice(0, 10)}|${ph.kind}`;
    const g = groups.get(key);
    if (g) {
      g.n += 1;
      if (ph.created_at > g.at) g.at = ph.created_at;
    } else groups.set(key, { at: ph.created_at, kind: ph.kind, n: 1 });
  }
  for (const g of groups.values())
    ev.push({ at: g.at, icon: "📸", key: "evPhotos", vars: { kind: p.kindLabel?.(g.kind) ?? g.kind, n: String(g.n) }, href: "?tab=photos" });
  for (const n of p.notes ?? []) {
    const text = n.body.replace(/\s+/g, " ");
    ev.push({ at: n.created_at, icon: "📝", key: "evNote", vars: { text: text.length > 60 ? `${text.slice(0, 57)}…` : text }, href: "?tab=notes" });
  }
  for (const t of p.trips) ev.push({ at: t.day, icon: "🚗", key: "evTrip", vars: { km: String(Math.round(Number(t.km))), to: t.to_label } });
  return ev.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
