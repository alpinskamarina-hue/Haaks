import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientJobView, type Reply } from "@/components/ClientJobView";
import type { ClientRequest } from "@/lib/client-requests";
import { docStatus } from "@/lib/documents";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jouw klus · Haaks", robots: { index: false } };

// The client's own page of a job (secret link): status, the builders' replies, choosing one.
export default async function ClientJobPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const { new: isNew } = await searchParams;
  if (!/^[0-9a-f]{36}$/.test(token)) notFound();
  const server = await createServerAccountClient();
  const { data: req } = await server.from("client_requests").select("*").eq("token", token).maybeSingle<ClientRequest>();
  if (!req) notFound();
  const { data: rows } = await server.rpc("client_request_replies", { p_request: req.id });
  const replies = (rows ?? []) as Reply[];

  // Photos of the job, avatars, and VCA / insurance shown in the builders' passports.
  const paths = [...req.photos, ...replies.map((r) => r.avatar_path).filter((p): p is string => !!p)];
  const { data: signed } = paths.length ? await server.storage.from("documents").createSignedUrls(paths, 3600) : { data: [] };
  const url = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path as string, s.signedUrl as string]));
  const ids = replies.map((r) => r.worker_id);
  const { data: docs } = ids.length
    ? await server.from("documents").select("user_id, doc_type, issued_on, expires_on").in("user_id", ids).eq("show_in_passport", true)
    : { data: [] };
  const validDocs = new Set(
    ((docs ?? []) as { user_id: string; doc_type: "vca" | "avb" | "kvk_extract" | "car" | "other"; issued_on: string | null; expires_on: string | null }[])
      .filter((d) => (d.doc_type === "vca" || d.doc_type === "avb") && docStatus(d) !== "expired")
      .map((d) => `${d.user_id}:${d.doc_type}`),
  );

  const site = await siteUrl();
  return <ClientJobView req={req} replies={replies} url={url} validDocs={validDocs} site={site} token={token} isNew={!!isNew} />;
}
