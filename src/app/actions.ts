"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ACCEPTED_MIME, DOC_TYPES, type DocType } from "@/lib/documents";
import { cleanDate, extractDocument } from "@/lib/extract";
import { isLang, type Lang } from "@/lib/i18n";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set("lang", lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ language: lang }).eq("id", user.id);
  }
  revalidatePath("/", "layout");
}

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      company_name: text(formData, "company_name"),
      trade: text(formData, "trade"),
      city: text(formData, "city"),
      phone: text(formData, "phone"),
      kvk_number: text(formData, "kvk_number")?.replace(/\s/g, "") ?? null,
      btw_number: text(formData, "btw_number")?.replace(/\s/g, "").toUpperCase() ?? null,
    })
    .eq("id", user.id);
  revalidatePath("/dashboard");
}

// Called after the browser has uploaded the file to the user's storage folder.
export async function addDocument(input: {
  path: string;
  fileName: string;
  mimeType: string;
  docType: string;
}) {
  const { supabase, user } = await requireUser();
  if (!input.path.startsWith(`${user.id}/`)) throw new Error("Invalid path");
  if (!ACCEPTED_MIME.includes(input.mimeType)) throw new Error("Unsupported file type");
  const docType: DocType = (DOC_TYPES as readonly string[]).includes(input.docType)
    ? (input.docType as DocType)
    : "other";

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      doc_type: docType,
      file_path: input.path,
      file_name: input.fileName.slice(0, 200),
      mime_type: input.mimeType,
    })
    .select("id")
    .single();
  if (error || !doc) throw new Error(error?.message ?? "Insert failed");

  if (!process.env.ANTHROPIC_API_KEY) {
    await supabase.from("documents").update({ ai_status: "skipped" }).eq("id", doc.id);
    revalidatePath("/dashboard");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, company_name, kvk_number, btw_number")
    .eq("id", user.id)
    .single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(input.path);
    if (downloadError || !blob) throw downloadError ?? new Error("Download failed");
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

    const result = await extractDocument({ base64, mimeType: input.mimeType }, docType, lang);
    if (!result) throw new Error("No result");

    await supabase
      .from("documents")
      .update({
        document_number: result.document_number,
        holder_name: result.holder_name,
        issued_on: cleanDate(result.issued_on),
        expires_on: cleanDate(result.expires_on),
        insurer: result.insurer,
        coverage_amount: result.coverage_amount,
        ai_summary: result.summary,
        ai_warnings: result.warnings,
        ai_status: "done",
      })
      .eq("id", doc.id);

    // Fill empty profile fields from a KvK extract, never overwrite what the worker typed.
    if (docType === "kvk_extract" && profile) {
      const fill: Record<string, string> = {};
      if (!profile.company_name && result.company_name) fill.company_name = result.company_name;
      if (!profile.kvk_number && result.kvk_number) fill.kvk_number = result.kvk_number.replace(/\s/g, "");
      if (!profile.btw_number && result.btw_number) fill.btw_number = result.btw_number.replace(/\s/g, "");
      if (Object.keys(fill).length) {
        await supabase.from("profiles").update(fill).eq("id", user.id);
      }
    }
  } catch (err) {
    console.error("Document extraction failed", err);
    await supabase.from("documents").update({ ai_status: "failed" }).eq("id", doc.id);
  }

  revalidatePath("/dashboard");
}

export async function updateDocument(formData: FormData) {
  const { supabase } = await requireUser();
  const id = text(formData, "id");
  if (!id) return;
  await supabase
    .from("documents")
    .update({
      document_number: text(formData, "document_number"),
      issued_on: cleanDate(text(formData, "issued_on")),
      expires_on: cleanDate(text(formData, "expires_on")),
    })
    .eq("id", id);
  revalidatePath("/dashboard");
}

export async function toggleDocument(id: string, show: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("documents").update({ show_in_passport: show }).eq("id", id);
  revalidatePath("/dashboard");
}

export async function deleteDocument(id: string) {
  const { supabase } = await requireUser();
  const { data: doc } = await supabase.from("documents").select("file_path").eq("id", id).single();
  if (!doc) return;
  await supabase.storage.from("documents").remove([doc.file_path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function setPassportEnabled(enabled: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ passport_enabled: enabled }).eq("id", user.id);
  revalidatePath("/dashboard");
}

// A new token makes every previously shared link stop working.
export async function regeneratePassportLink() {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ passport_token: randomBytes(18).toString("hex") })
    .eq("id", user.id);
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
