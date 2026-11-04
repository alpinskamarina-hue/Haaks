"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

// 7 days of Ultra, once per account, without a card (the database checks it).
export async function startUltraTrial() {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("start_ultra_trial");
  if (error) {
    const used = /trial_used|already_paid/.test(error.message);
    if (!used) console.error("Ultra trial failed", error);
    redirect(`/dashboard/plan?trial=${used ? "used" : "error"}`);
  }
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/plan?trial=ok");
}
