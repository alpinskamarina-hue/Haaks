import { GUIDE_IDS, GUIDE_META, getHelp } from "@/lib/help";
import { AI_LIMITS, PRICES } from "@/lib/plans";

// A map of the Haaks app for the digital employee, built from the in-app help guides,
// so it stays in step with them. Fixed text, sent together with the NL reference and cached.
function build() {
  const help = getHelp("en");
  const sections = GUIDE_IDS.map((id) => {
    const g = help.guides[id];
    return [
      `### ${g.title} — ${GUIDE_META[id].href}`,
      g.why,
      ...g.steps.map((s, i) => `${i + 1}. ${s}`),
      ...g.tips.map((t) => `Tip: ${t}`),
    ].join("\n");
  });
  return [
    "Pages of the Haaks app (paths open inside the app; give them exactly as written, e.g. /dashboard/quotes/new):",
    "- /dashboard home (jobs for you, to-do list, money overview)",
    "- /dashboard/leads/feed job feed · /dashboard/leads/firms firms nearby · /dashboard/replies my replies · /dashboard/search find builders",
    "- /dashboard/quotes quotes (offertes) · /dashboard/quotes/new new quote",
    "- /dashboard/orders orders · /dashboard/materials material lists",
    "- /dashboard/invoices invoices · /dashboard/invoices/new new invoice",
    "- /dashboard/accountant quarter folder for the accountant · /dashboard/trips trips (km) · /dashboard/cards shop cards",
    "- /dashboard/passport ZZP passport (documents) · /dashboard/works finished works · /dashboard/reviews reviews",
    "- /dashboard/profile profile shown to clients · /dashboard/settings settings (account, plan, notifications, feed, visibility)",
    "- /dashboard/helpers helpers and jobs from other builders · /dashboard/staff this chat · /dashboard/staff/settings employee settings",
    "- /dashboard/plan my plan · /pricing plans and prices · /dashboard/help all help guides",
    "",
    "Plans:",
    `- Free: own paperwork unlimited (profile, passport, quotes, invoices, orders); feed cards open 3 per 24 hours, contacts hidden; 3 job replies and 3 profile views per 24 hours; AI ${AI_LIMITS.free} times per 30 days.`,
    `- Pro (€${PRICES.pro.month}/month, founder price €${PRICES.pro.founder}): feed at once with contacts, push and Telegram alerts, unlimited replies; AI ${AI_LIMITS.pro} times per 30 days.`,
    `- Ultra (€${PRICES.ultra.month}/month, founder price €${PRICES.ultra.founder}): everything in Pro plus this digital employee; AI ${AI_LIMITS.ultra} times per 30 days.`,
    "",
    "How-to guides:",
    ...sections,
  ].join("\n");
}

export const STAFF_APP_GUIDE = build();
