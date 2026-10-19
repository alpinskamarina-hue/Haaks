import { PasswordForm } from "@/components/PasswordForm";
import { loadWorkspace } from "@/lib/workspace";

export default async function PasswordPage() {
  const { user, t } = await loadWorkspace();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">{t.passwordTitle}</h1>
        <p className="mb-4 mt-1 text-sm text-slate-600">{user.email}</p>
        <PasswordForm t={t} />
      </section>
    </main>
  );
}
