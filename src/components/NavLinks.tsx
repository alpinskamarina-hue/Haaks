"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";

// section: the path prefix that marks the item active, when it differs from href.
// also: more path prefixes that belong to the same item (passport: works and reviews).
// badge: a number (new jobs); dot: something waiting without a number (new leads).
// clearOn: once this page is opened the number is gone until the next full load.
export type NavItem = {
  href: string;
  section?: string;
  also?: string[];
  label: string;
  short?: string;
  icon: IconName;
  badge?: number;
  dot?: boolean;
  clearOn?: string;
};

// The layout stays on screen while the worker moves between pages, so the server's number
// would stay too: forget it once its page has been opened.
function useBadges(items: NavItem[]) {
  const pathname = usePathname();
  const [cleared, setCleared] = useState<string[]>([]);
  useEffect(() => {
    const hit = items.find((i) => i.clearOn && pathname.startsWith(i.clearOn));
    if (hit && !cleared.includes(hit.href)) setCleared((c) => [...c, hit.href]);
  }, [pathname, items, cleared]);
  const value = (item: NavItem) =>
    cleared.includes(item.href) || (item.clearOn && pathname.startsWith(item.clearOn)) ? 0 : (item.badge ?? 0);
  // The same number on the app icon of the home-screen app (where the phone supports it).
  const total = items.reduce((sum, item) => sum + value(item), 0);
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (total > 0) nav.setAppBadge?.(total).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [total]);
  return value;
}

const count = (n: number) => (n > 99 ? "99+" : String(n));

function isActive(pathname: string, { href, section, also }: NavItem) {
  if (href === "/dashboard") return pathname === href;
  return [section ?? href, ...(also ?? [])].some((p) => pathname.startsWith(p));
}

// Left column on large screens.
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const badge = useBadges(items);
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {badge(item) > 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{count(badge(item))}</span>
            ) : (
              item.dot && <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Thumb-reach tab bar on phones.
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const badge = useBadges(items);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
      <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-0.5 py-2 text-[10.5px] font-medium ${active ? "text-orange-600" : "text-slate-500"}`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
                <span className="w-full truncate text-center">{item.short ?? item.label}</span>
                {badge(item) > 0 ? (
                  <span className="absolute left-1/2 top-0.5 ml-1.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-white">
                    {count(badge(item))}
                  </span>
                ) : (
                  item.dot && <span className="absolute right-[22%] top-1 h-2.5 w-2.5 rounded-full bg-orange-600 ring-2 ring-white" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
