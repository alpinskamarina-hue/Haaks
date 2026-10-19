import Link from "next/link";

// Small line on the pages a worker shares with clients (passport, quote, invoice).
export function PublicFooter() {
  return (
    <p className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400 print:hidden">
      Gemaakt met Haaks ·{" "}
      <Link href="/privacy?v=nl" className="underline">
        Privacy
      </Link>{" "}
      ·{" "}
      <Link href="/terms?v=nl" className="underline">
        Voorwaarden
      </Link>
    </p>
  );
}
