// The Dutch letter a builder leaves at an address with a building permit. Built from the
// permit card and the builder's profile; no AI needed.
import type { FeedItem } from "@/lib/feed";
import { getWorkerDict } from "@/lib/worker-profile-text";

export type LetterSender = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  kvk_number: string | null;
  trades: string[];
  passportUrl: string | null;
};

export type LetterAddress = { street: string; number: string; postcode: string; place: string };

// "Verbouwing, Kerkstraat (3011), Rotterdam" -> work "Verbouwing", street "Kerkstraat", pc4 "3011".
export function permitParts(item: Pick<FeedItem, "title" | "summary" | "city" | "timing">) {
  const parts = (item.title ?? "").split(",").map((p) => p.trim());
  const work = parts[0] ?? "";
  const spot = parts.length > 2 ? parts[1] : "";
  const street = spot.replace(/\(\d{4}\)/, "").trim();
  const pc4 = /\((\d{4})\)/.exec(spot)?.[1] ?? "";
  const granted = /verleend/i.test(`${item.summary ?? ""} ${item.timing ?? ""}`);
  const description = /«([^»]+)»/.exec(item.summary ?? "")?.[1] ?? "";
  return { work, street, pc4, granted, description, place: item.city ?? parts[parts.length - 1] ?? "" };
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function list(words: string[]) {
  return words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} en ${words[words.length - 1]}`;
}

export function ownerLetter(item: Pick<FeedItem, "title" | "summary" | "city" | "timing">, sender: LetterSender, today: string) {
  const p = permitParts(item);
  const names = getWorkerDict("nl").trades as Record<string, string>;
  const trades = sender.trades.filter((t) => t !== "other").map((t) => lower(names[t] ?? t));
  const what = p.description ? `«${p.description}»` : lower(p.work || "verbouwing");
  const name = sender.full_name?.trim() || "…";
  return {
    date: today,
    salutation: "Beste bewoner(s),",
    paragraphs: [
      `Ik zag dat er voor uw adres een omgevingsvergunning is ${p.granted ? "verleend" : "aangevraagd"} voor ${what}. Gefeliciteerd met uw plannen!`,
      `Mijn naam is ${name}. Ik ben zelfstandig vakman (ZZP)${trades.length ? ` – ${list(trades)}` : ""}${sender.city ? ` uit ${sender.city}` : ""}.${
        sender.kvk_number ? ` Ik sta ingeschreven bij de KvK onder nummer ${sender.kvk_number}.` : ""
      }`,
      "Gaat het werk binnenkort beginnen? Ik kom graag vrijblijvend langs om alles te bekijken en u een duidelijke offerte te sturen. Kleine en grote klussen zijn welkom.",
      sender.passportUrl
        ? "Op mijn ZZP-paspoort (QR-code hieronder) ziet u mijn documenten en foto's van eerder werk."
        : "",
    ].filter(Boolean),
    contact: [sender.phone ? `Bel of app: ${sender.phone}` : "", sender.email ? `E-mail: ${sender.email}` : ""].filter(Boolean),
    closing: "Met vriendelijke groet,",
    name,
  };
}
