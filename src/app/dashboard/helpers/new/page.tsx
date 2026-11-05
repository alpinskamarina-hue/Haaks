import { createHelperJob } from "@/app/company-actions";
import { CompanyJobForm } from "@/components/CompanyJobForm";
import { getHelperDict } from "@/lib/helper-i18n";
import { loadWorkspace } from "@/lib/workspace";

export default async function NewHelperJobPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { lang } = await loadWorkspace();
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CompanyJobForm t={getHelperDict(lang)} lang={lang} error={error} action={createHelperJob} base="/dashboard/helpers" />
    </main>
  );
}
