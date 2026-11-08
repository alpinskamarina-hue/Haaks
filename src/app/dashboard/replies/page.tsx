import Link from "next/link";
import { getHelperDict } from "@/lib/helper-i18n";
import { MyReplies } from "@/components/MyReplies";
import { getClientCardDict, type ClientCardDict } from "@/lib/client-request-i18n";
import type { MyClientReply } from "@/lib/client-requests";
import { tradeLabel } from "@/lib/feed";
import type { Lang } from "@/lib/i18n";
import { catalogActive, getReplyDict, type MyInvite, type MyReply } from "@/lib/job-replies";
import { loadWorkspace } from "@/lib/workspace";

export default async function MyRepliesPage() {
  const { supabase, profile, lang } = await loadWorkspace();
  const catalog = profile as typeof profile & { in_catalog?: boolean; catalog_until?: string | null };
  const [{ data: replies }, { data: invites }, { data: clientRows }] = await Promise.all([
    supabase.rpc("my_job_replies"),
    supabase.rpc("my_invites"),
    supabase.rpc("my_client_replies"),
  ]);
  const mine = ((clientRows ?? []) as MyClientReply[])
    .filter((r) => r.my_status)
    .sort((a, b) => (b.replied_at ?? "").localeCompare(a.replied_at ?? ""));
  return (
    <MyReplies
      replies={(replies ?? []) as MyReply[]}
      invites={(invites ?? []) as MyInvite[]}
      inCatalog={catalogActive(catalog)}
      catalogUntil={catalog.catalog_until ?? null}
      rt={getReplyDict(lang)}
      helper={getHelperDict(lang)}
      top={mine.length > 0 ? <ClientReplies rows={mine} t={getClientCardDict(lang)} lang={lang} /> : null}
    />
  );
}

// Replies to private clients' jobs: the client's contacts show once the client chose me.
function ClientReplies({ rows, t, lang }: { rows: MyClientReply[]; t: ClientCardDict; lang: Lang }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">🏠 {t.myTitle}</h2>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.feed_item_id} className={`rounded-xl border bg-white p-4 ${r.my_status === "chosen" ? "border-2 border-green-600" : "border-slate-200"}`}>
            <p className="font-semibold">
              {r.trades.map((tr) => tradeLabel(tr, lang)).join(", ")}
              {r.city ? ` · ${r.city}` : ""}
            </p>
            {r.my_status === "chosen" ? (
              <div className="mt-2 rounded-xl bg-green-50 p-3">
                <p className="font-semibold text-green-800">🎉 {t.chosen}</p>
                <p className="text-sm text-green-900">
                  {t.clientContact}: {r.client_name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.client_phone && (
                    <a href={`tel:${r.client_phone.replace(/\s/g, "")}`} className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white">
                      📞 {t.call} {r.client_phone}
                    </a>
                  )}
                  {r.client_email && (
                    <a href={`mailto:${r.client_email}`} className="rounded-xl border border-green-600 bg-white px-4 py-2 font-semibold text-green-700">
                      ✉️ {t.mail}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm ${r.my_status === "sent" ? "bg-purple-50 text-purple-800" : "bg-slate-100 text-slate-500"}`}>
                {r.my_status === "sent" ? (r.request_open ? `⏳ ${t.sent}` : t.closed) : t.notChosen}
              </p>
            )}
            {r.request_open && (
              <Link href={`/dashboard/leads/feed#job-${r.feed_item_id}`} className="ml-3 text-sm text-slate-500 underline">
                {t.replied.replace("{n}", String(r.replies)).replace("{max}", "5")}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
