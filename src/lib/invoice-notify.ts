import type { SupabaseClient } from "@supabase/supabase-js";
import { isLang, type Lang } from "@/lib/i18n";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { getInvoicesDict } from "@/lib/invoices-i18n";
import { euro } from "@/lib/orders";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { fill } from "@/lib/quotes-i18n";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// The client opened the invoice link for the first time: tell the builder on their phone and in Telegram.
export async function notifyInvoiceViewed(server: SupabaseClient, invoiceId: string, siteUrl: string) {
  const { data: invoice } = await server.from("invoices").select("user_id, number, client_name, lines, vat_mode").eq("id", invoiceId).single();
  if (!invoice) return;
  const { data: worker } = await server.from("profiles").select("language, telegram_chat_id").eq("id", invoice.user_id).single();
  if (!worker) return;
  const iv = getInvoicesDict(isLang(worker.language) ? (worker.language as Lang) : "en");
  const body = fill(iv.pushBody, {
    client: invoice.client_name || iv.client,
    number: invoice.number,
    sum: euro(invoiceTotals((invoice.lines ?? []) as Invoice["lines"], invoice.vat_mode as Invoice["vat_mode"]).incl),
  });
  const path = `/dashboard/invoices/${invoiceId}`;

  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", invoice.user_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: iv.pushTitle, body, url: path, tag: `invoice-${invoiceId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(iv.pushTitle)}</b>\n${esc(body)}`, { text: iv.title, url: `${siteUrl}${path}` });
  }
}
