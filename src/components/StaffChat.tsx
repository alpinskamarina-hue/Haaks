"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendStaffMessage, staffCheckFeed, staffSendJob, staffSkipJob } from "@/app/staff-actions";
import { createClient } from "@/lib/supabase/client";
import { prepareUpload } from "@/lib/prepare-upload";
import type { StaffJob } from "@/lib/staff-feed";
import type { StaffDict, StaffFeedDict } from "@/lib/staff-i18n";
import type { StaffRateDict } from "@/lib/staff-rate-i18n";
import { StaffRate } from "@/components/StaffRate";
import { StaffDraftCard } from "@/components/StaffDraftCard";
import type { StaffDraftDict } from "@/lib/staff-draft-i18n";
import type { StaffDraft } from "@/lib/staff-tools";

export type ShownStaffMessage = {
  id: string;
  role: "user" | "staff";
  body: string;
  imageUrl: string | null;
  job?: StaffJob | null;
  draft?: string | null;
  jobStatus?: "new" | "sent" | "skipped" | null;
  feedItemId?: string | null;
  rating?: 1 | -1 | null;
  action?: StaffDraft | null;
  actionHref?: string | null;
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
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [sending, setSending] = useState<{ text: string; preview: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto({ file, preview: URL.createObjectURL(file) });
    if (!text.trim()) setText(d.prompts.letter);
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

  async function send() {
    if (sending || (!text.trim() && !photo)) return;
    setError(null);
    const shown = { text: text.trim(), preview: photo?.preview ?? null };
    setSending(shown);
    let imagePath: string | null = null;
    let mimeType: string | null = null;
    if (photo) {
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
      imagePath = path;
      mimeType = prepared.mimeType;
    }
    setText("");
    setPhoto(null);
    const res = await sendStaffMessage({ text: shown.text, imagePath, mimeType });
    if ("error" in res) setError(d.errors[res.error]);
    startTransition(() => {
      router.refresh();
      setSending(null);
    });
  }

  async function checkFeed() {
    if (checking) return;
    setChecking(true);
    setCheckNote(null);
    const res = await staffCheckFeed();
    setCheckNote("error" in res ? d.errors[res.error] : res.cards ? f.foundN.replace("{n}", String(res.cards)) : f.none);
    startTransition(() => {
      router.refresh();
      setChecking(false);
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
              {m.imageUrl && <img src={m.imageUrl} alt="" className="mb-2 max-h-48 rounded-xl" />}
              {m.body}
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className={bubbleStaff}>
                <Linked text={m.body} />
                {m.action && <StaffDraftCard messageId={m.id} draft={m.action} doneHref={m.actionHref ?? null} d={draftDict} />}
                <button type="button" onClick={() => copy(m)} className="mt-2 block text-xs font-medium text-orange-700">
                  📋 {copied === m.id ? d.copied : d.copy}
                </button>
                <StaffRate messageId={m.id} initial={m.rating ?? null} d={rate} />
              </div>
            </div>
          ),
        )}
        {sending && (
          <>
            <div className={bubbleUser}>
              {sending.preview && <img src={sending.preview} alt="" className="mb-2 max-h-48 rounded-xl" />}
              {sending.text}
            </div>
            <div className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">{fillName(d.thinking, name)}</div>
            </div>
          </>
        )}
        {checking && (
          <div className="flex items-end gap-2">
            <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
            <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">{fillName(f.checking, name)}</div>
          </div>
        )}
        {checkNote && !checking && <p className="text-center text-xs text-slate-500">{checkNote}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[calc(58px+env(safe-area-inset-bottom))] z-10 border-t bg-white p-3 lg:bottom-0">
        <button
          type="button"
          onClick={checkFeed}
          disabled={checking}
          className="mb-2 w-full rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800 disabled:opacity-60"
        >
          {f.checkNow}
        </button>
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
        {photo && (
          <div className="mb-2 flex items-center gap-2">
            <img src={photo.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
            <button type="button" onClick={() => setPhoto(null)} className="text-sm text-slate-500">
              ✕
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label={d.photo} className="pb-2 text-2xl">
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            maxLength={4000}
            placeholder={listening ? d.listening : d.placeholder}
            className="max-h-[45vh] min-h-[42px] flex-1 resize-none overflow-y-auto rounded-2xl bg-slate-100 px-4 py-2.5 text-sm leading-5"
          />
          {text.trim() || photo ? (
            <button type="button" onClick={send} disabled={Boolean(sending)} className="h-11 rounded-full bg-orange-600 px-4 font-semibold text-white disabled:opacity-60">
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
