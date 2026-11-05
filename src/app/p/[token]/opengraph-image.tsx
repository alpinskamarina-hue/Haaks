import { ImageResponse } from "next/og";
import { docStatus, type DocumentRow } from "@/lib/documents";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { createServerAccountClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ZZP-paspoort";

// The built-in font covers Latin only: a name in another script would show as boxes.
const LATIN = /^[\p{Script=Latin}\p{N}\s.'’,&()-]*$/u;
const latin = (text: string | null | undefined) => (text && LATIN.test(text) ? text.trim() : "");

// Preview picture when a builder sends their passport link in WhatsApp or e-mail:
// name, trade, city and which checks are in the passport. Dutch, no contact details.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let name = "";
  let line = "";
  const checks: { label: string; ok: boolean }[] = [];

  const admin = await createServerAccountClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, company_name, trade, trades, city, kvk_number")
    .eq("passport_token", token)
    .eq("passport_enabled", true)
    .maybeSingle();
  if (profile) {
    name = latin(profile.full_name as string | null) || latin(profile.company_name as string | null);
    const trades = (profile.trades as string[] | null) ?? [];
    const trade = trades[0] ? (getWorkerDict("nl").trades as Record<string, string>)[trades[0]] ?? "" : latin(profile.trade as string | null);
    line = [trade, latin(profile.city as string | null)].filter(Boolean).join("  ·  ");
    const { data: docs } = await admin
      .from("documents")
      .select("doc_type, expires_on, issued_on")
      .eq("user_id", profile.id as string)
      .eq("show_in_passport", true);
    const has = (type: string) =>
      (docs ?? []).some((d) => d.doc_type === type && docStatus(d as DocumentRow) !== "expired");
    // Only what is really there: a grey "missing" mark would work against the builder.
    checks.push(
      ...[
        { label: "KvK", ok: Boolean(profile.kvk_number) },
        { label: "VCA", ok: has("vca") },
        { label: "AVB", ok: has("avb") },
      ].filter((c) => c.ok),
    );
  }
  if (name.length > 40) name = `${name.slice(0, 38)}…`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0f172a", padding: 64, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 700 }}>
            H
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>ZZP-paspoort</div>
        </div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", borderLeft: "10px solid #ea580c", paddingLeft: 36, marginTop: 40 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{name || "ZZP-vakman"}</div>
          {line && <div style={{ marginTop: 18, fontSize: 38, color: "#fdba74" }}>{line}</div>}
          {checks.length > 0 && (
            <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
              {checks.map((c) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 24px",
                    borderRadius: 999,
                    fontSize: 32,
                    fontWeight: 700,
                    background: c.ok ? "#166534" : "#334155",
                    color: c.ok ? "#dcfce7" : "#94a3b8",
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: c.ok ? "#4ade80" : "#64748b" }} />
                  {c.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: 28, color: "#cbd5e1" }}>Gegevens en documenten op één plek · haaks</div>
      </div>
    ),
    size,
  );
}
