import { ImageResponse } from "next/og";
import { createServerAccountClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Haaks";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Preview picture for a shared job in WhatsApp, Telegram, Facebook: Dutch title, place and budget.
// Latin text only, so the built-in font covers it.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let title = "Klus voor vakmensen";
  let line = "";
  if (UUID.test(id)) {
    const admin = await createServerAccountClient();
    const { data } = await admin.from("feed_items").select("title, city, budget, timing").eq("id", id).maybeSingle();
    if (data) {
      title = (data.title as string | null) ?? title;
      line = [data.city, data.budget, data.timing].filter(Boolean).join("  ·  ");
    }
  }
  if (title.length > 90) title = `${title.slice(0, 87)}…`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0f172a", padding: 64, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 700 }}>
            H
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Haaks</div>
        </div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", borderLeft: "10px solid #ea580c", paddingLeft: 36, marginTop: 40 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
          {line && <div style={{ marginTop: 24, fontSize: 36, color: "#fdba74" }}>{line}</div>}
        </div>
        <div style={{ fontSize: 28, color: "#cbd5e1" }}>Klussen voor ZZP-vakmensen · haaks</div>
      </div>
    ),
    size,
  );
}
