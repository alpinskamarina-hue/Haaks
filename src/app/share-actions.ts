"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { shortName } from "@/lib/company-jobs";
import { notifyJobShared, notifyShareThanks } from "@/lib/job-share-notify";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

export type ShareResult = { ok: true; name: string; already: boolean } | { ok: false; error: "no_user" | "self" | "closed" | "limit" | "locked" | "failed" };

const UUID = /^[0-9a-f-]{36}$/;

// «Отправить в Haaks»: a feed job to a colleague by @nick, with a short note. The database checks
// who may receive, the 20-a-day limit and that the sender sees the job in full.
export async function shareJob(itemId: string, username: string, note: string): Promise<ShareResult> {
  const { supabase, user } = await requireUser();
  if (!UUID.test(itemId)) return { ok: false, error: "failed" };
  const cleanNote = note.replace(/\s+/g, " ").trim().slice(0, 200);
  const { data, error } = await supabase.rpc("share_job", { p_item: itemId, p_username: username.slice(0, 40), p_note: cleanNote });
  if (error || !data) {
    if (error) console.error("Share job failed", error.message);
    return { ok: false, error: "failed" };
  }
  const res = data as { ok: boolean; error?: string; id?: string; to_user?: string; name?: string | null; already?: boolean };
  if (!res.ok) {
    const known = ["no_user", "self", "closed", "limit", "locked"] as const;
    return { ok: false, error: known.find((k) => k === res.error) ?? "failed" };
  }
  if (res.id && res.to_user) {
    const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const site = await siteUrl();
    const share = { id: res.id, toUser: res.to_user, itemId, fromName: me?.full_name ?? null, note: cleanNote || null };
    after(async () => {
      try {
        await notifyJobShared(await createServerAccountClient(), share, site);
      } catch (err) {
        console.error("Share notify failed", err);
      }
    });
  }
  return { ok: true, name: shortName(res.name), already: Boolean(res.already) };
}

// «Спасибо» for a sent job: once, and the sender gets a short push.
export async function thankShare(shareId: string) {
  const { supabase, user } = await requireUser();
  if (!UUID.test(shareId)) return;
  const { data: sender } = await supabase.rpc("thank_share", { p_id: shareId });
  if (sender) {
    const [{ data: row }, { data: me }] = await Promise.all([
      supabase.from("job_shares").select("item_id").eq("id", shareId).single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ]);
    const site = await siteUrl();
    if (row) {
      after(async () => {
        try {
          await notifyShareThanks(await createServerAccountClient(), { toUser: sender as string, itemId: row.item_id as string, fromName: me?.full_name ?? null }, site);
        } catch (err) {
          console.error("Thanks notify failed", err);
        }
      });
    }
  }
  revalidatePath("/dashboard", "layout");
}

// Settings: may colleagues send me jobs by my nick.
export async function setShareFrom(on: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ share_from: on ? "nick" : "nobody" }).eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}
