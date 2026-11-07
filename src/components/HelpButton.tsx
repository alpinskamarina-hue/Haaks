"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { guideForPath } from "@/lib/help";

// «?»: opens the guide for the page the builder is on (or all guides on home).
export function helpHref(pathname: string) {
  const id = guideForPath(pathname);
  return id ? `/dashboard/help/${id}` : "/dashboard/help";
}

export function HelpButton({ label, variant }: { label: string; variant: "round" | "line" }) {
  const pathname = usePathname();
  const href = helpHref(pathname);
  if (variant === "line")
    return (
      <Link href={href} className="flex items-center gap-2 text-sm text-slate-600">
        ❓ {label}
      </Link>
    );
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-slate-300 text-base font-bold text-slate-600"
    >
      ?
    </Link>
  );
}
