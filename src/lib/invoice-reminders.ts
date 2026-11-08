import type { SupabaseClient } from "@supabase/supabase-js";
import { isLang, type Lang } from "@/lib/i18n";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { getInvoicesDict } from "@/lib/invoices-i18n";
import { euro } from "@/lib/orders";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { fill } from "@/lib/quotes-i18n";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

type Due = {
  invoice_id: string;
  user_id: string;
  number: string;
  client_name: string | null;
  lines: Invoice["lines"];
  vat_mode: Invoice["vat_mode"];
  overdue: number;
  stage: 7 | 14;
};
type Worker = { id: string; language: string | null; telegram_chat_id: number | null };

// Daily: 7 and 14 days after the due date of a sent, unpaid invoice, the builder gets a push and a
// Telegram message «счёт не оплачен — отправить напоминание?» that opens the invoice with the ready
// Dutch reminder. The database picks the invoices and logs each stage once (take_invoice_reminders).
export async function sendInvoiceReminders(server: SupabaseClient, site: string) {
  const { data, error } = await server.rpc("take_invoice_reminders");
  const due = (data ?? []) as Due[];
  if (error) return { error: error.message };
  if (!due.length) return { due: 0, sent: 0 };

  const { data: workers } = await server
    .from("profiles")
    .select("id, language, telegram_chat_id")
    .in("id", [...new Set(due.map((d) => d.user_id))])
    .returns<Worker[]>();
  const byId = new Map((workers ?? []).map((w) => [w.id, w]));

  let sent = 0;
  for (const d of due) {
    const worker = byId.get(d.user_id);
    if (!worker) continue;
    const iv = getInvoicesDict(isLang(worker.language) ? (worker.language as Lang) : "en");
    const title = iv.autoTitle;
    const body = fill(d.stage === 14 ? iv.autoBody14 : iv.autoBody7, {
      client: d.client_name || iv.client,
      number: d.number,
      sum: euro(invoiceTotals(d.lines ?? [], d.vat_mode).incl),
      n: d.overdue,
    });
    const path = `/dashboard/invoices/${d.invoice_id}`;
    let ok = false;
    if (pushEnabled()) {
      const { data: subs } = await server
        .from("push_subscriptions")
        .select("endpoint, user_id, p256dh, auth")
        .eq("user_id", d.user_id)
        .returns<PushSubscriptionRow[]>();
      for (const sub of subs ?? []) {
        const result = await sendPush(sub, { title, body, url: path, tag: `invoice-due-${d.invoice_id}` });
        if (result.ok) ok = true;
        if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
    if (telegramEnabled() && worker.telegram_chat_id) {
      await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(title)}</b>\n${esc(body)}`, { text: iv.title, url: `${site}${path}` });
      ok = true;
    }
    if (ok) sent++;
  }
  return { due: due.length, sent };
}
