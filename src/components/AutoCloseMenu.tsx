"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// A <details> menu that closes by itself: after a tap on one of its items, on a tap outside it,
// and when the page changes (Nasim: the ☰ menu stayed open after choosing an item).
export function AutoCloseMenu({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);

  useEffect(() => {
    function outside(e: PointerEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  function onClick(e: React.MouseEvent<HTMLDetailsElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button") && !target.closest("summary") && ref.current) ref.current.open = false;
  }

  return (
    <details ref={ref} className={className} onClick={onClick}>
      {children}
    </details>
  );
}
