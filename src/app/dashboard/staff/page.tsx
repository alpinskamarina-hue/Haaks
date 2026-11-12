/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StaffChat, type ShownStaffMessage } from "@/components/StaffChat";
import { getStaffDraftDict } from "@/lib/staff-draft-i18n";
import type { StaffDraft } from "@/lib/staff-tools";
import type { StaffProfileChange } from "@/lib/staff-profile";
import { getStaffDocDict, getStaffOrderDict, getStaffPriceDict, getStaffProfileDict, getStaffWorkDict } from "@/lib/staff-profile-i18n";
import type { StaffWorkChange } from "@/lib/staff-works";
import { monthLabel } from "@/lib/works";
import type { StaffOrderChange } from "@/lib/staff-orders";
import type { StaffTips } from "@/lib/staff-tips";
import type { StaffPriceChange } from "@/lib/staff-prices";
import { docView, profileRows } from "@/lib/staff-profile-view";
import type { StaffDocChange } from "@/lib/staff-passport";
import { SubmitButton } from "@/components/SubmitButton";
import { planOf } from "@/lib/plans";
import { faceUrl, staffOf, type StaffMessage } from "@/lib/staff";
import type { StaffJob } from "@/lib/staff-feed";
import { getStaffDict, getStaffFeedDict } from "@/lib/staff-i18n";
import { getStaffRateDict } from "@/lib/staff-rate-i18n";
import { loadWorkspace, signedUrls } from "@/lib/workspace";
import { startUltraTrial } from "../../plan-actions";
import { clearStaffChat } from "../../staff-actions";

// «Цифровой сотрудник» (Ultra): chat with the worker's own AI employee.
export default async function StaffPage() {
  const { supabase, user, profile, lang } = await loadWorkspace();
  const d = getStaffDict(lang);
  const extra = profile as typeof profile & { plan?: string | null; plan_until?: string | null; trial_started_at?: string | null };
  const staff = staffOf(profile as Parameters<typeof staffOf>[0]);
  const face = faceUrl(staff.face);

  if (planOf(extra) !== "ultra") {
    return (
      <main className="mx-auto max-w-md px-4 py-8 text-center">
        <img src={face} alt="" className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-orange-200" />
        <h1 className="mt-4 text-2xl font-bold">{d.lockedTitle}</h1>
        <p className="mt-2 text-slate-600">{d.lockedText}</p>
        <ul className="mt-5 space-y-2 text-left text-sm">
          {d.lockedPoints.map((p) => (
            <li key={p} className="rounded-xl bg-white p-3 shadow-sm">
              {p}
            </li>
          ))}
        </ul>
        {!extra.trial_started_at && planOf(extra) === "free" && (
          <form action={startUltraTrial} className="mt-6">
            <SubmitButton className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white">{d.tryTrial}</SubmitButton>
          </form>
        )}
        <Link href="/pricing" className="mt-3 block rounded-xl border border-slate-300 px-4 py-3 font-semibold">
          {d.seePlans}
        </Link>
      </main>
    );
  }

  const { data } = await supabase
    .from("staff_messages")
    .select("id, role, body, image_path, image_paths, created_at, feed_item_id, draft, job, job_status, action, action_status, action_ref")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<(StaffMessage & { feed_item_id: string | null; draft: string | null; job: StaffJob | null; job_status: ShownStaffMessage["jobStatus"]; action: StaffDraft | StaffProfileChange | StaffDocChange | StaffOrderChange | StaffTips | StaffPriceChange | StaffWorkChange | null; action_status: string | null; action_ref: string | null })[]>();
  const rows = (data ?? []).reverse();
  const answerIds = rows.filter((m) => m.role === "staff" && !m.job).map((m) => m.id);
  const [urls, { data: ratings }] = await Promise.all([
    signedUrls(supabase, rows.flatMap((m) => [...(m.image_path ? [m.image_path] : []), ...(m.image_paths ?? []), ...(m.action?.type === "work" ? [...m.action.before, ...m.action.after] : [])])),
    answerIds.length
      ? supabase.from("staff_feedback").select("message_id, rating").in("message_id", answerIds).returns<{ message_id: string; rating: 1 | -1 }[]>()
      : Promise.resolve({ data: [] as { message_id: string; rating: 1 | -1 }[] }),
  ]);
  const profileDict = getStaffProfileDict(lang);
  const ratingOf = new Map((ratings ?? []).map((r) => [r.message_id, r.rating]));
  const messages: ShownStaffMessage[] = rows.map((m) => ({
    id: m.id,
    role: m.role,
    body: m.body,
    imageUrl: m.image_path ? (urls.get(m.image_path) ?? null) : null,
    imageUrls: (m.image_paths ?? []).flatMap((p) => urls.get(p) ?? []),
    workCard:
      m.action?.type === "work"
        ? {
            title: m.action.title,
            description: m.action.description,
            meta: [m.action.city, m.action.month ? monthLabel(`${m.action.month}-01`, lang) : ""].filter(Boolean).join(" · "),
            orderTitle: m.action.order_title,
            before: m.action.before.flatMap((p) => urls.get(p) ?? []),
            after: m.action.after.flatMap((p) => urls.get(p) ?? []),
            doneHref: m.action_status === "done" && m.action_ref ? `/dashboard/works/${m.action_ref}` : null,
          }
        : null,
    job: m.job,
    draft: m.draft,
    jobStatus: m.job_status,
    feedItemId: m.feed_item_id,
    rating: ratingOf.get(m.id) ?? null,
    action: m.action?.type === "invoice" || m.action?.type === "quote" ? m.action : null,
    tips: m.action?.type === "tips" ? m.action.items : null,
    priceCard: m.action?.type === "prices" ? m.action : null,
    orderCard: m.action?.type === "order" ? m.action : null,
    docView: m.action?.type === "document" ? docView(m.action, lang, profileDict) : null,
    profileRows: m.action?.type === "profile" ? profileRows(m.action, lang, profileDict) : null,
    profileDone: m.action_status === "done",
    actionHref: m.action_status === "done" && m.action_ref && m.action && m.action.type !== "profile" && m.action.type !== "document" && m.action.type !== "tips" && m.action.type !== "work" ? `/dashboard/${m.action.type === "prices" ? (m.action.target === "order_rate" || m.action.target === "order_amount" ? "orders" : m.action.target === "quote" ? "quotes" : "invoices") : m.action.type === "order" ? (m.action.kind === "invoice" ? "invoices" : "orders") : m.action.type === "quote" ? "quotes" : "invoices"}/${m.action_ref}` : null,
  }));

  return (
    <main className="mx-auto max-w-2xl">
      <StaffChat d={d} f={getStaffFeedDict(lang)} name={staff.name} face={face} userId={user.id} lang={staff.lang ?? lang} messages={messages} rate={getStaffRateDict(lang)} draftDict={getStaffDraftDict(lang)} profileDict={profileDict} docDict={getStaffDocDict(lang)} orderDict={getStaffOrderDict(lang)} priceDict={getStaffPriceDict(lang)} workDict={getStaffWorkDict(lang)} />
      {messages.length > 0 && (
        <form action={clearStaffChat} className="py-4 text-center">
          <ConfirmButton message={d.clearConfirm} className="text-sm text-slate-500 underline">
            {d.clear}
          </ConfirmButton>
        </form>
      )}
    </main>
  );
}
