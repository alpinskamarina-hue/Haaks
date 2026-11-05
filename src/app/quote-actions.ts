"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { dutchToday } from "@/lib/quotes";

// 👍 on today's phrase (only today's can be liked).
export async function likeQuote(on: boolean) {
  const { supabase, user } = await requireUser();
  const day = dutchToday();
  if (on) await supabase.from("quote_likes").upsert({ user_id: user.id, day }, { onConflict: "user_id,day", ignoreDuplicates: true });
  else await supabase.from("quote_likes").delete().eq("user_id", user.id).eq("day", day);
  revalidatePath("/dashboard");
}
