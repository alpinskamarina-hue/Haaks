import type { LandingDict } from "@/lib/landing";

// Hero picture: what Haaks makes, as floating 3D cards. A new client job in
// front, with an invoice, a quote, a receipt and the ZZP passport behind it.
// Example documents stay in Dutch, as the client would see them.

const card = "absolute rounded-2xl bg-white text-slate-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]";

function Row({ left, right, bold }: { left: string; right: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-[11px] ${bold ? "font-bold" : "text-slate-600"}`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function HeroDocs({ lead }: { lead: LandingDict["leadCard"] }) {
  return (
    <div className="relative h-[310px] w-full sm:h-[480px]">
      <div className="absolute left-1/2 top-0 -ml-[270px] h-[480px] w-[540px] origin-top scale-[.64] [perspective:1400px] sm:scale-100">
        <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(8deg)_rotateY(-14deg)]">
          {/* Invoice */}
          <div className={`${card} right-0 top-0 w-[230px] p-4 [transform:translateZ(-60px)_rotate(4deg)] motion-safe:animate-[float_7s_ease-in-out_infinite]`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Factuur</span>
              <span className="text-[10px] text-slate-500">2026-014</span>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <div className="space-y-1.5">
              <Row left="Tegelwerk badkamer" right="€ 1.840,00" />
              <Row left="Voegwerk" right="€ 260,00" />
              <Row left="Btw verlegd" right="€ 0,00" />
            </div>
            <div className="my-2 h-px bg-slate-200" />
            <Row left="Totaal" right="€ 2.100,00" bold />
            <span className="mt-3 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Betaald
            </span>
          </div>

          {/* Quote */}
          <div className={`${card} left-0 top-6 w-[210px] p-4 [transform:translateZ(-90px)_rotate(-6deg)] motion-safe:animate-[float_8s_ease-in-out_infinite_.5s]`}>
            <span className="text-sm font-bold">Offerte</span>
            <p className="mt-1 text-[11px] text-slate-500">Keuken plaatsen, Amersfoort</p>
            <div className="mt-3 space-y-1.5">
              <Row left="Arbeid 3 dagen" right="€ 1.350" />
              <Row left="Materiaal" right="€ 420" />
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] text-white">✓</span>
              Akkoord door klant
            </div>
          </div>

          {/* Receipt */}
          <div className={`${card} bottom-2 left-6 w-[150px] rounded-b-none px-3 pb-5 pt-3 font-mono [transform:translateZ(-30px)_rotate(5deg)] motion-safe:animate-[float_6s_ease-in-out_infinite_1s]`}>
            <p className="text-center text-[11px] font-bold tracking-widest">BOUWMARKT</p>
            <div className="my-2 border-t border-dashed border-slate-300" />
            <div className="space-y-1">
              <Row left="Tegellijm" right="18,99" />
              <Row left="Voegmiddel" right="12,49" />
              <Row left="Kitpistool" right="9,95" />
            </div>
            <div className="my-2 border-t border-dashed border-slate-300" />
            <Row left="Totaal" right="41,43" bold />
            <Row left="btw 21%" right="7,19" />
            <div className="absolute -bottom-2 left-0 h-3 w-full bg-[linear-gradient(135deg,white_50%,transparent_50%),linear-gradient(225deg,white_50%,transparent_50%)] bg-[length:12px_12px] bg-repeat-x" />
          </div>

          {/* ZZP passport */}
          <div className={`${card} bottom-6 right-2 w-[190px] p-4 [transform:translateZ(-20px)_rotate(-3deg)] motion-safe:animate-[float_7.5s_ease-in-out_infinite_1.5s]`}>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-xs font-bold text-white">ZZP</span>
              <div>
                <p className="text-xs font-bold">ZZP-paspoort</p>
                <p className="text-[10px] text-slate-500">haaks.nl/p/…</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {["KvK", "VCA", "AVB"].map((d) => (
                <span key={d} className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  ✓ {d}
                </span>
              ))}
            </div>
          </div>

          {/* New client job: the main card */}
          <div className={`${card} left-[125px] top-[120px] w-[290px] p-5 ring-2 ring-orange-500 [transform:translateZ(90px)] shadow-[0_40px_80px_-20px_rgba(234,88,12,.55)] motion-safe:animate-[float_6s_ease-in-out_infinite_.2s]`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
              </span>
              {lead.found}
            </div>
            <p className="mt-2 text-lg font-bold leading-snug">Badkamer verbouwen</p>
            <p className="mt-0.5 text-xs text-slate-500">Utrecht · 12 m² tegels · start november</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-700">
                92% {lead.match}
              </span>
            </div>
            <div className="mt-4 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_0_#9a3412]">
              {lead.reply}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
