"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/feed-actions";

type Texts = {
  title: string;
  text: string;
  on: string;
  off: string;
  enabled: string;
  check: string;
  checked: string;
  denied: string;
  ios: string;
  unsupported: string;
  notReady: string;
};

type State = "loading" | "unsupported" | "ios" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// "Turn on notifications" for this phone. On iPhone push only works from the home-screen app.
// hideWhenOn: the reminder card on the home page disappears once this phone gets notifications.
export function PushToggle({ publicKey, t, hideWhenOn = false }: { publicKey: string | null; t: Texts; hideWhenOn?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(isIos() && !isStandalone() ? "ios" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    if (!publicKey) return setNote(t.notReady);
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const saved = await savePushSubscription(json);
      if (!saved.ok) return setNote(t.notReady);
      setState("on");
      await sendTestPush();
      setNote(t.checked);
    } catch (err) {
      console.error(err);
      setNote(t.notReady);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setNote(null);
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    setBusy(true);
    const result = await sendTestPush().catch(() => ({ ok: false }));
    setNote(result.ok ? t.checked : t.notReady);
    setBusy(false);
  }

  if (state === "loading") return null;
  if (hideWhenOn && (state === "on" || state === "unsupported")) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{t.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.text}</p>
      {body()}
    </section>
  );

  function body() {
    if (state === "unsupported") return <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{t.unsupported}</p>;
    if (state === "ios") return <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t.ios}</p>;
    if (state === "denied") return <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t.denied}</p>;
    return (
      <div className="mt-3 space-y-2 text-sm">
        {state === "on" ? (
          <>
            <p className="text-green-700">{t.enabled}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={check} disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">
                {t.check}
              </button>
              <button onClick={turnOff} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-60">
                {t.off}
              </button>
            </div>
          </>
        ) : (
          <button onClick={turnOn} disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
            🔔 {t.on}
          </button>
        )}
        {note && <p className="text-slate-600">{note}</p>}
      </div>
    );
  }
}
