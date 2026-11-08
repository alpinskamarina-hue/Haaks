"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";

// The digital employee always one tap away: a round face in the bottom-right corner that glows,
// blinks and sparkles. Hidden on its own chat page, where the input bar sits there.
export function StaffFab({ face, label }: { face: string; label: string }) {
  const path = usePathname();
  if (path.startsWith("/dashboard/staff")) return null;
  return (
    <Link
      href="/dashboard/staff"
      aria-label={label}
      title={label}
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-30 lg:bottom-6 lg:right-6 print:hidden"
    >
      <span className="staff-fab relative block h-16 w-16 rounded-full border-[3px] border-violet-500 bg-white p-0.5">
        <img src={face} alt="" className="h-full w-full rounded-full object-cover" />
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      </span>
      <span className="staff-spark pointer-events-none absolute -left-2 -top-2 text-lg">✨</span>
      <span className="staff-spark pointer-events-none absolute -right-2 top-1 text-sm [animation-delay:0.6s]">✨</span>
      <span className="staff-spark pointer-events-none absolute -left-1 bottom-0 text-xs [animation-delay:1.2s]">✨</span>
    </Link>
  );
}
