"use client";

import { useFormStatus } from "react-dom";

// A submit button that is disabled while its form is being sent, so a second
// tap on a slow phone connection does not create the same thing twice.
export function SubmitButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-busy={pending} className={className}>
      {children}
    </button>
  );
}
