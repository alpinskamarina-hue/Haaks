"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyHoursDecided } from "@/lib/hours-notify";
import { siteUrl } from "@/lib/lang";
import { short } from "@/lib/quotes";
import { createServerAccountClient } from "@/lib/supabase/server";

// The company on the Dutch page: Akkoord (with a name) or not (with a comment). No account needed.
export async function decideHours(token: string, ok: boolean, formData: FormData) {
  const name = short(formData.get("name"), 200);
  const comment = short(formData.get("comment"), 1000) || null;
  if (!name || (!ok && !comment)) return;
  const admin = await createServerAccountClient();
  const { data: id } = await admin.rpc("hour_approval_decide", { p_token: token, p_ok: ok, p_name: name, p_comment: comment });
  if (id) {
    const { data: a } = await admin.rpc("hour_approval_get", { p_token: token });
    const site = await siteUrl();
    if (a)
      after(() =>
        notifyHoursDecided(admin, { ...(a as { user_id: string; order_id: string; date_from: string; hours: number }), id: id as string }, ok, name, comment, site).catch((err) =>
          console.error("Hours notify failed", err),
        ),
      );
  }
  revalidatePath(`/uren/${token}`);
}
