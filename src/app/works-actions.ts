"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cleanWorkInput, type Work, type WorkInput } from "@/lib/works";

// Creates or updates one completed work. Photos were already uploaded by the browser to
// <uid>/work/; files dropped from the work are deleted from storage.
export async function saveWork(input: WorkInput): Promise<{ ok: true; id: string } | { ok: false }> {
  const { supabase, user } = await requireUser();
  const row = cleanWorkInput(input, user.id);
  if (!row.title || !row.photos_after.length) return { ok: false };

  if (input.id) {
    const { data: old } = await supabase.from("works").select("photos_before, photos_after").eq("id", input.id).maybeSingle<Pick<Work, "photos_before" | "photos_after">>();
    if (!old) return { ok: false };
    const { error } = await supabase.from("works").update(row).eq("id", input.id);
    if (error) {
      console.error(error);
      return { ok: false };
    }
    const keep = new Set([...row.photos_before, ...row.photos_after]);
    const gone = [...old.photos_before, ...old.photos_after].filter((p) => !keep.has(p) && p.startsWith(`${user.id}/work/`));
    if (gone.length) await supabase.storage.from("documents").remove(gone);
    revalidatePath("/dashboard", "layout");
    return { ok: true, id: input.id };
  }

  const orderId = typeof input.order_id === "string" && /^[0-9a-f-]{36}$/.test(input.order_id) ? input.order_id : null;
  const { data, error } = await supabase
    .from("works")
    .insert({ ...row, user_id: user.id, order_id: orderId })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    console.error(error);
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, id: data.id };
}

export async function deleteWork(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { data: work } = await supabase.from("works").select("photos_before, photos_after").eq("id", id).maybeSingle<Pick<Work, "photos_before" | "photos_after">>();
  if (work) {
    await supabase.from("works").delete().eq("id", id);
    const files = [...work.photos_before, ...work.photos_after].filter((p) => p.startsWith(`${user.id}/work/`));
    if (files.length) await supabase.storage.from("documents").remove(files);
  }
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/works");
}
