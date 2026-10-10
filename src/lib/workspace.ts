import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/documents";
import { getDict, isLang } from "@/lib/i18n";

// Signed-in worker with their profile and interface language.
export async function loadWorkspace() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile & { current_order_id: string | null }>();
  if (!profile) redirect("/");
  const lang = isLang(profile.language) ? profile.language : "en";
  return { supabase, user, profile, lang, t: getDict(lang) };
}

type Supabase = Awaited<ReturnType<typeof loadWorkspace>>["supabase"];

// Short-lived links so a worker can open their own receipt files.
export async function signedUrls(supabase: Supabase, paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("documents").createSignedUrls(paths, 60 * 10);
  return new Map(
    (data ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );
}
