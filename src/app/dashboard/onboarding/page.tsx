import { ProfileWizard } from "@/components/ProfileWizard";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";
import { SubmitButton } from "@/components/SubmitButton";
import { planOf } from "@/lib/plans";
import { getStaffFillDict } from "@/lib/staff-profile-i18n";
import { fillWithStaff } from "../../staff-actions";

// Sign-up questions after the first login (?step=0..4, 0 = name and phone), or one of them from
// "My profile" (&edit=1).
export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; edit?: string; must?: string; back?: string }>;
}) {
  const { profile, lang } = await loadWorkspace();
  const { step, edit, must, back } = await searchParams;
  const n = step === undefined ? 0 : Number(step);
  const startStep = (n >= 0 && n <= 4 ? n : 0) as 0 | 1 | 2 | 3 | 4;
  // «Заполнить с сотрудником»: Ultra already, or the free 3 days not used yet.
  const plan = profile as typeof profile & { plan?: string | null; plan_until?: string | null; trial_started_at?: string | null };
  const ultra = planOf(plan) === "ultra";
  const fill = getStaffFillDict(lang);
  const staffSlot =
    ultra || (!plan.trial_started_at && planOf(plan) === "free") ? (
      <form action={fillWithStaff} className="rounded-xl border border-orange-200 bg-orange-50 p-3">
        <SubmitButton className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white">{fill.button}</SubmitButton>
        {!ultra && <p className="mt-2 text-sm text-slate-600">{fill.hint}</p>}
      </form>
    ) : null;
  const [firstName = "", ...rest] = (profile.full_name ?? "").trim().split(/\s+/);
  return (
    <ProfileWizard
      w={getWorkerDict(lang)}
      lang={lang}
      initial={withDefaults(profile as unknown as Partial<WorkerProfile>)}
      startStep={startStep}
      edit={edit === "1"}
      must={must === "1"}
      backTo={back === "settings" ? "/dashboard/settings#feed" : "/dashboard/profile"}
      contact={{ firstName, lastName: rest.join(" "), phone: profile.phone ?? "" }}
      staffSlot={staffSlot}
    />
  );
}
