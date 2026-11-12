"use client";

import { useState } from "react";
import { rateStaffAnswer } from "@/app/staff-actions";
import { STAFF_RATE_REASONS, type StaffRateDict, type StaffRateReason } from "@/lib/staff-rate-i18n";

// Two small grey thumbs under an answer of the digital employee. A thumb down asks why (can be skipped).
export function StaffRate({ messageId, initial, d }: { messageId: string; initial: 1 | -1 | null; d: StaffRateDict }) {
  const [rating, setRating] = useState<1 | -1 | null>(initial);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState<StaffRateReason | null>(null);
  const [comment, setComment] = useState("");
  const [thanks, setThanks] = useState(false);

  async function save(value: 1 | -1, why: StaffRateReason | null = null, note = "") {
    const before = rating;
    setRating(value);
    const res = await rateStaffAnswer({ messageId, rating: value, reason: why, comment: note });
    if ("error" in res) {
      setRating(before);
      return;
    }
    setThanks(true);
    setTimeout(() => setThanks(false), 2000);
  }

  const thumb = (active: boolean) => `rounded-full px-2 py-0.5 text-base leading-none ${active ? "bg-slate-200" : "opacity-40 hover:opacity-80"}`;

  return (
    <div className="mt-1 whitespace-normal">
      <div className="flex items-center gap-1">
        <button type="button" aria-label={d.like} title={d.like} className={thumb(rating === 1)} onClick={() => (setAsking(false), save(1))}>
          👍
        </button>
        <button
          type="button"
          aria-label={d.dislike}
          title={d.dislike}
          className={thumb(rating === -1)}
          onClick={() => {
            setAsking(true);
            void save(-1);
          }}
        >
          👎
        </button>
        {thanks && !asking && <span className="text-xs text-slate-400">{d.thanks}</span>}
      </div>
      {asking && (
        <div className="mt-2 rounded-xl border bg-slate-50 p-2 text-xs">
          <p className="font-semibold text-slate-700">{d.why}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {STAFF_RATE_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-2.5 py-1 ${reason === r ? "border-orange-600 bg-orange-50 text-orange-800" : "bg-white text-slate-700"}`}
              >
                {d.reasons[r]}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={d.comment}
            className="mt-2 w-full rounded-lg border bg-white p-2 text-xs"
          />
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white"
              onClick={() => {
                setAsking(false);
                void save(-1, reason, comment);
              }}
            >
              {d.send}
            </button>
            <button type="button" className="text-slate-500 underline" onClick={() => setAsking(false)}>
              {d.skip}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{d.note}</p>
        </div>
      )}
    </div>
  );
}
