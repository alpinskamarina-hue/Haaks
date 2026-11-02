// Sends e-mail through Resend (resend.com) with a plain HTTPS call, no extra package.
// RESEND_API_KEY and EMAIL_FROM come from the environment; without them nothing is sent.

export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  if (!emailEnabled()) return { ok: false as const, error: "RESEND_API_KEY or EMAIL_FROM is not set" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }),
  });
  if (!response.ok) return { ok: false as const, error: `Resend ${response.status}: ${await response.text()}` };
  return { ok: true as const };
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
