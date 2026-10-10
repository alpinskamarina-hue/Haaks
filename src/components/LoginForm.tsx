"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

export function LoginForm({ t }: { t: Dict }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return <p className="rounded-lg bg-green-50 p-4 text-green-800">{t.linkSent}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium">
        {t.emailLabel}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {t.sendLink}
      </button>
      {state === "error" && <p className="text-sm text-red-700">{t.loginError}</p>}
    </form>
  );
}
