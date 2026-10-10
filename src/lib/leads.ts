export type Lead = {
  id: string;
  user_id: string;
  source: "manual" | "telegram" | "email" | "bekendmakingen";
  source_name: string | null;
  source_url: string | null;
  raw_text: string;
  image_path: string | null;
  ai_status: "pending" | "done" | "failed" | "skipped";
  is_job: boolean | null;
  title: string | null;
  summary: string | null;
  trade: string | null;
  city: string | null;
  client_name: string | null;
  client_contact: string | null;
  timing: string | null;
  match_score: number | null;
  match_reason: string | null;
  reply_nl: string | null;
  status: "new" | "replied" | "won" | "dismissed";
  order_id: string | null;
  created_at: string;
};

export const SOURCE_LABELS: Record<Lead["source"], string> = {
  manual: "✍",
  telegram: "Telegram",
  email: "E-mail",
  bekendmakingen: "Omgevingsvergunning",
};

// A phone number in the contact field becomes a WhatsApp link with the reply prefilled.
export function whatsappLink(contact: string | null, text: string | null) {
  const digits = contact?.replace(/[^\d+]/g, "") ?? "";
  const match = digits.match(/^(?:\+|00)?(31)?0?(6\d{8})$/);
  if (!match) return null;
  return `https://wa.me/31${match[2]}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function emailLink(contact: string | null, subject: string, text: string | null) {
  const email = contact?.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0];
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}${text ? `&body=${encodeURIComponent(text)}` : ""}`;
}

export function scoreColor(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-600";
  if (score >= 70) return "bg-green-100 text-green-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}
