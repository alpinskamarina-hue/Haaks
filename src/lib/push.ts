import webpush from "web-push";

// Web Push with our own VAPID keys (free, no app store). Vercel env:
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY; VAPID_SUBJECT is optional.
export const pushEnabled = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? null;

export type PushSubscriptionRow = { endpoint: string; user_id: string; p256dh: string; auth: string };
export type PushMessage = { title: string; body: string; url: string; count?: number; tag?: string };

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://haaks-nl.vercel.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

// gone: the phone removed the app or blocked notifications; the subscription can be deleted.
export async function sendPush(sub: PushSubscriptionRow, message: PushMessage) {
  configure();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(message),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true as const, gone: false };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode ?? 0;
    return { ok: false as const, gone: status === 404 || status === 410, status };
  }
}
