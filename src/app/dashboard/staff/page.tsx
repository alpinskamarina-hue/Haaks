/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StaffChat, type ShownStaffMessage } from "@/components/StaffChat";
import { SubmitButton } from "@/components/SubmitButton";
import { planOf } from "@/lib/plans";
import { faceUrl, staffOf, type StaffMessage } from "@/lib/staff";
import { getStaffDict } from "@/lib/staff-i18n";
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
    .select("id, role, body, image_path, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<StaffMessage[]>();
  const rows = (data ?? []).reverse();
  const urls = await signedUrls(supabase, rows.flatMap((m) => (m.image_path ? [m.image_path] : [])));
  const messages: ShownStaffMessage[] = rows.map((m) => ({ id: m.id, role: m.role, body: m.body, imageUrl: m.image_path ? (urls.get(m.image_path) ?? null) : null }));

  return (
    <main className="mx-auto max-w-2xl">
      <StaffChat d={d} name={staff.name} face={face} userId={user.id} lang={staff.lang ?? lang} messages={messages} />
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
