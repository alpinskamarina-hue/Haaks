import { redirect } from "next/navigation";
import { AnalyticsView, PERIODS, TABS, type Period, type Stats, type Tab } from "@/components/AnalyticsView";
import { dutchToday } from "@/lib/quotes";
import { dutchLocalToDate } from "@/lib/staff-reminders";
import { loadWorkspace } from "@/lib/workspace";

// «Аналитика»: visits, sources, pages, funnel and new people. Admin only (profiles.is_admin).
function range(period: Period) {
  const today = dutchToday();
  const back = (days: number) => dutchLocalToDate(`${dutchToday(new Date(Date.now() - days * 86_400_000))}T00:00`)!;
  const from = period === "today" ? dutchLocalToDate(`${today}T00:00`)! : period === "7" ? back(6) : period === "30" ? back(29) : new Date("2026-10-01T00:00:00Z");
  return { from, to: new Date(Date.now() + 60_000) };
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ tab?: string; period?: string }> }) {
  const { supabase, profile } = await loadWorkspace();
  if (!(profile as typeof profile & { is_admin?: boolean }).is_admin) redirect("/dashboard");
  const sp = await searchParams;
  const tab: Tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as Tab) : "overview";
  const period: Period = PERIODS.some(([k]) => k === sp.period) ? (sp.period as Period) : "7";
  const { from, to } = range(period);
  const { data, error } = await supabase.rpc("admin_analytics", { p_from: from.toISOString(), p_to: to.toISOString() });
  return <AnalyticsView s={(data as Stats | null) ?? null} failed={Boolean(error)} tab={tab} period={period} />;
}
