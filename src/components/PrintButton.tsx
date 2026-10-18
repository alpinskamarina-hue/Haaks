"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm print:hidden"
    >
      🖨 {label}
    </button>
  );
}
