"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type NavItem = { href: string; label: string; short?: string; icon: IconName; badge?: number };

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

// Left column on large screens.
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
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
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
      <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-0.5 py-2 text-[10.5px] font-medium ${active ? "text-orange-600" : "text-slate-500"}`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
                <span className="w-full truncate text-center">{item.short ?? item.label}</span>
                {!!item.badge && (
                  <span className="absolute right-[22%] top-1 h-2.5 w-2.5 rounded-full bg-orange-600 ring-2 ring-white" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
