import { ProfileWizard } from "@/components/ProfileWizard";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";

// Sign-up questions after the first login (?step=0..4, 0 = name and phone), or one of them from
// "My profile" (&edit=1).
export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; edit?: string; must?: string }>;
}) {
  const { profile, lang } = await loadWorkspace();
  const { step, edit, must } = await searchParams;
  const n = step === undefined ? 0 : Number(step);
  const startStep = (n >= 0 && n <= 4 ? n : 0) as 0 | 1 | 2 | 3 | 4;
  const [firstName = "", ...rest] = (profile.full_name ?? "").trim().split(/\s+/);
  return (
    <ProfileWizard
      w={getWorkerDict(lang)}
      lang={lang}
      initial={withDefaults(profile as unknown as Partial<WorkerProfile>)}
      startStep={startStep}
      edit={edit === "1"}
      must={must === "1"}
      contact={{ firstName, lastName: rest.join(" "), phone: profile.phone ?? "" }}
    />
  );
}
