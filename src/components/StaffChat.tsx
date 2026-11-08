"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendStaffMessage } from "@/app/staff-actions";
import { createClient } from "@/lib/supabase/client";
import { prepareUpload } from "@/lib/prepare-upload";
import type { StaffDict } from "@/lib/staff-i18n";

export type ShownStaffMessage = { id: string; role: "user" | "staff"; body: string; imageUrl: string | null };

const SPEECH: Record<string, string> = { ru: "ru-RU", uk: "uk-UA", pl: "pl-PL", ro: "ro-RO", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };

type Recognition = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void; stop: () => void };

const fillName = (text: string, name: string) => text.replace("{name}", name);

export function StaffChat({ d, name, face, userId, lang, messages }: { d: StaffDict; name: string; face: string; userId: string; lang: string; messages: ShownStaffMessage[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [sending, setSending] = useState<{ text: string; preview: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages.length, sending]);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto({ file, preview: URL.createObjectURL(file) });
    if (!text.trim()) setText(d.prompts.letter);
  }

  function mic() {
    const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) return recRef.current?.stop();
    const rec = new Ctor();
    rec.lang = SPEECH[lang] ?? "en-GB";
    rec.interimResults = false;
    rec.onresult = (e) => setText((t) => (t ? t + " " : "") + Array.from(e.results).map((r) => r[0].transcript).join(" "));
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
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
          m.role === "user" ? (
            <div key={m.id} className={bubbleUser}>
              {m.imageUrl && <img src={m.imageUrl} alt="" className="mb-2 max-h-48 rounded-xl" />}
              {m.body}
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <img src={face} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className={bubbleStaff}>
                {m.body}
                <button type="button" onClick={() => copy(m)} className="mt-2 block text-xs font-medium text-orange-700">
                  📋 {copied === m.id ? d.copied : d.copy}
                </button>
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
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div ref={endRef} />
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            maxLength={4000}
            placeholder={listening ? d.listening : d.placeholder}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-2.5 text-sm"
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
