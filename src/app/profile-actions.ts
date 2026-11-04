"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanUsername } from "@/lib/username";
import { requireUser } from "@/lib/auth";
import { parseAmount } from "@/lib/quotes";
import { AVAILABILITY, cleanProfileInput, MAX_WORK_PHOTOS, TRADES } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";

// Saves one step of the profile wizard (or an edit of it). Only the fields
// the step sends are changed. finish marks the sign-up questions as seen.
export async function saveWorkerProfile(input: Record<string, unknown>, opts: { finish?: boolean } = {}) {
  const { supabase, user } = await requireUser();
  const update: Record<string, unknown> = cleanProfileInput(input);
  if (Array.isArray(update.trades)) {
    // Keep the old free-text trade (used on invoices and the passport header) in step.
    const nl = getWorkerDict("nl").trades;
    const names = (update.trades as string[]).filter((id) => (TRADES as readonly string[]).includes(id)).map((id) => nl[id as keyof typeof nl]);
    update.trade = names.length ? names.join(", ").slice(0, 120) : null;
  }
  if (opts.finish) update.onboarded_at = new Date().toISOString();
  if (!Object.keys(update).length) return { ok: true };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) {
    console.error(error);
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function skipOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function setAvailability(formData: FormData) {
  const { supabase, user } = await requireUser();
  const from = formData.get("available_from");
  const kind = formData.get("availability");
  await supabase
    .from("profiles")
    .update({
      available: formData.get("available") === "on",
      available_from: typeof from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null,
      availability: (AVAILABILITY as readonly string[]).includes(String(kind)) ? kind : null,
    })
    .eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function saveRate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const rate = parseAmount(String(formData.get("hourly_rate") ?? ""));
  await supabase
    .from("profiles")
    .update({ hourly_rate: Number.isFinite(rate) && rate > 0 && rate < 1000 ? rate : null })
    .eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

// Called after the browser has uploaded the photo to <uid>/work/.
export async function addWorkPhoto(path: string) {
  const { supabase, user } = await requireUser();
  if (!path.startsWith(`${user.id}/work/`) || path.includes("..")) throw new Error("Invalid path");
  const { data } = await supabase.from("profiles").select("work_photos").eq("id", user.id).single<{ work_photos: string[] }>();
  const photos = data?.work_photos ?? [];
  if (photos.length >= MAX_WORK_PHOTOS) throw new Error("Too many photos");
  const { error } = await supabase.from("profiles").update({ work_photos: [...photos, path] }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard", "layout");
}

export async function removeWorkPhoto(formData: FormData) {
  const { supabase, user } = await requireUser();
  const path = String(formData.get("path") ?? "");
  const { data } = await supabase.from("profiles").select("work_photos").eq("id", user.id).single<{ work_photos: string[] }>();
  const photos = data?.work_photos ?? [];
  if (!photos.includes(path)) return;
  await supabase.from("profiles").update({ work_photos: photos.filter((p) => p !== path) }).eq("id", user.id);
  if (path.startsWith(`${user.id}/work/`)) await supabase.storage.from("documents").remove([path]);
  revalidatePath("/dashboard", "layout");
}

// Called after the browser has uploaded the photo to <uid>/avatar/. Replaces the old one.
export async function setAvatar(path: string) {
  const { supabase, user } = await requireUser();
  if (!path.startsWith(`${user.id}/avatar/`) || path.includes("..")) throw new Error("Invalid path");
  const { data } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single<{ avatar_path: string | null }>();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) throw new Error(error.message);
  const old = data?.avatar_path;
  if (old && old !== path && old.startsWith(`${user.id}/avatar/`)) await supabase.storage.from("documents").remove([old]);
  revalidatePath("/dashboard", "layout");
}

export async function removeAvatar() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single<{ avatar_path: string | null }>();
  await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  const old = data?.avatar_path;
  if (old?.startsWith(`${user.id}/avatar/`)) await supabase.storage.from("documents").remove([old]);
  revalidatePath("/dashboard", "layout");
}

// The builder's @nick for the public page /@nick. Taken or invalid nicks come back as ?nick=… on the profile page.
export async function setUsername(formData: FormData) {
  const { supabase, user } = await requireUser();
  const raw = String(formData.get("username") ?? "");
  const username = raw.trim() ? cleanUsername(raw) : null;
  if (raw.trim() && !username) redirect("/dashboard/profile?nick=bad#nick");
  const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
  if (error) redirect(`/dashboard/profile?nick=${error.code === "23505" ? "taken" : "bad"}#nick`);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/profile?nick=saved#nick");
}

// "Show me in search": other builders and companies can find the profile by nick, name, trade and town.
export async function setInSearch(on: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ in_search: on }).eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}
