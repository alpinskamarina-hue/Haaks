"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STORES, chooseFormat, cleanNumber } from "@/lib/store-cards";

// Saves a store card. The photo (if any) was already uploaded by the browser to <uid>/cards/.
export async function saveStoreCard(input: {
  store: string;
  customName?: string | null;
  number: string;
  detected?: string | null;
  photoPath?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const { supabase, user } = await requireUser();
  const store = STORES.some((s) => s.key === input.store) ? input.store : "other";
  const customName = store === "other" ? (input.customName ?? "").trim().slice(0, 60) : null;
  const number = cleanNumber(input.number ?? "");
  if (!number || (store === "other" && !customName)) return { ok: false };
  const photoPath = input.photoPath && input.photoPath.startsWith(`${user.id}/cards/`) ? input.photoPath : null;
  const chosen = chooseFormat(number, input.detected);

  const { data, error } = await supabase
    .from("store_cards")
    .insert({ user_id: user.id, store, custom_name: customName, number: chosen.number, format: chosen.format, photo_path: photoPath })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    console.error(error);
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, id: data.id };
}

export async function deleteStoreCard(id: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  const { data: card } = await supabase.from("store_cards").select("photo_path").eq("id", id).eq("user_id", user.id).maybeSingle<{ photo_path: string | null }>();
  if (!card) return { ok: false };
  await supabase.from("store_cards").delete().eq("id", id);
  if (card.photo_path?.startsWith(`${user.id}/cards/`)) await supabase.storage.from("documents").remove([card.photo_path]);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
