"use client";

import { useEffect } from "react";

// Keeps <html lang> equal to the language the page is written in, so the
// browser does not offer to "translate" it and garble the interface.
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
