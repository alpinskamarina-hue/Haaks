// «Для бухгалтера»: everything of one calendar quarter that the accountant needs for the btw return,
// checked for the questions an accountant usually comes back with.

import type { SupabaseClient } from "@supabase/supabase-js";
import { invoiceTotals, type Invoice } from "./invoices";
import type { Receipt } from "./orders";
import { dutchToday } from "./quotes";
import { KM_RATE, toNum, type CarType, type Trip } from "./trips";

export type Quarter = { year: number; q: number; key: string; start: string; end: string };

export function quarterFromKey(key: string | undefined, today = dutchToday()): Quarter {
  const m = key?.match(/^(\d{4})-([1-4])$/);
  const year = m ? Number(m[1]) : Number(today.slice(0, 4));
  const q = m ? Number(m[2]) : Math.floor((Number(today.slice(5, 7)) - 1) / 3) + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad((q - 1) * 3 + 1)}-01`;
  const end = q === 4 ? `${year + 1}-01-01` : `${year}-${pad(q * 3 + 1)}-01`;
  return { year, q, key: `${year}-${q}`, start, end };
}

// The current quarter and the three before it, newest last.
export function recentQuarters(today = dutchToday()): Quarter[] {
  const now = quarterFromKey(undefined, today);
  return [3, 2, 1, 0].map((back) => {
    const n = now.year * 4 + (now.q - 1) - back;
    return quarterFromKey(`${Math.floor(n / 4)}-${(n % 4) + 1}`);
  });
}

// The btw return is due at the end of the month after the quarter (Q4: 31 January).
export function vatDeadline(q: Quarter) {
  const next = new Date(`${q.end}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(0);
  return next.toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 864e5);

export type QuarterData = Awaited<ReturnType<typeof loadQuarter>>;

export async function loadQuarter(supabase: SupabaseClient, userId: string, q: Quarter, car: CarType | null) {
  const [{ data: inv }, { data: rec }, { data: tr }, { data: yearInv }] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", userId).gte("invoice_date", q.start).lt("invoice_date", q.end).order("invoice_date").returns<Invoice[]>(),
    supabase.from("receipts").select("*").eq("user_id", userId).order("purchased_on", { ascending: true }).returns<Receipt[]>(),
    supabase.from("trips").select("*").eq("user_id", userId).gte("day", q.start).lt("day", q.end).order("day").returns<Trip[]>(),
    supabase.from("invoices").select("number, status").eq("user_id", userId).like("number", `${q.year}-%`).returns<{ number: string; status: string }[]>(),
  ]);
  const all = inv ?? [];
  const invoices = all.filter((i) => i.status !== "draft");
  const drafts = all.filter((i) => i.status === "draft");
  const receipts = (rec ?? []).filter((r) => {
    const day = r.purchased_on ?? r.created_at.slice(0, 10);
    return day >= q.start && day < q.end;
  });
  const trips = tr ?? [];

  // Sales: btw charged per rate, and turnover without btw (verlegd, KOR).
  const byRate = new Map<number, { base: number; vat: number }>();
  let reverse = 0;
  let kor = 0;
  let salesIncl = 0;
  for (const i of invoices) {
    const t = invoiceTotals(i.lines, i.vat_mode);
    salesIncl += t.incl;
    if (i.vat_mode === "reverse") reverse += t.excl;
    else if (i.vat_mode === "kor") kor += t.excl;
    else
      for (const l of t.vatLines) {
        const e = byRate.get(l.rate) ?? { base: 0, vat: 0 };
        byRate.set(l.rate, { base: e.base + l.base, vat: e.vat + l.vat });
      }
  }
  const salesVat = [...byRate.values()].reduce((s, x) => s + x.vat, 0);
  const purchaseIncl = receipts.reduce((s, r) => s + toNum(r.total_incl_vat), 0);
  const purchaseVat = receipts.reduce((s, r) => s + toNum(r.vat_total), 0);
  const km = trips.reduce((s, t) => s + toNum(t.km), 0);
  const kmMoney = car === "business" || car === "van_no_private" ? null : Math.round(km * KM_RATE * 100) / 100;

  // What the accountant would ask about.
  const today = dutchToday();
  const unread = receipts.filter((r) => r.ai_status !== "done" || r.total_incl_vat === null);
  const notCompany = receipts.filter((r) => r.addressed_to_company === false);
  const noOrder = receipts.filter((r) => !r.order_id);
  const unpaid = invoices.filter((i) => i.status === "sent" && daysBetween(i.due_date ?? i.invoice_date, today) > 0);
  const nums = (yearInv ?? [])
    .map((x) => Number(x.number.match(new RegExp(`^${q.year}-(\\d+)$`))?.[1]))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let k = 1; k < nums.length; k++) for (let n = nums[k - 1]! + 1; n < nums[k]!; n++) gaps.push(n);

  return {
    invoices,
    drafts,
    receipts,
    trips,
    sales: { incl: salesIncl, vat: salesVat, byRate: [...byRate.entries()].sort((a, b) => b[0] - a[0]), reverse, kor },
    purchases: { incl: purchaseIncl, vat: purchaseVat },
    km,
    kmMoney,
    toPay: Math.round((salesVat - purchaseVat) * 100) / 100,
    checks: { unread, notCompany, noOrder, unpaid, gaps: gaps.slice(0, 5), drafts },
  };
}

// Dutch spreadsheet style: «;» between columns, comma decimals, UTF-8 with BOM so Excel reads accents.
export function csv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "number" ? v.toFixed(2).replace(".", ",") : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}
