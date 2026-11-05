"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// "Jobs | Find builders" under the company header.
export function CompanyTabs({ jobs, builders }: { jobs: string; builders: string }) {
  const pathname = usePathname();
  const onBuilders = pathname.startsWith("/company/builders");
  const tab = (active: boolean) =>
    `flex-1 border-b-2 px-3 py-2.5 text-center text-sm font-semibold ${active ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500"}`;
  return (
    <nav className="mx-auto flex max-w-3xl px-4">
      <Link href="/company" className={tab(!onBuilders)}>
        📋 {jobs}
      </Link>
      <Link href="/company/builders" className={tab(onBuilders)}>
        👷 {builders}
      </Link>
    </nav>
  );
}
