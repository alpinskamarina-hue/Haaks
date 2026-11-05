"use client";

import { useEffect, useRef, useState } from "react";
import { shareJob } from "@/app/share-actions";
import { Icon } from "@/components/icons";
import type { JobShareDict } from "@/lib/job-share-i18n";

// Real logos (Simple Icons, CC0) in brand colours, so people recognise the app at once.
const BRANDS = {
  whatsapp: { color: "#25D366", d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" },
  telegram: { color: "#26A5E4", d: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  facebook: { color: "#0866FF", d: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" },
  viber: { color: "#7360F2", d: "M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z" },
} as const;

function Logo({ name }: { name: keyof typeof BRANDS }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden fill={BRANDS[name].color}>
      <path d={BRANDS[name].d} />
    </svg>
  );
}

// Plain line icons for e-mail, link and «other apps».
function Line({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-slate-500" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const MAIL = "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 1 9 7 9-7";
const LINK = "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1";
const MORE = "M6 12a1 1 0 1 0 0 .01M12 12a1 1 0 1 0 0 .01M18 12a1 1 0 1 0 0 .01";

type Labels = { share: string; more: string; copy: string; copied: string; email: string };

// «Отправить в Haaks»: send a feed job to a colleague by @nick.
export type HaaksShare = { itemId: string; t: JobShareDict; recent: { username: string; name: string }[] };

function SendInHaaks({ itemId, t, recent }: HaaksShare) {
  const [nick, setNick] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const clean = nick.trim().replace(/^@+/, "").toLowerCase();
  const picked = recent.find((r) => r.username === clean);
  const errors = { no_user: t.errNoUser, self: t.errSelf, closed: t.errClosed, limit: t.errLimit, locked: t.errLocked, failed: t.errFailed };

  async function send() {
    if (clean.length < 3 || busy) return;
    setBusy(true);
    setMsg(null);
    const res = await shareJob(itemId, clean, note).catch(() => ({ ok: false as const, error: "failed" as const }));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: (res.already ? t.already : t.sent).replace("{name}", res.name) });
      setNick("");
      setNote("");
    } else setMsg({ ok: false, text: errors[res.error] });
  }

  return (
    <div className="m-2 rounded-xl border-2 border-orange-500 bg-orange-50 p-2.5">
      <p className="mb-2 text-sm font-bold text-orange-900">👤 {t.sendTitle}</p>
      <label className="flex items-center rounded-lg border border-slate-300 bg-white px-2.5 focus-within:ring-2 focus-within:ring-orange-400">
        <span className="font-semibold text-slate-400">@</span>
        <input
          value={nick}
          onChange={(e) => {
            setNick(e.target.value.replace(/\s/g, ""));
            setMsg(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t.nickPh}
          maxLength={31}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2 pl-0.5 text-base outline-none"
        />
      </label>
      {recent.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recent.map((r) => (
            <button
              key={r.username}
              type="button"
              onClick={() => setNick(r.username)}
              className={`rounded-full border px-2.5 py-1 text-xs ${clean === r.username ? "border-orange-500 bg-orange-100 font-bold text-orange-900" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.notePh}
        maxLength={200}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
      />
      {msg && <p className={`mt-2 text-sm font-medium ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy || clean.length < 3}
        className="mt-2 w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? t.sending : picked ? t.sendTo.replace("{name}", picked.name) : t.send}
      </button>
    </div>
  );
}

// «Share»: a small menu with WhatsApp, Telegram, Facebook, Viber, e-mail and copy link;
// on a phone also «Other apps», which opens the phone's own share sheet.
export function ShareButton({
  url,
  text,
  labels,
  className,
  compact,
  haaks,
}: {
  url: string;
  text: string;
  labels: Labels;
  className?: string;
  // A quiet grey icon with a small caption, for the bottom row of a feed card.
  compact?: boolean;
  haaks?: HaaksShare;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [native, setNative] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setNative(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const u = encodeURIComponent(url);
  const both = encodeURIComponent(`${text}\n${url}`);
  const links = [
    { label: "WhatsApp", icon: <Logo name="whatsapp" />, href: `https://wa.me/?text=${both}` },
    { label: "Telegram", icon: <Logo name="telegram" />, href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}` },
    { label: "Facebook", icon: <Logo name="facebook" />, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Viber", icon: <Logo name="viber" />, href: `viber://forward?text=${both}` },
    { label: labels.email, icon: <Line d={MAIL} />, href: `mailto:?subject=${encodeURIComponent(text)}&body=${both}` },
  ];
  const item = "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={
          compact
            ? "flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
            : (className ?? "rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700")
        }
      >
        {compact ? <Icon name="share" className="h-5 w-5" /> : "↗"} {labels.share}
      </button>
      {open && (
        <div className={`absolute left-0 z-30 mt-1 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${haaks ? "w-72" : "w-56"}`}>
          {haaks && <SendInHaaks {...haaks} />}
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}>
              {l.icon}
              {l.label}
            </a>
          ))}
          <button
            type="button"
            className={item}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
          >
            <Line d={LINK} />
            {copied ? `✓ ${labels.copied}` : labels.copy}
          </button>
          {native && (
            <button
              type="button"
              className={`${item} border-t border-slate-100`}
              onClick={() => {
                setOpen(false);
                navigator.share({ title: text, text, url }).catch(() => {});
              }}
            >
              <Line d={MORE} />
              {labels.more}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
