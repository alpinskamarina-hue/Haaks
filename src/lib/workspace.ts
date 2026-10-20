import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/documents";
import { getDict, isLang } from "@/lib/i18n";

// Signed-in worker with their profile and interface language.
export async function loadWorkspace() {
  const { supabase, user } = await requireUser();
  const profile = await ensureProfile(supabase, user.id);
  // "/" sends signed-in users back here, so redirecting there would loop.
  if (!profile) throw new Error("Profile not found");
  const lang = isLang(profile.language) ? profile.language : "en";
  return { supabase, user, profile, lang, t: getDict(lang) };
}

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// The profile row is made by a database trigger at sign-up. If it is missing
// anyway, make it now instead of leaving the worker stuck.
export async function ensureProfile(supabase: Supabase, userId: string) {
  const select = () =>
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle<Profile & { current_order_id: string | null }>();
  const { data } = await select();
  if (data) return data;
  await supabase.from("profiles").insert({ id: userId });
  return (await select()).data;
}

// Short-lived links so a worker can open their own receipt files.
export async function signedUrls(supabase: Supabase, paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("documents").createSignedUrls(paths, 60 * 10);
  return new Map(
    (data ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );
}
