import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { SubmitButton } from "@/components/SubmitButton";
import { hideFeedItem } from "@/app/feed-actions";
import { getTripsDict } from "@/lib/trips-i18n";
import { getHomeDict } from "@/lib/home-i18n";
import { fill, getFeedDict } from "@/lib/feed-i18n";
import { feedText, timeAgo, tradeLabel } from "@/lib/feed";
import { FIT_SCORE, loadFeed, newFittingCount, type ScoredFeedItem } from "@/lib/feed-server";
import { docStatus, readiness, REQUIREMENTS, type DocumentRow } from "@/lib/documents";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { euro, type Order } from "@/lib/orders";
import { addDays, dutchToday, quoteTotals, type Quote } from "@/lib/quotes";
import { daysSince } from "@/lib/quotes-i18n";
import type { Lang } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { completeness, withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// Real jobs before signals (permits, tenders).
const KIND_ORDER: ScoredFeedItem["kind"][] = ["private", "business", "permit", "tender"];

type Todo = { key: string; icon: string; text: string; href: string; button: string; warn?: boolean };

// Home: jobs for you and what needs doing today, then the rest of the work.
export default async function Home() {
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const worker = withDefaults(profile as unknown as Partial<WorkerProfile>);
  // First visit after sign-up: the four profile questions (they can be skipped).
  if (!worker.onboarded_at) redirect("/dashboard/onboarding");
  // Name and phone are required; older accounts are asked for them once.
  if (!profile.full_name?.trim() || !profile.phone?.trim()) redirect("/dashboard/onboarding?step=0&edit=1&must=1");

  const extra = profile as typeof profile & { feed_seen_at?: string | null; telegram_chat_id?: number | null };
  const [{ data: quoteRows }, { data: invoiceRows }, { data: docs }, { data: current }, feed, { count: pushCount }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, status, title, client_name, lines, updated_at, accepted_at, sent_at, viewed_at")
        .eq("user_id", user.id)
        .returns<(Pick<Quote, "id" | "status" | "title" | "client_name" | "lines" | "updated_at" | "accepted_at"> & { sent_at: string | null; viewed_at: string | null })[]>(),
      supabase
        .from("invoices")
        .select("id, number, status, lines, vat_mode, due_date, quote_id, client_name, paid_at")
        .eq("user_id", user.id)
        .returns<Pick<Invoice, "id" | "number" | "status" | "lines" | "vat_mode" | "due_date" | "quote_id" | "client_name" | "paid_at">[]>(),
      supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<DocumentRow[]>(),
      profile.current_order_id
        ? supabase.from("orders").select("*").eq("id", profile.current_order_id).maybeSingle<Order>()
        : Promise.resolve({ data: null }),
      loadFeed(supabase, user.id, profile).catch(() => null),
      supabase.from("push_subscriptions").select("endpoint", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
  const feedDict = getFeedDict(lang);
  const h = getHomeDict(lang);

  const quotes = quoteRows ?? [];
  const invoices = invoiceRows ?? [];
  const unpaid = invoices.filter((i) => i.status === "sent");
  const today = dutchToday();
  const overdue = unpaid.filter((i) => i.due_date && i.due_date < today);
  const ready = readiness(profile, docs ?? []);
  const readyCount = REQUIREMENTS.filter((r) => ready[r]).length;
  const firstName = profile.full_name?.split(" ")[0];
  const w = getWorkerDict(lang);
  const filled = completeness(worker, (docs ?? []).filter((d) => d.doc_type === "kvk_extract")).percent;

  // Jobs for you: the two best fitting jobs the worker has not hidden or taken yet.
  const feedItems = feed?.items ?? [];
  const newJobs = newFittingCount(feedItems, extra.feed_seen_at);
  const topJobs = feedItems
    .filter((i) => i.score >= FIT_SCORE && !i.action)
    .sort(
      (a, b) =>
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        b.added_at.localeCompare(a.added_at) ||
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )
    .slice(0, 2);

  // To do: built from quotes, invoices and documents, most urgent first.
  const clientOf = (name: string | null) => name?.trim() || h.client;
  const invoicedQuotes = new Set(invoices.map((i) => i.quote_id).filter(Boolean));
  const todos: Todo[] = [];
  for (const i of overdue) {
    todos.push({
      key: `inv-${i.id}`,
      icon: "🧾",
      text: fill(h.todoOverdue, { number: i.number, n: daysSince(`${i.due_date}T12:00:00`), sum: euro(invoiceTotals(i.lines, i.vat_mode).incl) }),
      href: `/dashboard/invoices/${i.id}`,
      button: h.todoRemind,
      warn: true,
    });
  }
  for (const q of quotes) {
    if (q.status === "accepted" && !invoicedQuotes.has(q.id) && q.accepted_at && daysSince(q.accepted_at) <= 60) {
      todos.push({ key: `acc-${q.id}`, icon: "🤝", text: fill(h.todoAccepted, { client: clientOf(q.client_name) }), href: `/dashboard/quotes/${q.id}`, button: h.todoInvoice });
    }
  }
  for (const q of quotes) {
    const days = q.status === "sent" ? daysSince(q.sent_at ?? q.updated_at) : 0;
    if (days >= 3 && days <= 30) {
      todos.push({
        key: `quote-${q.id}`,
        icon: "📄",
        text: fill(q.viewed_at ? h.todoViewed : h.todoSent, { client: clientOf(q.client_name), n: days }),
        href: `/dashboard/quotes/${q.id}`,
        button: h.todoRemind,
      });
    }
  }
  // Only the newest document of each kind counts: a renewed one replaces the old.
  const seenTypes = new Set<string>();
  for (const d of docs ?? []) {
    if (d.doc_type === "other" || seenTypes.has(d.doc_type)) continue;
    seenTypes.add(d.doc_type);
    const status = docStatus(d);
    if (status === "valid") continue;
    const doc = t[`docType_${d.doc_type}` as keyof typeof t] as string;
    const date = d.expires_on ? new Date(d.expires_on).toLocaleDateString(lang, { day: "numeric", month: "short" }) : "";
    todos.push({
      key: `doc-${d.id}`,
      icon: "🪪",
      text: status === "kvk_old" ? h.todoKvkOld : fill(status === "expired" ? h.todoExpired : h.todoExpires, { doc, date }),
      href: "/dashboard/passport",
      button: h.todoRenew,
      warn: status === "expired",
    });
  }

  // Trips: early in the month, ask for the odometer reading (only builders who log trips).
  if (Number(today.slice(8)) <= 7) {
    const monthStart = `${today.slice(0, 8)}01`;
    const [{ count: tripCount }, { count: odoCount }] = await Promise.all([
      supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("day", addDays(-60)),
      supabase.from("odometer_readings").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("read_on", monthStart),
    ]);
    if (tripCount && !odoCount) {
      todos.push({ key: "odometer", icon: "🚗", text: getTripsDict(lang).todoOdo, href: "/dashboard/trips", button: h.open });
    }
  }

  // First steps for newcomers: shown until all five are done.
  const hasDoc = (type: string) => (docs ?? []).some((d) => d.doc_type === type);
  const steps = [
    { label: h.stepName, done: true, href: "/dashboard/onboarding?step=0&edit=1&back=settings" },
    { label: h.stepTrades, done: worker.trades.length > 0 && !!(worker.city || profile.city), href: "/dashboard/settings#feed" },
    { label: h.stepNotify, done: (pushCount ?? 0) > 0 || !!extra.telegram_chat_id, href: "/dashboard/settings#notify" },
    { label: h.stepDocs, done: hasDoc("kvk_extract") && hasDoc("vca"), href: "/dashboard/passport" },
    { label: h.stepQuote, done: quotes.length > 0, href: "/dashboard/quotes/new" },
  ];
  const stepsDone = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  // Money: paid this month, waiting for payment, open in sent quotes.
  const month = today.slice(0, 7);
  const earned = invoices
    .filter((i) => i.status === "paid" && (i.paid_at ?? "").slice(0, 7) === month)
    .reduce((sum, i) => sum + invoiceTotals(i.lines, i.vat_mode).incl, 0);
  const stats: { href: string; label: string; value: string; note?: string; warn?: boolean }[] = [
    { href: "/dashboard/invoices", label: h.earned, value: euro(earned) },
    {
      href: "/dashboard/invoices",
      label: h.waiting,
      value: euro(unpaid.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).incl, 0)),
      note: overdue.length ? t.homeOverdue.replace("{n}", String(overdue.length)) : undefined,
      warn: overdue.length > 0,
    },
    {
      href: "/dashboard/quotes",
      label: h.inQuotes,
      value: euro(quotes.filter((q) => q.status === "sent").reduce((s, q) => s + quoteTotals(q.lines).incl, 0)),
    },
  ];

  const actions: { href: string; label: string; icon: IconName }[] = [
    { href: "/dashboard/quotes/new", label: h.actQuote, icon: "quote" },
    { href: "/dashboard/invoices", label: h.actInvoice, icon: "invoice" },
    { href: current ? `/dashboard/orders/${current.id}` : "/dashboard/orders", label: h.actReceipt, icon: "camera" },
    { href: "/dashboard/orders", label: h.actOrder, icon: "orders" },
  ];

  const more = [
    { href: "/dashboard/cards", icon: "💳", label: h.cards },
    { href: "/dashboard/trips", icon: "🚗", label: h.trips },
    { href: "/dashboard/passport", icon: "🪪", label: h.passport, note: `${readyCount}/${REQUIREMENTS.length}` },
    { href: "/dashboard/materials", icon: "🧱", label: h.materials },
    { href: "/dashboard/helpers", icon: "👷", label: h.helpers },
    { href: "/dashboard/reviews", icon: "⭐", label: h.reviews },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{firstName ? t.homeHello.replace("{name}", firstName) : t.navHome}</h1>
        <p className="text-slate-600">{t.homeSubtitle}</p>
      </div>

      {nextStep ? (
        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">🚀 {h.stepsTitle}</h2>
            <span className="text-sm font-semibold text-orange-800">{fill(h.stepsDone, { n: stepsDone, total: steps.length })}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-orange-500" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-3 space-y-1.5">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/70">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      s.done ? "bg-green-600 text-white" : "border-2 border-orange-400 bg-white text-orange-600"
                    }`}
                  >
                    {s.done ? "✓" : ""}
                  </span>
                  <span className={`min-w-0 flex-1 ${s.done ? "text-slate-500 line-through" : "font-medium text-slate-900"}`}>{s.label}</span>
                  {s === nextStep && (
                    <span className="shrink-0 rounded-lg bg-orange-600 px-3 py-1 text-sm font-semibold text-white">{h.stepDo}</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        filled < 100 && (
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 hover:border-orange-300"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{w.homeNudge.replace("{p}", String(filled))}</p>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: `${filled}%` }} />
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">{w.homeNudgeButton}</span>
          </Link>
        )
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">🔥 {h.jobsTitle}</h2>
            {newJobs > 0 && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">{fill(h.jobsNew, { n: newJobs })}</span>
            )}
          </div>
          {topJobs.length === 0 ? (
            <div className="space-y-3">
              <p className="text-slate-600">{h.jobsEmpty}</p>
              <Link href="/dashboard/settings#feed" className="inline-block text-sm font-semibold text-orange-700 underline">
                ⚙️ {h.jobsSetup}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {topJobs.map((job) => (
                <JobRow key={job.id} job={job} lang={lang} h={h} lockedTitle={fill(feedDict.lockedTitle, { city: job.city ?? "—" })} />
              ))}
            </ul>
          )}
          <Link href="/dashboard/leads/feed" className="mt-3 block text-center text-sm font-semibold text-orange-700 hover:underline">
            {h.jobsAll} →
          </Link>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">✅ {h.todoTitle}</h2>
          {todos.length === 0 ? (
            <p className="text-slate-600">👍 {h.todoEmpty}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todos.slice(0, 6).map((todo) => (
                <li key={todo.key} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl" aria-hidden>
                    {todo.icon}
                  </span>
                  <p className={`min-w-0 flex-1 text-sm ${todo.warn ? "font-medium text-red-700" : "text-slate-800"}`}>{todo.text}</p>
                  <Link
                    href={todo.href}
                    className="shrink-0 rounded-lg border border-orange-600 px-3 py-1.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    {todo.button}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center gap-1 min-w-0 break-words rounded-xl bg-orange-600 px-0.5 py-3 text-center text-[11px] font-semibold text-white shadow-sm hover:bg-orange-700 sm:text-sm"
          >
            <Icon name={a.icon} className="h-6 w-6" />
            {a.label}
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`${card} !p-3 hover:border-orange-300 sm:!p-4`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-1 whitespace-nowrap text-base font-bold sm:text-2xl">{s.value}</p>
            {s.note && <p className={`text-xs ${s.warn ? "text-red-700" : "text-slate-500"}`}>{s.note}</p>}
          </Link>
        ))}
      </section>

      <section className={card}>
        <h2 className="text-sm font-medium text-slate-500">🔨 {t.currentOrder}</h2>
        {current ? (
          <Link href={`/dashboard/orders/${current.id}`} className="mt-1 block">
            <p className="text-lg font-semibold">{current.title}</p>
            <p className="text-sm text-slate-600">{[current.client_name, current.address].filter(Boolean).join(" · ")}</p>
          </Link>
        ) : (
          <p className="mt-1 text-sm text-slate-600">{t.noCurrentOrder}</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">{h.more}</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {more.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="flex flex-col items-center gap-1 min-w-0 break-words rounded-xl border border-slate-200 bg-white px-0.5 py-3 text-center text-[11px] font-medium text-slate-700 shadow-sm hover:border-orange-300 sm:text-sm"
            >
              <span className="text-2xl" aria-hidden>
                {x.icon}
              </span>
              {x.label}
              {x.note && <span className="text-[11px] font-semibold text-orange-700">{x.note}</span>}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

// One job in «Jobs for you»: a locked card (free plan, first 24 hours) shows only city and trades.
function JobRow({ job, lang, h, lockedTitle }: { job: ScoredFeedItem; lang: Lang; h: ReturnType<typeof getHomeDict>; lockedTitle: string }) {
  const { title } = feedText(job, lang);
  const meta = [
    job.city,
    job.distance !== null ? fill(h.km, { n: job.distance }) : null,
    job.trades.map((tr) => tradeLabel(tr, lang)).join(", "),
    timeAgo(job.added_at, lang),
  ].filter(Boolean);
  return (
    <li className="rounded-xl border border-slate-200 p-3">
      <p className="font-semibold leading-snug">{job.locked ? `🔒 ${lockedTitle}` : title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{meta.join(" · ")}</p>
      <div className="mt-2 flex gap-2">
        <Link
          href={`/dashboard/leads/feed#job-${job.id}`}
          className="flex-1 rounded-lg bg-orange-600 px-3 py-1.5 text-center text-sm font-semibold text-white hover:bg-orange-700"
        >
          {h.open}
        </Link>
        <form action={hideFeedItem.bind(null, job.id, "")}>
          <SubmitButton className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-60">{h.hide}</SubmitButton>
        </form>
      </div>
    </li>
  );
}
