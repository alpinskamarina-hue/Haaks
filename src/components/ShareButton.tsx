"use client";

import { useEffect, useRef, useState } from "react";

type Labels = { share: string; more: string; copy: string; copied: string; email: string };

// «Share»: a small menu with WhatsApp, Telegram, Facebook, Viber, e-mail and copy link;
// on a phone also «Other apps», which opens the phone's own share sheet.
export function ShareButton({ url, text, labels, className }: { url: string; text: string; labels: Labels; className?: string }) {
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
    { label: "WhatsApp", icon: "🟢", href: `https://wa.me/?text=${both}` },
    { label: "Telegram", icon: "✈️", href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}` },
    { label: "Facebook", icon: "📘", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Viber", icon: "🟣", href: `viber://forward?text=${both}` },
    { label: labels.email, icon: "✉️", href: `mailto:?subject=${encodeURIComponent(text)}&body=${both}` },
  ];
  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={className ?? "rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700"}
      >
        ↗ {labels.share}
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}>
              <span aria-hidden>{l.icon}</span>
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
            <span aria-hidden>🔗</span>
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
              <span aria-hidden>📱</span>
              {labels.more}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
