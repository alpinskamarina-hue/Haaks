import { ProfileWizard } from "@/components/ProfileWizard";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";

// Sign-up questions after the first login (?step=1..4), or one of them from
// "My profile" (&edit=1).
export default async function Onboarding({ searchParams }: { searchParams: Promise<{ step?: string; edit?: string }> }) {
  const { profile, lang } = await loadWorkspace();
  const { step, edit } = await searchParams;
  const n = Number(step);
  const startStep = (n >= 1 && n <= 4 ? n : 1) as 1 | 2 | 3 | 4;
  return (
    <ProfileWizard
      w={getWorkerDict(lang)}
      lang={lang}
      initial={withDefaults(profile as unknown as Partial<WorkerProfile>)}
      startStep={startStep}
      edit={edit === "1"}
    />
  );
}
