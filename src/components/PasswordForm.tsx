"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

// Sets or changes the signed-in worker's password.
export function PasswordForm({ t }: { t: Dict }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "same" | "weak">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const { error } = await createClient().auth.updateUser({ password });
    // "same": the worker typed the password they already have, which works; say so instead of "failed".
    setState(!error ? "saved" : error.code === "same_password" ? "same" : error.code === "weak_password" ? "weak" : "error");
  }

  if (state === "saved") {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-green-800">{t.passwordSaved}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium">
        {t.newPasswordLabel}
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
        <span className="mt-1 block text-xs text-slate-500">{t.passwordHint}</span>
      </label>
      <button
        type="submit"
        disabled={state === "saving"}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {t.savePassword}
      </button>
      {state === "same" && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{t.passwordSame}</p>}
      {state === "weak" && <p className="text-sm text-red-700">{t.passwordWeak}</p>}
      {state === "error" && <p className="text-sm text-red-700">{t.passwordError}</p>}
    </form>
  );
}
