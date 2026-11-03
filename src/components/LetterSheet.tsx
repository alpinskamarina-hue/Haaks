import type { LetterAddress, ownerLetter } from "@/lib/owner-letter";

// The printed letter: an A4 sheet with the address block, the text, contacts and the passport QR code.
export function LetterSheet({
  letter,
  address,
  qr,
  passportUrl,
}: {
  letter: ReturnType<typeof ownerLetter>;
  address: LetterAddress;
  qr: string | null;
  passportUrl: string | null;
}) {
  return (
    <article lang="nl" className="mx-auto rounded-xl border border-slate-200 bg-white p-6 text-[15px] leading-relaxed text-slate-900 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p>Aan de bewoner(s) van</p>
          <p className="font-semibold">{[address.street, address.number].filter(Boolean).join(" ") || "…"}</p>
          <p>{[address.postcode, address.place].filter(Boolean).join(" ")}</p>
        </div>
        <p className="shrink-0 text-sm text-slate-500">{letter.date}</p>
      </div>
      <p className="mb-4">{letter.salutation}</p>
      {letter.paragraphs.map((text) => (
        <p key={text} className="mb-4">
          {text}
        </p>
      ))}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        {letter.contact.length > 0 && (
          <div className="rounded-lg bg-orange-50 px-4 py-3 font-semibold print:border print:border-slate-300 print:bg-white">
            {letter.contact.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
        {qr && (
          <div className="text-center text-xs text-slate-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR" className="mx-auto h-28 w-28" />
            <p className="mt-1 max-w-56 break-all">{passportUrl?.replace(/^https?:\/\//, "")}</p>
          </div>
        )}
      </div>
      <p>{letter.closing}</p>
      <p className="mt-1 font-semibold">{letter.name}</p>
    </article>
  );
}
