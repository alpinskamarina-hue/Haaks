// The in-app help: one short guide per part of Haaks, in the builder's own language.
export const GUIDE_IDS = [
  "profile",
  "feed",
  "notify",
  "passport",
  "quotes",
  "orders",
  "materials",
  "invoices",
  "accountant",
  "trips",
  "reviews",
  "helpers",
  "plan",
] as const;
export type GuideId = (typeof GUIDE_IDS)[number];

export type Guide = { title: string; why: string; steps: string[]; tips: string[] };

export type HelpTexts = {
  ui: {
    title: string;
    intro: string;
    help: string;
    helpHere: string;
    all: string;
    open: string;
    how: string;
    tips: string;
    next: string;
    prev: string;
    askTitle: string;
    askText: string;
    askButton: string;
    startTitle: string;
    startText: string;
    mascotHello: string;
    mascotNext: string;
    together: string;
    stepHow: string;
    wnTitle: string;
    wnIntro: string;
    wnInvoices: string;
    wnAccountant: string;
    wnTrips: string;
    wnHelp: string;
    wnOk: string;
    wnAll: string;
  };
  guides: Record<GuideId, Guide>;
};
