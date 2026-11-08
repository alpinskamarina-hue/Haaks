"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  hasContactInText,
  JOB_REQUIREMENTS,
  JOB_TRADES,
  publishCompanyJob,
  takeJobOffline,
  type CompanyJob,
} from "@/lib/company-jobs";
import { notifyInvite, notifyReplyAccepted } from "@/lib/job-replies";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 200) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

const back = (path: string, key: "ok" | "error", value: string): never => redirect(`${path}?${key}=${value}`);

async function requireCompany() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, company_verified, company_name, kvk_number, full_name, phone, business_email")
    .eq("id", user.id)
    .single();
  if (profile?.account_type !== "company") redirect("/dashboard");
  return { supabase, user, profile };
}

export async function saveCompanyDetails(formData: FormData) {
  const { supabase, user } = await requireCompany();
  const kvk = text(formData, "kvk_number")?.replace(/\s/g, "") ?? "";
  if (!/^\d{8}$/.test(kvk)) back("/company", "error", "kvk");
  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: text(formData, "company_name", 120),
      kvk_number: kvk,
      full_name: text(formData, "full_name", 120),
      phone: text(formData, "phone", 40),
      business_email: text(formData, "business_email", 120) ?? user.email,
      // The company cabinet does not use the builder's onboarding.
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) back("/company", "error", "failed");
  revalidatePath("/company");
  back("/company", "ok", "saved");
}

type Poster = Awaited<ReturnType<typeof requireCompany>>;

// Shared by companies (/company) and builders who need a helper (/dashboard/helpers).
async function postJob({ supabase, user, profile }: Poster, formData: FormData, base: string) {
  const title = text(formData, "title", 120) ?? "";
  const description = text(formData, "description", 2000) ?? "";
  const trades = formData.getAll("trades").map(String).filter((t) => JOB_TRADES.includes(t));
  const requirements = formData
    .getAll("requirements")
    .map(String)
    .filter((r) => (JOB_REQUIREMENTS as readonly string[]).includes(r));
  const city = text(formData, "city", 80);
  const rateType = (["hour", "fixed", "ask"] as const).find((r) => r === formData.get("rate_type")) ?? "ask";
  const rate = Number(String(formData.get("rate") ?? "").replace(",", "."));
  const whole = (key: string, min: number, max: number) => {
    const n = Math.round(Number(formData.get(key)));
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  const startDate = text(formData, "start_date", 10);
  const form = `${base}/new`;

  if (title.length < 3) back(form, "error", "title");
  if (trades.length < 1 || trades.length > 5) back(form, "error", "trades");
  if (!city) back(form, "error", "city");
  if (rateType !== "ask" && !(rate > 0)) back(form, "error", "rate");
  if (hasContactInText(`${title}\n${description}`)) back(form, "error", "contact");
  if (formData.get("opdracht") !== "on") back(form, "error", "opdracht");

  const { data: job, error } = await supabase
    .from("company_jobs")
    .insert({
      company_id: user.id,
      title,
      description,
      trades,
      city,
      postcode: text(formData, "postcode", 10)?.toUpperCase() ?? null,
      start_date: startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null,
      weeks: whole("weeks", 1, 104),
      people: whole("people", 1, 50) ?? 1,
      rate_type: rateType,
      rate: rateType === "ask" ? null : Math.round(rate * 100) / 100,
      requirements,
      opdracht_confirmed: true,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !job) back(form, "error", error?.message.includes("company_jobs_limit") ? "limit" : "failed");

  // A poster Haaks has approved before goes online at once.
  if (profile.company_verified) {
    try {
      await publishCompanyJob(await createServerAccountClient(), job!.id, await siteUrl());
    } catch (e) {
      console.error("Publishing a job failed", e);
      revalidatePath(base);
      back(base, "ok", "sent");
    }
    revalidatePath(base);
    back(base, "ok", "published");
  }
  revalidatePath(base);
  back(base, "ok", "sent");
}

async function closeJob({ supabase }: Poster, formData: FormData, base: string) {
  // Read through the poster's own rights: only their own jobs are found.
  const { data: job } = await supabase
    .from("company_jobs")
    .select("id, feed_item_id, status")
    .eq("id", String(formData.get("id")))
    .maybeSingle<Pick<CompanyJob, "id" | "feed_item_id" | "status">>();
  if (!job || job.status === "closed" || job.status === "rejected") back(base, "error", "failed");
  await takeJobOffline(await createServerAccountClient(), job!, "closed");
  revalidatePath(base);
  back(base, "ok", "closed");
}

// Accept or decline a builder's reply; accepting opens contacts on both sides.
async function decideReply({ supabase }: Poster, formData: FormData, base: string) {
  const replyId = String(formData.get("reply"));
  const jobId = String(formData.get("job"));
  const accept = formData.get("accept") === "1";
  const { error } = await supabase.rpc("decide_job_reply", { p_reply: replyId, p_accept: accept });
  if (error) back(`${base}/jobs/${jobId}`, "error", "failed");
  if (accept) {
    try {
      await notifyReplyAccepted(await createServerAccountClient(), replyId, await siteUrl());
    } catch (e) {
      console.error("Reply accepted alert failed", e);
    }
  }
  revalidatePath(base, "layout");
  back(`${base}/jobs/${jobId}`, "ok", accept ? "accepted" : "declined");
}

export async function createCompanyJob(formData: FormData) {
  const poster = await requireCompany();
  if (!poster.profile.company_name || !poster.profile.kvk_number || !poster.profile.phone) back("/company", "error", "details");
  await postJob(poster, formData, "/company");
}

export async function closeCompanyJob(formData: FormData) {
  await closeJob(await requireCompany(), formData, "/company");
}

export async function decideJobReply(formData: FormData) {
  await decideReply(await requireCompany(), formData, "/company");
}

// "Need a helper": a builder posts a job for other builders, in their own cabinet.
const HELPERS = "/dashboard/helpers";

async function requireBuilder() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, company_verified, company_name, kvk_number, full_name, phone, business_email")
    .eq("id", user.id)
    .single();
  if (profile?.account_type !== "worker") redirect("/company");
  return { supabase, user, profile };
}

export async function createHelperJob(formData: FormData) {
  const poster = await requireBuilder();
  if (!poster.profile.full_name || !poster.profile.phone) back(`${HELPERS}/new`, "error", "details");
  await postJob(poster, formData, HELPERS);
}

export async function closeHelperJob(formData: FormData) {
  await closeJob(await requireBuilder(), formData, HELPERS);
}

export async function decideHelperReply(formData: FormData) {
  await decideReply(await requireBuilder(), formData, HELPERS);
}

// The company invites a builder from the catalog; the builder gets an alert.
export async function inviteWorker(formData: FormData) {
  const { supabase } = await requireCompany();
  const job = String(formData.get("job") ?? "");
  const { data: id, error } = await supabase.rpc("invite_worker", {
    p_worker: String(formData.get("worker")),
    p_job: /^[0-9a-f-]{36}$/.test(job) ? job : null,
  });
  const back_to = `/company/builders${formData.get("trade") ? `?trade=${encodeURIComponent(String(formData.get("trade")))}` : ""}`;
  const sep = back_to.includes("?") ? "&" : "?";
  if (error || !id) redirect(`${back_to}${sep}error=${error?.message.includes("invite_limit") ? "invite_limit" : "failed"}`);
  try {
    await notifyInvite(await createServerAccountClient(), String(id), await siteUrl());
  } catch (e) {
    console.error("Invite alert failed", e);
  }
  revalidatePath("/company", "layout");
  redirect(`${back_to}${sep}ok=invited`);
}

// Moderation (Haaks admin only).
async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) redirect("/dashboard");
  return createServerAccountClient();
}

export async function approveCompanyJob(formData: FormData) {
  const server = await requireAdmin();
  await publishCompanyJob(server, String(formData.get("id")), await siteUrl());
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=published");
}

// KvK check by hand (research item 5): the admin looked the number up on kvk.nl and the name matches.
// Builders then see «KvK gecontroleerd» on this company's jobs. «uncheck» takes it back.
export async function checkCompanyKvk(formData: FormData) {
  const server = await requireAdmin();
  const id = String(formData.get("company") ?? "");
  const ok = formData.get("ok") === "1";
  const name = text(formData, "name", 200);
  if (!id || (ok && !name)) redirect("/dashboard/moderation?ok=kvk_name");
  await server
    .from("profiles")
    .update(ok ? { kvk_checked_at: new Date().toISOString(), kvk_checked_name: name } : { kvk_checked_at: null, kvk_checked_name: null })
    .eq("id", id)
    .eq("account_type", "company");
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/moderation?ok=${ok ? "kvk_checked" : "kvk_unchecked"}#kvk`);
}

export async function rejectCompanyJob(formData: FormData) {
  const server = await requireAdmin();
  const { data: job } = await server
    .from("company_jobs")
    .select("id, feed_item_id")
    .eq("id", String(formData.get("id")))
    .single<Pick<CompanyJob, "id" | "feed_item_id">>();
  if (job) await takeJobOffline(server, job, "rejected", text(formData, "reason", 300) ?? undefined);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=rejected");
}

// A report about a job or a builder card: take it down, or dismiss the reports.
export async function resolveReport(formData: FormData) {
  const server = await requireAdmin();
  const kind = formData.get("kind") === "worker" ? "worker" : "job";
  const target = String(formData.get("target"));
  if (formData.get("remove") === "1") {
    if (kind === "job") {
      const { data: job } = await server
        .from("company_jobs")
        .select("id, feed_item_id")
        .eq("feed_item_id", target)
        .maybeSingle<Pick<CompanyJob, "id" | "feed_item_id">>();
      if (job) await takeJobOffline(server, job, "rejected", "Verwijderd na meldingen / Removed after reports");
    } else {
      await server.from("profiles").update({ in_catalog: false, catalog_until: null }).eq("id", target);
    }
  }
  await server.from("reports").delete().eq("target_kind", kind).eq("target_id", target);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/moderation?ok=${formData.get("remove") === "1" ? "removed" : "dismissed"}`);
}
