"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

export type LoginMode = "signin" | "signup" | "forgot";

const input =
  "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base";
const button =
  "w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60";
const linkButton =
  "text-left text-sm font-medium text-orange-700 underline-offset-2 hover:underline";

// Email + password sign-in and sign-up. A forgotten password: Supabase emails a
// one-time code (and a login link); the code plus a new password signs in here.
export function LoginForm({
  t,
  initialMode = "signin",
  consent,
  heads,
}: {
  t: Dict;
  initialMode?: LoginMode;
  consent?: React.ReactNode;
  // Optional heading and short text per mode, shown above the fields.
  heads?: Record<"signin" | "signup", { title: string; text: string }>;
}) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // Forgot password: the code was sent, now ask for it and the new password.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function switchTo(next: LoginMode) {
    setMode(next);
    setError(null);
    setCodeSent(false);
    setCode("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback`;

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) return window.location.assign("/dashboard");
      setError(
        error.code === "invalid_credentials" ? t.wrongPassword : t.loginError,
      );
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
    } else if (!codeSent) {
      await sendCode();
      setBusy(false);
      return;
    } else {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) {
        setError(t.wrongCode);
      } else {
        const { error: saveError } = await supabase.auth.updateUser({
          password,
        });
        // A code that worked already signed the person in; if the new password
        // is refused (e.g. the same as the old one), they can set it later.
        if (saveError && saveError.code !== "same_password")
          return window.location.assign("/dashboard/password");
        return window.location.assign("/dashboard");
      }
    }
    setBusy(false);
  }

  async function sendCode() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/password`,
      },
    });
    if (!error) {
      setCodeSent(true);
      setCode("");
    } else if (error.code === "over_email_send_rate_limit")
      setError(t.tooManyEmails);
    // With sign-ups off for codes, Supabase answers this way for an unknown address.
    else if (
      error.code === "otp_disabled" ||
      /signups not allowed/i.test(error.message)
    )
      setError(t.noAccount);
    else setError(t.loginError);
  }

  const head = heads?.[mode === "signup" ? "signup" : "signin"];
  const heading = head && (
    <>
      <h2 className="text-2xl font-bold">{head.title}</h2>
      <p className="mb-5 mt-2 text-slate-600">{head.text}</p>
    </>
  );

  if (sent) {
    return (
      <>
        {heading}
        <p className="rounded-lg bg-green-50 p-4 text-green-800">
          {t.linkSent}
        </p>
      </>
    );
  }

  return (
    <>
      {heading}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          {t.emailLabel}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            readOnly={codeSent}
            onChange={(e) => setEmail(e.target.value)}
            className={`${input} read-only:bg-slate-100`}
          />
        </label>
        {mode === "forgot" && !codeSent && (
          <p className="text-sm text-slate-600">{t.forgotHint}</p>
        )}
        {mode === "forgot" && codeSent && (
          <>
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {t.codeSent}
            </p>
            <label className="block text-sm font-medium">
              {t.codeLabel}
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${input} tracking-[0.4em]`}
              />
            </label>
          </>
        )}
        {(mode !== "forgot" || codeSent) && (
          <label className="block text-sm font-medium">
            {mode === "forgot" ? t.newPasswordLabel : t.passwordLabel}
            <input
              type="password"
              required
              minLength={8}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
            {mode !== "signin" && (
              <span className="mt-1 block text-xs text-slate-500">
                {t.passwordHint}
              </span>
            )}
          </label>
        )}
        <button type="submit" disabled={busy} className={button}>
          {mode === "signin"
            ? t.signInButton
            : mode === "signup"
              ? t.signUpButton
              : codeSent
                ? t.setPasswordButton
                : t.sendCode}
        </button>
        {mode === "signup" && consent && (
          <p className="text-xs text-slate-500">{consent}</p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col items-start gap-2 pt-1">
          {mode === "forgot" && codeSent && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => sendCode()}
                className={linkButton}
              >
                {t.resendCode}
              </button>
              <button
                type="button"
                onClick={() => switchTo("forgot")}
                className={linkButton}
              >
                {t.otherEmail}
              </button>
            </>
          )}
          {mode !== "signup" && (
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className={linkButton}
            >
              {t.toSignUp}
            </button>
          )}
          {mode !== "signin" && (
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className={linkButton}
            >
              {mode === "forgot" ? t.backToSignIn : t.toSignIn}
            </button>
          )}
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => switchTo("forgot")}
              className={linkButton}
            >
              {t.forgotPassword}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
