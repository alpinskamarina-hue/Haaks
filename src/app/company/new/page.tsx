import { CompanyJobForm } from "@/components/CompanyJobForm";
import { requireUser } from "@/lib/auth";
import { companyLang, getCompanyDict } from "@/lib/company-i18n";

export default async function NewCompanyJobPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single();
  const lang = companyLang(profile?.language);
  const { error } = await searchParams;
  return <CompanyJobForm t={getCompanyDict(lang)} lang={lang} error={error} />;
}
