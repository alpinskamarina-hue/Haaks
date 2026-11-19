import Link from "next/link";
import { SOURCE_LABELS } from "@/lib/analytics";
import { LANG_NAMES, isLang } from "@/lib/i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";

// The admin page «Аналитика»: visits, sources, pages, funnel and new people. In Russian.
export type Stats = {
  visitors: number;
  visitors_prev: number;
  views: number;
  views_prev: number;
  signups: number;
  signups_prev: number;
  live: number;
  live_list: { country: string | null; path: string; at: string }[];
  days: { day: string; visitors: number; signups: number }[];
  sources: { source: string; visitors: number; signups: number }[];
  campaigns: { campaign: string; visitors: number; signups: number }[];
  refs: { ref_host: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
  langs: { lang: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  pages: { path: string; views: number; visitors: number; entries: number }[];
  cabinet_pages: { path: string; views: number; users: number }[];
  funnel: { visitors: number; signups: number; profile: number; first_doc: number; trial: number; paid: number };
  actions: { feed_opens: number; replies: number; quotes: number; invoices: number; orders: number; staff: number; active_users: number };
  people: { created_at: string; full_name: string | null; language: string | null; trades: string[] | null; city: string | null; plan: string | null; account_type: string | null; onboarded: boolean; src: string | null }[];
  total_users: number;
  people_langs: { lang: string; n: number }[];
  people_trades: { trade: string; n: number }[];
  people_cities: { city: string; n: number }[];
  since: string | null;
};

export const TABS = [
  ["overview", "Обзор"],
  ["sources", "Источники"],
  ["pages", "Страницы"],
  ["funnel", "Воронка"],
  ["people", "Люди"],
] as const;
export const PERIODS = [
  ["today", "Сегодня"],
  ["7", "7 дней"],
  ["30", "30 дней"],
  ["all", "Всё"],
] as const;
export type Tab = (typeof TABS)[number][0];
export type Period = (typeof PERIODS)[number][0];

const PAGE_NAMES: Record<string, string> = {
  "/": "Главная (лендинг)",
  "/pricing": "Тарифы",
  "/vakman-gezocht": "Найти мастера (клиенты)",
  "/privacy": "Конфиденциальность",
  "/terms": "Условия",
  "/cookies": "Cookies",
  "/job/…": "Заказ по ссылке «Поделиться»",
  "/p/…": "ZZP-паспорт мастера",
  "/q/…": "Предложение для клиента",
  "/f/…": "Счёт для клиента",
  "/m/…": "Список материалов",
  "/r/…": "Форма отзыва",
  "/klus/…": "Страница клиента «Найти мастера»",
  "/u/…": "Профиль @ник",
  "/@…": "Профиль @ник",
  "/company": "Кабинет фирмы",
  "/dashboard": "Кабинет: главная",
  "/dashboard/leads/feed": "Кабинет: лента",
  "/dashboard/staff": "Кабинет: цифровой сотрудник",
  "/dashboard/quotes": "Кабинет: предложения",
  "/dashboard/invoices": "Кабинет: счета",
  "/dashboard/orders": "Кабинет: заказы",
  "/dashboard/passport": "Кабинет: паспорт",
  "/dashboard/settings": "Кабинет: настройки",
  "/dashboard/onboarding": "Кабинет: первые шаги",
};

const nf = new Intl.NumberFormat("ru-RU");
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "—");
const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🌐";
const COUNTRY = new Intl.DisplayNames(["ru"], { type: "region" });
const countryName = (c: string) => (/^[A-Z]{2}$/.test(c) ? (COUNTRY.of(c) ?? c) : "Неизвестно");
const sourceName = (s: string | null) => SOURCE_LABELS[s ?? "direct"] ?? `🌐 ${s}`;
const langName = (l: string | null) => (l && isLang(l) ? LANG_NAMES[l] : l && l !== "??" ? l : "Неизвестно");
const dateRu = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

function Delta({ now, prev, show }: { now: number; prev: number; show: boolean }) {
  if (!show || (!now && !prev)) return null;
  const diff = now - prev;
  if (diff === 0) return <span className="text-xs font-bold text-slate-400">= как раньше</span>;
  const up = diff > 0;
  const text = prev ? `${Math.abs(Math.round((diff / prev) * 100))}%` : nf.format(Math.abs(diff));
  return <span className={`text-xs font-bold ${up ? "text-green-600" : "text-red-600"}`}>{up ? "▲" : "▼"} {text}</span>;
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
    </section>
  );
}

function Bars({ rows, color }: { rows: { label: string; value: number; extra?: string }[]; color: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-slate-500">Пока нет данных.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2">
          <span className="truncate">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
          </span>
          <span className="whitespace-nowrap text-right tabular-nums text-slate-700">
            {nf.format(r.value)}
            {r.extra && <span className="text-slate-400"> · {r.extra}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function List({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Пока нет данных.</p>;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`} className="flex justify-between gap-3 py-1.5">
          <span className="min-w-0 truncate">{r.label}</span>
          <span className="shrink-0 tabular-nums text-slate-700">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView({ s, failed, tab, period }: { s: Stats | null; failed: boolean; tab: Tab; period: Period }) {
  const href = (next: { tab?: Tab; period?: Period }) => `/dashboard/analytics?tab=${next.tab ?? tab}&period=${next.period ?? period}`;
  const compare = period !== "all";
  const trades = getWorkerDict("ru").trades as Record<string, string>;

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">📊 Аналитика</h1>
        <p className="text-sm text-slate-500">
          Видно только вам.{" "}
          {s?.since ? `Заходы на сайт считаются с ${dateRu(s.since)}` : "Заходы на сайт начнут считаться с первого посетителя."}
        </p>
      </div>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, label]) => (
          <Link
            key={k}
            href={href({ tab: k })}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm ${k === tab ? "border-slate-900 bg-slate-900 font-semibold text-white" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1 text-sm">
        {PERIODS.map(([k, label]) => (
          <Link key={k} href={href({ period: k })} className={`rounded-lg py-1.5 text-center ${k === period ? "bg-white font-bold shadow-sm" : "text-slate-600"}`}>
            {label}
          </Link>
        ))}
      </div>

      {(failed || !s) && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Не удалось загрузить статистику. Обновите страницу.</p>}

      {s && tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Посетители", s.visitors, s.visitors_prev],
              ["Просмотры страниц", s.views, s.views_prev],
              ["Регистрации", s.signups, s.signups_prev],
            ].map(([label, now, prev]) => (
              <div key={label as string} className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-bold tabular-nums">{nf.format(now as number)}</p>
                <Delta now={now as number} prev={prev as number} show={compare} />
              </div>
            ))}
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-xs text-slate-500">Конверсия в регистрацию</p>
              <p className="text-2xl font-bold">{pct(s.signups, s.visitors)}</p>
              <span className="text-xs text-slate-400">регистрации / посетители</span>
            </div>
          </div>
          <Card title={period === "today" ? "Сегодня" : "По дням: посетители и регистрации"}>
            <div className="flex h-32 items-end gap-0.5">
              {s.days.map((d) => {
                const max = Math.max(1, ...s.days.map((x) => x.visitors));
                return (
                  <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.visitors} посетит., ${d.signups} рег.`}>
                    {d.signups > 0 && <span className="mb-0.5 text-center text-[10px] font-bold text-green-700">+{d.signups}</span>}
                    <span className="block rounded-t bg-orange-400" style={{ height: `${Math.max(2, (d.visitors / max) * 100)}%` }} />
                  </div>
                );
              })}
            </div>
            {s.days.length > 1 && (
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>{s.days[0].day.slice(8, 10)}.{s.days[0].day.slice(5, 7)}</span>
                <span>{s.days[s.days.length - 1].day.slice(8, 10)}.{s.days[s.days.length - 1].day.slice(5, 7)}</span>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Столбик: посетители за день. Зелёное число: регистрации.</p>
          </Card>
          <Card title={`Сейчас на сайте: ${s.live}`} note="Кто открывал страницы за последние 5 минут.">
            <List rows={s.live_list.map((l) => ({ label: `${flag(l.country)} ${PAGE_NAMES[l.path] ?? l.path}`, value: new Date(l.at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }) }))} />
          </Card>
        </>
      )}

      {s && tab === "sources" && (
        <>
          <Card title="Откуда пришли: посетители · регистрации" note="Регистрация засчитывается источнику, с которого человек впервые пришёл на сайт.">
            <Bars color="bg-blue-500" rows={s.sources.map((x) => ({ label: sourceName(x.source), value: x.visitors, extra: `${x.signups} рег.` }))} />
          </Card>
          <Card
            title="Ваши метки (кампании)"
            note="Добавляйте метку к ссылке в рекламе или посте, например haaks-nl.vercel.app/?ref=fb-polska или ?utm_source=facebook&utm_campaign=noyabr. Тогда здесь будет видно, сколько людей пришло именно оттуда."
          >
            <List rows={s.campaigns.map((c) => ({ label: c.campaign.replace(/^ref:/, ""), value: `${nf.format(c.visitors)} · ${c.signups} рег.` }))} />
          </Card>
          <Card title="Сайты, с которых перешли">
            <List rows={s.refs.map((r) => ({ label: r.ref_host, value: nf.format(r.visitors) }))} />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Страны">
              <List rows={s.countries.map((c) => ({ label: `${flag(c.country)} ${countryName(c.country)}`, value: pct(c.visitors, s.visitors) }))} />
            </Card>
            <Card title="Язык телефона / браузера">
              <List rows={s.langs.map((l) => ({ label: langName(l.lang), value: pct(l.visitors, s.visitors) }))} />
            </Card>
          </div>
          <Card title="Устройства">
            <List rows={s.devices.map((d) => ({ label: d.device === "mobile" ? "📱 Телефон" : d.device === "tablet" ? "📲 Планшет" : "💻 Компьютер", value: pct(d.visitors, s.visitors) }))} />
          </Card>
        </>
      )}

      {s && tab === "pages" && (
        <>
          <Card title="Страницы сайта: просмотры · с них начали" note="«С них начали» — сколько раз человек пришёл на сайт именно на эту страницу.">
            <List rows={s.pages.map((p) => ({ label: PAGE_NAMES[p.path] ?? p.path, value: `${nf.format(p.views)} · ${nf.format(p.entries)}` }))} />
          </Card>
          <Card title="Кабинет: что открывают (просмотры · людей)">
            <List rows={s.cabinet_pages.map((p) => ({ label: PAGE_NAMES[p.path] ?? p.path.replace("/dashboard", "Кабинет:"), value: `${nf.format(p.views)} · ${p.users}` }))} />
          </Card>
        </>
      )}

      {s && tab === "funnel" && (
        <>
          <Card title="Воронка" note="Регистрации и шаги после неё считаются по людям, которые зарегистрировались в этот период.">
            <div className="space-y-3">
              {(
                [
                  ["Зашли на сайт", s.funnel.visitors, "bg-slate-900"],
                  ["Зарегистрировались", s.funnel.signups, "bg-orange-600"],
                  ["Заполнили профиль", s.funnel.profile, "bg-orange-500"],
                  ["Сделали первый счёт или предложение", s.funnel.first_doc, "bg-green-600"],
                  ["Начали пробный Ultra", s.funnel.trial, "bg-violet-600"],
                  ["Платят", s.funnel.paid, "bg-fuchsia-700"],
                ] as const
              ).map(([label, n, color], i, all) => {
                const top = Math.max(1, all[0][1]);
                return (
                  <div key={label}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-semibold">{label}</span>
                      <span className="font-bold tabular-nums">{nf.format(n)}</span>
                    </div>
                    <div className={`mt-0.5 h-3 rounded-full ${color}`} style={{ width: `${Math.max(2, (n / top) * 100)}%` }} />
                    {i > 0 && <p className="mt-0.5 text-[11px] text-slate-500">{pct(n, all[i - 1][1])} от предыдущего шага</p>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Что делают в кабинете">
            <List
              rows={[
                { label: "Активных пользователей (заходили)", value: nf.format(s.actions.active_users) },
                { label: "Открыли ленту", value: nf.format(s.actions.feed_opens) },
                { label: "Отклики на заказы фирм", value: nf.format(s.actions.replies) },
                { label: "Предложения / счета / заказы", value: `${s.actions.quotes} / ${s.actions.invoices} / ${s.actions.orders}` },
                { label: "Сообщения цифровому сотруднику", value: nf.format(s.actions.staff) },
              ]}
            />
          </Card>
        </>
      )}

      {s && tab === "people" && (
        <>
          <Card title={`Новые пользователи за период: ${s.people.length}`} note={`Всего пользователей: ${s.total_users}.`}>
            {s.people.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {s.people.map((p, i) => (
                  <li key={i} className="py-2">
                    <p className="font-semibold">
                      {p.full_name || "Без имени"} {p.account_type === "company" && <span className="rounded bg-purple-100 px-1.5 text-xs text-purple-800">фирма</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dateRu(p.created_at)} · {langName(p.language)} · {p.city || "город не указан"} · {(p.trades ?? []).map((t) => trades[t] ?? t).join(", ") || "профессии не указаны"} · тариф {p.plan ?? "free"} · {p.onboarded ? "профиль заполнен" : "профиль не заполнен"} · {p.src ? sourceName(p.src) : "источник неизвестен"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">За этот период новых нет.</p>
            )}
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Языки (все пользователи)">
              <Bars color="bg-orange-500" rows={s.people_langs.map((l) => ({ label: langName(l.lang), value: l.n }))} />
            </Card>
            <Card title="Профессии">
              <Bars color="bg-green-600" rows={s.people_trades.map((t) => ({ label: trades[t.trade] ?? t.trade, value: t.n }))} />
            </Card>
          </div>
          <Card title="Города">
            <Bars color="bg-sky-500" rows={s.people_cities.map((c) => ({ label: c.city, value: c.n }))} />
          </Card>
        </>
      )}
    </main>
  );
}
