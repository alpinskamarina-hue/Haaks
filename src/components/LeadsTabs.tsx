import Link from "next/link";

// "Job feed" and "My leads": the two halves of the Find clients section.
export function LeadsTabs({
  active,
  feedLabel,
  mineLabel,
  feedCount,
  mineCount,
}: {
  active: "feed" | "mine";
  feedLabel: string;
  mineLabel: string;
  feedCount: number;
  mineCount: number;
}) {
  const tab = (key: "feed" | "mine", href: string, label: string, count: number) => (
    <Link
      href={href}
      className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium sm:flex-none ${active === key ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
    >
      {label}{" "}
      {count > 0 &&
        (key === "feed" ? (
          <span className="ml-1 rounded-full bg-orange-600 px-1.5 text-xs text-white">{count}</span>
        ) : (
          <span className="opacity-70">{count}</span>
        ))}
    </Link>
  );
  return (
    <nav className="flex gap-1 rounded-xl bg-slate-200/70 p-1 sm:w-fit">
      {tab("feed", "/dashboard/leads/feed", feedLabel, feedCount)}
      {tab("mine", "/dashboard/leads", mineLabel, mineCount)}
    </nav>
  );
}
