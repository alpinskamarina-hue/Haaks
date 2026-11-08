import { euro } from "@/lib/orders";

export type SendKind = "send" | "reminder1" | "reminder2";

type Input = {
  kind: SendKind;
  clientName: string | null;
  number: string;
  total: number;
  dueDate: string | null;
  sentAt: string | null;
  remindedAt: string | null;
  link: string;
  iban: string | null;
  // The builder's own payment link (bunq.me, Tikkie), when set.
  payLink?: string | null;
  company: string;
  worker: string | null;
  // On a corrected invoice: the Dutch line about the credit note that cancels the old one.
  credit?: string | null;
};

const nl = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });

// What to send next for this invoice: the invoice itself, then a polite and then a firmer reminder.
export function nextSendKind(invoice: { status: string; reminder_count: number }): SendKind {
  if (invoice.status === "draft") return "send";
  return invoice.reminder_count >= 1 ? "reminder2" : "reminder1";
}

export function invoiceSubject(kind: SendKind, number: string, company: string) {
  if (kind === "send") return `Factuur ${number} — ${company}`;
  if (kind === "reminder1") return `Herinnering factuur ${number}`;
  return `Tweede herinnering factuur ${number}`;
}

// The Dutch e-mail the builder sends to the client: the invoice, or a reminder to pay it.
export function invoiceEmail(i: Input) {
  const hello = i.clientName ? `Beste ${i.clientName},` : "Geachte heer/mevrouw,";
  const sum = euro(i.total);
  const direct = i.payLink ? [`Direct betalen kan ook via deze link: ${i.payLink}`] : [];
  const pay = i.iban ? `op rekeningnummer ${i.iban} t.n.v. ${i.company}, onder vermelding van ${i.number}` : `onder vermelding van ${i.number}`;
  const body =
    i.kind === "send"
      ? [
          `Hierbij stuur ik u factuur ${i.number} van ${sum}.`,
          `U kunt de factuur hier bekijken en als PDF opslaan: ${i.link}`,
          ...(i.credit ? ["", i.credit] : []),
          "",
          `Graag ontvang ik het bedrag${i.dueDate ? ` vóór ${nl(i.dueDate)}` : ""} ${pay}.`,
          ...direct,
          "",
          "Bedankt voor de opdracht.",
        ]
      : i.kind === "reminder1"
        ? [
            `Mogelijk is het aan uw aandacht ontsnapt: factuur ${i.number} van ${sum}${i.dueDate ? ` had op ${nl(i.dueDate)} betaald moeten zijn` : " staat nog open"}.`,
            "Volgens mijn administratie heb ik de betaling nog niet ontvangen.",
            "",
            `Wilt u het bedrag binnen 7 dagen overmaken ${pay}?`,
            ...direct,
            `De factuur: ${i.link}`,
            "",
            "Heeft u al betaald? Dan kunt u dit bericht als niet verzonden beschouwen.",
          ]
        : [
            `Op ${nl(i.remindedAt ?? i.sentAt ?? new Date().toISOString())} heb ik u een herinnering gestuurd voor factuur ${i.number} van ${sum}. Ik heb de betaling nog steeds niet ontvangen.`,
            "",
            `Ik verzoek u het bedrag uiterlijk binnen 7 dagen over te maken ${pay}.`,
            ...direct,
            `De factuur: ${i.link}`,
            "",
            "Is er een probleem met de factuur of het werk? Neem dan vandaag nog contact met mij op, dan zoeken we samen een oplossing.",
          ];
  return [hello, "", ...body, "", "Met vriendelijke groet,", i.worker || i.company].join("\n");
}
