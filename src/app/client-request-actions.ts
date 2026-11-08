"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  cleanPostcode,
  MAX_PHOTOS,
  TIMINGS,
  workType,
  type ClientRequest,
  type Timing,
} from "@/lib/client-requests";
import { publishClientRequest, takeRequestOffline } from "@/lib/client-requests-server";
import { postcodePlace } from "@/lib/collect/geo";
import { emailEnabled, escapeHtml, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

const str = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

export type NewRequest = {
  work_type: string;
  size: string;
  description: string;
  postcode: string;
  timing: string;
  budget: string;
  name: string;
  email: string;
  phone: string;
  lang: "nl" | "en";
  photos: number;
};

export type NewRequestResult =
  | { ok: true; token: string; uploads: { path: string; token: string }[] }
  | { ok: false; error: "fields" | "postcode" | "email" | "limit" | "failed" };

// Step 1 of posting: save the request (status pending) and hand out upload slots for the photos.
// The browser uploads the photos straight to storage, then calls attachRequestPhotos.
export async function createClientRequest(input: NewRequest): Promise<NewRequestResult> {
  const type = workType(input.work_type);
  const description = str(input.description, 2000);
  const name = str(input.name, 80);
  const email = str(input.email, 160)?.toLowerCase() ?? null;
  if (!type || !description || description.length < 10 || !name || name.length < 2 || !email) return { ok: false, error: "fields" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "email" };
  const postcode = cleanPostcode(input.postcode ?? "");
  if (!postcode) return { ok: false, error: "postcode" };
  const timing: Timing = (TIMINGS as readonly string[]).includes(input.timing) ? (input.timing as Timing) : "weeks";

  const server = await createServerAccountClient();
  // At most 3 open requests per e-mail address.
  const { count } = await server
    .from("client_requests")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .in("status", ["pending", "published"]);
  if ((count ?? 0) >= 3) return { ok: false, error: "limit" };

  const place = await postcodePlace(postcode).catch(() => null);
  const { data: row, error } = await server
    .from("client_requests")
    .insert({
      work_type: type.key,
      trades: type.trades,
      size: str(input.size, 120),
      description,
      postcode,
      city: place?.place ?? place?.gemeente ?? null,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      timing,
      budget: str(input.budget, 60),
      name,
      email,
      phone: str(input.phone, 30),
      lang: input.lang === "en" ? "en" : "nl",
    })
    .select("id, token")
    .single<{ id: string; token: string }>();
  if (error || !row) {
    console.error("client request: insert failed", error?.message);
    return { ok: false, error: "failed" };
  }

  const { data: me } = await server.auth.getUser();
  const uploads: { path: string; token: string }[] = [];
  for (let i = 0; i < Math.min(Math.max(0, input.photos | 0), MAX_PHOTOS) && me.user; i++) {
    const path = `${me.user.id}/requests/${row.id}/${i + 1}.jpg`;
    const { data } = await server.storage.from("documents").createSignedUploadUrl(path);
    if (data) uploads.push({ path, token: data.token });
  }

  if (emailEnabled()) {
    const link = `${await siteUrl()}/klus/${row.token}`;
    const en = input.lang === "en";
    await sendEmail({
      to: email,
      subject: en ? "Your job on Haaks" : "Je klus op Haaks",
      text: `${en ? "Here you see the replies from tradespeople" : "Hier zie je de reacties van vakmensen"}: ${link}`,
      html: `<p>${en ? "Hello" : "Hallo"} ${escapeHtml(name)},</p><p>${en ? "Here you see the replies from tradespeople" : "Hier zie je de reacties van vakmensen"}: <a href="${link}">${link}</a></p>`,
    }).catch(() => null);
  }
  return { ok: true, token: row.token, uploads };
}

// Step 2 of posting: remember the photos that really arrived in storage.
export async function attachRequestPhotos(token: string, paths: string[]) {
  const server = await createServerAccountClient();
  const { data: req } = await server.from("client_requests").select("id, photos").eq("token", token).maybeSingle<Pick<ClientRequest, "id" | "photos">>();
  if (!req) return;
  const mine = paths.filter((p) => p.includes(`/requests/${req.id}/`)).slice(0, MAX_PHOTOS);
  await server.from("client_requests").update({ photos: mine }).eq("id", req.id);
}

async function requestByToken(token: string) {
  const server = await createServerAccountClient();
  const { data } = await server.from("client_requests").select("*").eq("token", token).maybeSingle<ClientRequest>();
  return { server, req: data };
}

// The client picks a builder: contacts open on both sides, the request leaves the feed.
export async function chooseBuilder(token: string, replyId: string) {
  const { server, req } = await requestByToken(token);
  if (!req || req.chosen_reply_id || req.status === "rejected") redirect(`/klus/${token}`);
  const { data: reply } = await server.from("client_replies").select("id").eq("id", replyId).eq("request_id", req.id).maybeSingle();
  if (!reply) redirect(`/klus/${token}`);
  const now = new Date().toISOString();
  await server.from("client_replies").update({ status: "chosen", decided_at: now }).eq("id", replyId);
  await server.from("client_replies").update({ status: "not_chosen", decided_at: now }).eq("request_id", req.id).neq("id", replyId);
  await server.from("client_requests").update({ chosen_reply_id: replyId }).eq("id", req.id);
  await takeRequestOffline(server, req, "closed");
  revalidatePath(`/klus/${token}`);
  redirect(`/klus/${token}?chosen=1`);
}

export async function closeClientRequest(token: string) {
  const { server, req } = await requestByToken(token);
  if (req && (req.status === "pending" || req.status === "published")) {
    await server.from("client_replies").update({ status: "not_chosen", decided_at: new Date().toISOString() }).eq("request_id", req.id).eq("status", "sent");
    await takeRequestOffline(server, req, "closed");
  }
  revalidatePath(`/klus/${token}`);
  redirect(`/klus/${token}`);
}

// Moderation (Haaks admin only).
async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) redirect("/dashboard");
  return createServerAccountClient();
}

export async function approveClientRequest(formData: FormData) {
  const server = await requireAdmin();
  await publishClientRequest(server, String(formData.get("id")), await siteUrl());
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=client_published#client-requests");
}

export async function rejectClientRequest(formData: FormData) {
  const server = await requireAdmin();
  const { data: req } = await server
    .from("client_requests")
    .select("id, feed_item_id")
    .eq("id", String(formData.get("id")))
    .single<Pick<ClientRequest, "id" | "feed_item_id">>();
  if (req) await takeRequestOffline(server, req, "rejected", str(formData.get("reason"), 300) ?? undefined);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=client_rejected#client-requests");
}
