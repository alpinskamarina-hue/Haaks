"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

export type LoginMode = "signin" | "signup" | "forgot";

const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base";
const button = "w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60";
const linkButton = "text-left text-sm font-medium text-orange-700 underline-offset-2 hover:underline";

// Email + password sign-in and sign-up. A forgotten password falls back to a
// one-time login link that opens the page for setting a new password.
export function LoginForm({ t, initialMode = "signin" }: { t: Dict; initialMode?: LoginMode }) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchTo(next: LoginMode) {
    setMode(next);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return window.location.assign("/dashboard");
      setError(error.code === "invalid_credentials" ? t.wrongPassword : t.loginError);
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback },
      });
      if (error) {
        setError(
          error.code === "user_already_exists"
            ? t.userExists
            : error.code === "over_email_send_rate_limit"
              ? t.tooManyEmails
              : t.loginError,
        );
      } else if (data.session) {
        return window.location.assign("/dashboard");
      } else if (data.user && data.user.identities?.length === 0) {
        // With email confirmation on, Supabase hides existing accounts this way.
        setError(t.userExists);
      } else {
        setSent(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: `${callback}?next=/dashboard/password` },
      });
      // Unknown addresses also show "sent", so the form does not reveal who has an account.
      if (error?.code === "over_email_send_rate_limit") setError(t.tooManyEmails);
      else setSent(true);
    }
    setBusy(false);
  }

  if (sent) {
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
          className={input}
        />
      </label>
      {mode === "forgot" ? (
        <p className="text-sm text-slate-600">{t.forgotHint}</p>
      ) : (
        <label className="block text-sm font-medium">
          {t.passwordLabel}
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
          {mode === "signup" && <span className="mt-1 block text-xs text-slate-500">{t.passwordHint}</span>}
        </label>
      )}
      <button type="submit" disabled={busy} className={button}>
        {mode === "signin" ? t.signInButton : mode === "signup" ? t.signUpButton : t.sendLink}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-col items-start gap-2 pt-1">
        {mode !== "signup" && (
          <button type="button" onClick={() => switchTo("signup")} className={linkButton}>
            {t.toSignUp}
          </button>
        )}
        {mode !== "signin" && (
          <button type="button" onClick={() => switchTo("signin")} className={linkButton}>
            {mode === "forgot" ? t.backToSignIn : t.toSignIn}
          </button>
        )}
        {mode === "signin" && (
          <button type="button" onClick={() => switchTo("forgot")} className={linkButton}>
            {t.forgotPassword}
          </button>
        )}
      </div>
    </form>
  );
}
