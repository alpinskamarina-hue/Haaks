"use client";

import { useState, useTransition } from "react";
import { likeQuote } from "@/app/quote-actions";
import { QUOTE_COOKIE } from "@/lib/daily-quotes";

type Labels = { title: string; share: string; hide: string; saved: string; brand: string };

// The 👍 number is shown once a few builders liked the phrase, so it never looks empty.
const SHOW_COUNT_FROM = 5;

// Break a phrase into lines that fit the picture.
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// A square picture of the phrase with the Haaks name, drawn in the phone (any language, no server).
async function makePicture(text: string, brand: string) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#fb923c");
  bg.addColorStop(1, "#9a3412");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(size - 60, 60, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "110px system-ui, sans-serif";
  ctx.fillText("☀️", 90, 220);
  let fontSize = 76;
  let lines: string[] = [];
  for (; fontSize >= 48; fontSize -= 4) {
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Roboto, sans-serif`;
    lines = wrap(ctx, text, size - 180);
    if (lines.length * fontSize * 1.25 < 560) break;
  }
  ctx.fillStyle = "#ffffff";
  const top = 290 + (560 - lines.length * fontSize * 1.25) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 90, top + (i + 1) * fontSize * 1.25 - fontSize * 0.25));
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(90, 945, 64, 64, 14);
  ctx.fill();
  ctx.fillStyle = "#ea580c";
  ctx.font = "800 40px system-ui, sans-serif";
  ctx.fillText("H", 108, 992);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText(brand, 176, 990);
  return new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
}

// «Фраза дня»: one short phrase on top of the home screen, 👍, share as a picture, ✕ until tomorrow.
export function DailyQuote({ day, dayLabel, text, labels, liked: likedAtStart, count }: { day: string; dayLabel: string; text: string; labels: Labels; liked: boolean; count: number }) {
  const [hidden, setHidden] = useState(false);
  const [liked, setLiked] = useState(likedAtStart);
  const [note, setNote] = useState<string | null>(null);
  const [, start] = useTransition();
  if (hidden) return null;
  const shown = count + (liked ? 1 : 0) - (likedAtStart ? 1 : 0);

  async function share() {
    const blob = await makePicture(text, labels.brand);
    if (!blob) return;
    const file = new File([blob], "haaks.png", { type: "image/png" });
    const message = `${text}\n— Haaks`;
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: message }).catch(() => {});
      return;
    }
    // Computer: save the picture.
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "haaks.png";
    a.click();
    setNote(labels.saved);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 p-4 text-white shadow-sm">
      <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <button
        type="button"
        aria-label={labels.hide}
        title={labels.hide}
        onClick={() => {
          document.cookie = `${QUOTE_COOKIE}=${day}; path=/; max-age=${2 * 86400}; samesite=lax`;
          setHidden(true);
        }}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-lg text-white/80 hover:bg-white/15"
      >
        ✕
      </button>
      <p className="text-xs font-bold uppercase tracking-wide text-white/90">☕ {labels.title}</p>
      <p className="mb-3 mt-2 pr-6 text-xl font-extrabold leading-snug">{text}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            const on = !liked;
            setLiked(on);
            start(() => likeQuote(on));
          }}
          className={`rounded-full px-3 py-1.5 font-semibold ${liked ? "bg-white text-orange-700" : "bg-white/20"}`}
        >
          👍{shown >= SHOW_COUNT_FROM ? ` ${shown}` : ""}
        </button>
        <button type="button" onClick={share} className="rounded-full bg-white/20 px-3 py-1.5 font-semibold">
          ↗ {labels.share}
        </button>
        <span className="ml-auto text-xs text-white/85">{note ?? dayLabel}</span>
      </div>
    </section>
  );
}
