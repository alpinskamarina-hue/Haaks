"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendStaffMessage, staffSendJob, staffSkipJob } from "@/app/staff-actions";
import { createClient } from "@/lib/supabase/client";
import { StaffWorkCard, type StaffWorkView } from "@/components/StaffWorkCard";
import type { StaffWorkDict } from "@/lib/staff-profile-i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import type { StaffJob } from "@/lib/staff-feed";
import type { StaffDict, StaffFeedDict } from "@/lib/staff-i18n";
import type { StaffRateDict } from "@/lib/staff-rate-i18n";
import { StaffRate } from "@/components/StaffRate";
import { StaffDraftCard } from "@/components/StaffDraftCard";
import type { StaffDraftDict } from "@/lib/staff-draft-i18n";
import type { StaffDraft } from "@/lib/staff-tools";
import { StaffProfileCard } from "@/components/StaffProfileCard";
import type { StaffDocDict, StaffOrderDict, StaffPriceDict, StaffProfileDict } from "@/lib/staff-profile-i18n";
import type { DocView, ProfileRow } from "@/lib/staff-profile-view";
import { StaffDocCard } from "@/components/StaffDocCard";
import { StaffOrderCard } from "@/components/StaffOrderCard";
import type { StaffOrderChange } from "@/lib/staff-orders";
import type { StaffTip } from "@/lib/staff-tips";
import type { StaffPriceChange } from "@/lib/staff-prices";
import { StaffPriceCard } from "@/components/StaffPriceCard";

export type ShownStaffMessage = {
  id: string;
  role: "user" | "staff";
  body: string;
  imageUrl: string | null;
  imageUrls?: string[];
  workCard?: StaffWorkView | null;
  job?: StaffJob | null;
  draft?: string | null;
  jobStatus?: "new" | "sent" | "skipped" | null;
  feedItemId?: string | null;
  rating?: 1 | -1 | null;
  action?: StaffDraft | null;
  actionHref?: string | null;
  profileRows?: ProfileRow[] | null;
  profileDone?: boolean;
  docView?: DocView | null;
  orderCard?: StaffOrderChange | null;
  tips?: StaffTip[] | null;
  priceCard?: StaffPriceChange | null;
};

const KIND_STYLE: Record<StaffJob["kind"], string> = {
  private: "bg-orange-100 text-orange-800",
  business: "bg-sky-100 text-sky-800",
  permit: "bg-emerald-100 text-emerald-800",
  tender: "bg-violet-100 text-violet-800",
};

// A job the employee brought from the feed: why it fits, the Dutch draft, and one main button.
function JobCard({ m, d, f, onDone }: { m: ShownStaffMessage; d: StaffDict; f: StaffFeedDict; onDone: () => void }) {
  const job = m.job!;
  const [draft, setDraft] = useState(m.draft ?? "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canSend = job.source === "client" || (job.source === "haaks" && job.kind === "business");
  const status = m.jobStatus ?? "new";
  const feedHref = m.feedItemId ? `/dashboard/leads/feed#job-${m.feedItemId}` : "/dashboard/leads/feed";

  async function send() {
    setBusy(true);
    setError(null);
    const res = await staffSendJob(m.id, draft);
    setBusy(false);
    if ("error" in res) return setError(f.errors[res.error]);
    onDone();
  }
  async function skip() {
    setBusy(true);
    await staffSkipJob(m.id);
    onDone();
  }
  async function copy() {
    await navigator.clipboard?.writeText(draft).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`w-[88%] rounded-2xl rounded-bl-sm bg-white p-3 text-sm shadow-sm ${status === "skipped" ? "opacity-60" : ""}`}>
      <p className="text-xs font-semibold text-slate-500">{f.found}</p>
      <div className="mt-2 rounded-xl border border-slate-200 p-3">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_STYLE[job.kind]}`}>{f.kinds[job.kind]}</span>
        <p className="mt-1.5 font-semibold leading-snug">{job.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {[job.city && `📍 ${job.city}`, job.budget && `💶 ${job.budget}`].filter(Boolean).join(" · ")}
        </p>
      </div>
      {m.body && <p className="mt-2 whitespace-pre-wrap">{m.body}</p>}
      {draft ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500">🇳🇱 {f.draftTitle}</p>
          {editing && status === "new" ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} maxLength={1000} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm" />
          ) : (
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-[13px] text-slate-700">{draft}</p>
          )}
          <div className="mt-1 flex gap-3 text-xs font-medium text-orange-700">
            <button type="button" onClick={copy}>
              📋 {copied ? d.copied : d.copy}
            </button>
            {status === "new" && !editing && (
              <button type="button" onClick={() => setEditing(true)}>
                {f.edit}
              </button>
            )}
          </div>
        </div>
      ) : (
        status === "new" && <p className="mt-2 text-xs text-slate-500">{f.noAI}</p>
      )}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {status === "sent" ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-700">{f.sent}</p>
      ) : status === "skipped" ? (
        <p className="mt-3 text-center text-xs text-slate-500">{f.skipped}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {canSend && draft ? (
            <button type="button" onClick={send} disabled={busy} className="w-full rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
              {busy ? "…" : job.source === "client" ? f.sendClient : f.sendCompany}
            </button>
          ) : (
            <Link href={feedHref} className="block w-full rounded-xl bg-orange-600 px-4 py-2.5 text-center font-semibold text-white">
              {f.openFeed}
            </Link>
          )}
          <div className="flex gap-2">
            {canSend && draft && (
              <Link href={feedHref} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-center text-xs">
                {f.openFeed}
              </Link>
            )}
            <button type="button" onClick={skip} disabled={busy} className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-600">
              {f.skip}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SPEECH: Record<string, string> = { ru: "ru-RU", uk: "uk-UA", pl: "pl-PL", ro: "ro-RO", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };

type Recognition = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: (e: { error: string }) => void; start: () => void; stop: () => void };

const MAX_PHOTOS = 6;

const fillName = (text: string, name: string) => text.replace("{name}", name);

export function StaffChat({
  d,
  f,
  name,
  face,
  userId,
  lang,
  messages,
  rate,
  draftDict,
  profileDict,
  docDict,
  orderDict,
  priceDict,
  workDict,
}: {
  d: StaffDict;
  f: StaffFeedDict;
  name: string;
  face: string;
  userId: string;
  lang: string;
  messages: ShownStaffMessage[];
  rate: StaffRateDict;
  draftDict: StaffDraftDict;
  profileDict: StaffProfileDict;
  docDict: StaffDocDict;
  orderDict: StaffOrderDict;
  priceDict: StaffPriceDict;
  workDict: StaffWorkDict;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [sending, setSending] = useState<{ text: string; previews: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<Recognition | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // The text box grows with the text (typed or dictated), up to about half the screen.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    el.scrollTop = el.scrollHeight;
  }, [text]);

  // The page itself scrolls; its true bottom shows the last message right above the input panel
  // (scrollIntoView on the last line would hide it under the sticky panel).
  const toBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight });
  const nearBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;

  // A new answer is «typed» on screen in about two seconds while the page follows it, so the
  // worker sees her writing without scrolling. Cards and buttons appear when the text is done.
  const [typing, setTyping] = useState<{ id: string; shown: number } | null>(null);
  const waitingFor = useRef<Set<string> | null>(null);

  useEffect(() => {
    toBottom();
  }, [messages.length, sending]);

  useEffect(() => {
    const before = waitingFor.current;
    if (!before) return;
    const fresh = [...messages].reverse().find((m) => m.role === "staff" && !m.job && !before.has(m.id));
    if (!fresh) return;
    waitingFor.current = null;
    if (fresh.body.length > 40) setTyping({ id: fresh.id, shown: 0 });
  }, [messages]);

  const typingLen = typing ? (messages.find((m) => m.id === typing.id)?.body.length ?? 0) : 0;
  useEffect(() => {
    if (!typing) return;
    if (typing.shown >= typingLen) {
      setTyping(null);
      requestAnimationFrame(toBottom);
      return;
    }
    const follow = nearBottom();
    const t = window.setTimeout(() => {
      setTyping({ id: typing.id, shown: typing.shown + Math.max(3, Math.ceil(typingLen / 70)) });
      if (follow) requestAnimationFrame(toBottom);
    }, 30);
    return () => window.clearTimeout(t);
  }, [typing, typingLen]);

  // Up to 6 photos per message (e.g. a finished job for «Мои работы»).
  function pickPhotos(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const next = [...photos, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS);
    setPhotos(next);
    if (!text.trim() && next.length === 1) setText(d.prompts.letter);
    if (fileRef.current) fileRef.current.value = "";
  }

  function mic() {
    const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return setError(d.errors.mic);
    if (listening) {
      recRef.current?.stop();
      return setListening(false);
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = SPEECH[lang] ?? "en-GB";
    rec.interimResults = false;
    rec.onresult = (e) => setText((t) => (t ? t + " " : "") + Array.from(e.results).map((r) => r[0].transcript).join(" "));
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== "no-speech" && e.error !== "aborted") setError(d.errors.mic);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      // Some phone browsers never fire onend: stop waiting after 30 seconds.
      window.setTimeout(() => {
        if (recRef.current === rec) {
          rec.stop();
          setListening(false);
        }
      }, 30000);
    } catch {
      setListening(false);
      setError(d.errors.mic);
    }
  }

  // preset: a tip button asks the employee with a ready text (no photo).
  async function send(preset?: string) {
    if (sending || (!preset && !text.trim() && !photos.length)) return;
    setError(null);
    const shown = { text: preset ?? text.trim(), previews: preset ? [] : photos.map((p) => p.preview) };
    setSending(shown);
    setTyping(null);
    waitingFor.current = new Set(messages.map((m) => m.id));
    const images: { path: string; mimeType: string }[] = [];
    for (const photo of preset ? [] : photos) {
      const prepared = await prepareUpload(photo.file);
      if ("error" in prepared || prepared.mimeType === "application/pdf") {
        setSending(null);
        return setError(d.errors.photo);
      }
      const path = `${userId}/staff/${crypto.randomUUID()}.${prepared.ext}`;
      const { error: upErr } = await createClient().storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
      if (upErr) {
        setSending(null);
        return setError(d.errors.photo);
      }
      images.push({ path, mimeType: prepared.mimeType });
    }
    if (!preset) {
      setText("");
      setPhotos([]);
    }
    const res = await sendStaffMessage({ text: shown.text, images });
    if ("error" in res) setError(d.errors[res.error]);
    startTransition(() => {
      router.refresh();
      setSending(null);
    });
  }

  const refresh = () => startTransition(() => router.refresh());

  async function copy(m: ShownStaffMessage) {
    await navigator.clipboard?.writeText(m.body).catch(() => {});
    setCopied(m.id);
    setTimeout(() => setCopied(null), 1500);
  }

  const bubbleStaff = "w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white p-3 text-sm shadow-sm";
  const bubbleUser = "ml-auto w-fit max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-orange-600 p-3 text-sm text-white";

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <div className="sticky top-[61px] z-10 flex items-center gap-3 border-b bg-white px-4 py-3 lg:top-0">
        <div className="relative">
          <img src={face} alt="" className="h-12 w-12 rounded-full object-cover" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{name}</p>
          <p className="text-xs text-slate-500">
            {d.role} · {d.online}
          </p>
        </div>
        <Link href="/dashboard/staff/settings" aria-label={d.settings} className="rounded-full border px-2.5 py-1.5 text-sm">
          ⚙
        </Link>
      </div>

      <div className="flex-1 space-y-3 bg-slate-50 p-3">
        <div className="flex items-end gap-2">
          <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
          <div className={bubbleStaff}>{fillName(d.hello, name)}</div>
        </div>
        {messages.map((m) =>
          m.job ? (
            <div key={m.id} className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <JobCard m={m} d={d} f={f} onDone={refresh} />
            </div>
          ) : m.role === "user" ? (
            <div key={m.id} className={bubbleUser}>
              {m.imageUrls && m.imageUrls.length > 1 ? (
                <div className="mb-2 grid grid-cols-3 gap-1">
                  {m.imageUrls.map((u) => (
                    <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                m.imageUrl && <img src={m.imageUrl} alt="" className="mb-2 max-h-48 rounded-xl" />
              )}
              {m.body}
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className={bubbleStaff}>
                {typing?.id === m.id ? (
                  <>
                    <Linked text={m.body.slice(0, typing.shown)} />
                    <span className="ml-0.5 inline-block animate-pulse text-orange-600">▍</span>
                  </>
                ) : (
                  <>
                <Linked text={m.body} />
                {m.tips && m.tips.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {m.tips.map((tip) => (
                      <button key={tip.ask} type="button" onClick={() => send(tip.ask)} disabled={Boolean(sending)} className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-left font-semibold text-orange-800 disabled:opacity-60">
                        {tip.button}
                      </button>
                    ))}
                  </div>
                )}
                {m.workCard && <StaffWorkCard messageId={m.id} view={m.workCard} d={workDict} />}
                {m.priceCard && <StaffPriceCard messageId={m.id} card={m.priceCard} doneHref={m.actionHref ?? null} d={priceDict} />}
                {m.orderCard && <StaffOrderCard messageId={m.id} card={m.orderCard} doneHref={m.actionHref ?? null} d={orderDict} />}
                {m.docView && <StaffDocCard messageId={m.id} view={m.docView} done={!!m.profileDone} d={docDict} />}
                {m.profileRows && <StaffProfileCard messageId={m.id} rows={m.profileRows} done={!!m.profileDone} d={profileDict} />}
                {m.action && <StaffDraftCard messageId={m.id} draft={m.action} doneHref={m.actionHref ?? null} d={draftDict} />}
                <button type="button" onClick={() => copy(m)} className="mt-2 block text-xs font-medium text-orange-700">
                  📋 {copied === m.id ? d.copied : d.copy}
                </button>
                <StaffRate messageId={m.id} initial={m.rating ?? null} d={rate} />
                  </>
                )}
              </div>
            </div>
          ),
        )}
        {sending && (
          <>
            <div className={bubbleUser}>
              {sending.previews.length > 1 ? (
                <div className="mb-2 grid grid-cols-3 gap-1">
                  {sending.previews.map((u) => (
                    <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                sending.previews[0] && <img src={sending.previews[0]} alt="" className="mb-2 max-h-48 rounded-xl" />
              )}
              {sending.text}
            </div>
            <div className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">{fillName(d.thinking, name)}</div>
            </div>
          </>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="sticky bottom-[calc(58px+env(safe-area-inset-bottom))] z-10 border-t bg-white p-3 lg:bottom-0">
        {!messages.length && !sending && (
          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700">
              {d.chips.letter}
            </button>
            {(["client", "contract", "btw"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setText(d.prompts[k])} className="rounded-full border border-orange-200 px-3 py-1 text-xs font-medium text-orange-700">
                {d.chips[k]}
              </button>
            ))}
          </div>
        )}
        {photos.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative">
                <img src={p.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  aria-label="✕"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xl text-slate-400">
                +
              </button>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label={d.photo} className="pb-2 text-2xl">
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pickPhotos(e.target.files)} />
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            maxLength={4000}
            placeholder={listening ? d.listening : d.placeholder}
            className="max-h-[45vh] min-h-[42px] flex-1 resize-none overflow-y-auto rounded-2xl bg-slate-100 px-4 py-2.5 text-sm leading-5"
          />
          {text.trim() || photos.length ? (
            <button type="button" onClick={() => send()} disabled={Boolean(sending)} className="h-11 rounded-full bg-orange-600 px-4 font-semibold text-white disabled:opacity-60">
              ➤
            </button>
          ) : (
            <button
              type="button"
              onClick={mic}
              aria-label={d.mic}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-lg text-white ${listening ? "animate-pulse bg-red-600" : "bg-orange-600"}`}
            >
              🎤
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">{d.disclaimer}</p>
      </div>
    </div>
  );
}

/** Turns in-app paths (/dashboard/…, /pricing) and https links in an answer into tappable links. */
const LINK_RE = /(https?:\/\/[^\s<>«»"]+|(?<![\w/])\/(?:dashboard|pricing|company)(?:\/[\w\-\/#?=&.]*)?)/g;
function Linked({ text }: { text: string }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const href = part.replace(/[.,;:!?)]+$/, "");
        const tail = part.slice(href.length);
        const cls = "font-medium text-orange-700 underline break-all";
        return (
          <span key={i}>
            {href.startsWith("/") ? (
              <Link href={href} className={cls}>{href}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{href}</a>
            )}
            {tail}
          </span>
        );
      })}
    </>
  );
}
