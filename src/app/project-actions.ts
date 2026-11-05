"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

const KINDS = ["before", "during", "after"] as const;
type Kind = (typeof KINDS)[number];

// Called after the browser has uploaded the photo to <uid>/orders/<order id>/.
export async function addOrderPhoto(orderId: string, path: string, kind: string) {
  const { supabase, user } = await requireUser();
  if (!path.startsWith(`${user.id}/orders/${orderId}/`) || path.includes("..")) throw new Error("Invalid path");
  const k: Kind = KINDS.includes(kind as Kind) ? (kind as Kind) : "during";
  const { error } = await supabase.from("order_photos").insert({ user_id: user.id, order_id: orderId, path, kind: k });
  if (error) throw error;
  revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function deleteOrderPhoto(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("order_photos").delete().eq("id", id).eq("user_id", user.id).select("path, order_id").maybeSingle();
  if (data) {
    await supabase.storage.from("documents").remove([data.path as string]);
    revalidatePath(`/dashboard/orders/${data.order_id}`);
  }
}

export async function addOrderNote(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = String(formData.get("order_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!orderId || !body) return;
  const { error } = await supabase.from("order_notes").insert({ user_id: user.id, order_id: orderId, body });
  if (error) throw error;
  revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function deleteOrderNote(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("order_notes").delete().eq("id", id).eq("user_id", user.id).select("order_id").maybeSingle();
  if (data) revalidatePath(`/dashboard/orders/${data.order_id}`);
}
