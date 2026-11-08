// The quarter folder for the accountant, prepared on the server. The browser draws the PDFs,
// fetches the receipt photos and packs the ZIP (a server response can't carry many photos).

import { csv, vatDeadline, type Quarter, type QuarterData } from "./accountant";
import type { Profile } from "./documents";
import { invoiceTotals, type Invoice } from "./invoices";
import { eur, nlDate, type OverviewInput } from "./invoice-pdf";
import { KM_RATE, toNum } from "./trips";
import { invoiceUbl } from "./ubl";

export type AccountantPack = {
  fileName: string;
  profile: Profile;
  invoices: { name: string; invoice: Invoice }[];
  receipts: { name: string; path: string }[];
  texts: Record<string, string>;
  overviewName: string;
  overview: OverviewInput;
};

const safe = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) || "bon";

export function buildPack(
  d: QuarterData,
  profile: Profile,
  q: Quarter,
): AccountantPack {
  const label = `Q${q.q} ${q.year}`;
  const texts: Record<string, string> = {};

  // Sales invoices (the PDFs are drawn in the browser).
  const invoices = d.invoices.map((i) => ({
    name: `Verkoopfacturen/Factuur ${safe(i.number)}.pdf`,
    invoice: i,
  }));
  // The same invoices as UBL e-invoices: accounting software reads them without typing.
  const byId = new Map(d.invoices.map((i) => [i.id, i]));
  for (const i of d.invoices) {
    const original = i.credit_for ? byId.get(i.credit_for) : null;
    texts[`Verkoopfacturen/Factuur ${safe(i.number)}.xml`] = invoiceUbl(i, profile, {
      creditFor: original ? { number: original.number, date: original.invoice_date } : null,
    });
  }
  texts["verkoopfacturen.csv"] = csv([
    [
      "Factuurnummer",
      "Datum",
      "Klant",
      "Btw-id klant",
      "Btw-regeling",
      "Excl. btw",
      "Btw",
      "Incl. btw",
      "Status",
      "Betaald op",
    ],
    ...d.invoices.map((i) => {
      const t = invoiceTotals(i.lines, i.vat_mode);
      return [
        i.number,
        nlDate(i.invoice_date),
        i.client_name,
        i.client_btw,
        { normal: "Btw", reverse: "Btw verlegd", kor: "KOR" }[i.vat_mode],
        t.excl,
        t.vat,
        t.incl,
        i.status === "paid" ? "Betaald" : "Open",
        nlDate(i.paid_at),
      ];
    }),
  ]);

  // Purchase receipts: the original photo or PDF, named by date and shop.
  const used = new Set<string>();
  const receiptName = new Map<string, string>();
  const receipts: { name: string; path: string }[] = [];
  d.receipts.forEach((r) => {
    const ext = (
      r.file_name.match(/\.[a-z0-9]{2,4}$/i)?.[0] ??
      (r.mime_type === "application/pdf" ? ".pdf" : ".jpg")
    ).toLowerCase();
    let name = `${r.purchased_on ?? r.created_at.slice(0, 10)} ${safe(r.store_name ?? "bon")}`;
    while (used.has(name)) name += " (2)";
    used.add(name);
    receiptName.set(r.id, `${name}${ext}`);
    receipts.push({ name: `Inkoopbonnen/${name}${ext}`, path: r.file_path });
  });
  texts["inkoopbonnen.csv"] = csv([
    [
      "Datum",
      "Winkel",
      "Plaats",
      "Bonnummer",
      "Excl. btw",
      "Btw",
      "Incl. btw",
      "Op bedrijfsnaam",
      "Bestand",
    ],
    ...d.receipts.map((r) => [
      nlDate(r.purchased_on ?? r.created_at),
      r.store_name,
      r.store_city,
      r.receipt_number,
      r.total_excl_vat === null ? null : toNum(r.total_excl_vat),
      r.vat_total === null ? null : toNum(r.vat_total),
      r.total_incl_vat === null ? null : toNum(r.total_incl_vat),
      r.addressed_to_company === null
        ? ""
        : r.addressed_to_company
          ? "Ja"
          : "Nee",
      receiptName.get(r.id),
    ]),
  ]);

  // Km log (rittenregistratie).
  if (d.trips.length)
    texts["kilometers.csv"] = csv([
      ["Datum", "Van", "Naar", "Retour", "Km", "Doel"],
      ...d.trips.map((t) => [
        nlDate(t.day),
        t.from_label,
        t.to_label,
        t.round_trip ? "Ja" : "Nee",
        toNum(t.km),
        t.purpose,
      ]),
    ]);

  // One-page btw overview.
  const rows: [string, string][] = [
    [`Verkoopfacturen (${d.invoices.length})`, eur(d.sales.incl)],
    ...d.sales.byRate.map(
      ([rate, v]) =>
        [`Omzet ${rate}% · btw`, `${eur(v.base)} · ${eur(v.vat)}`] as [
          string,
          string,
        ],
    ),
    ...(d.sales.reverse > 0
      ? [["Omzet btw verlegd", eur(d.sales.reverse)] as [string, string]]
      : []),
    ...(d.sales.kor > 0
      ? [["Omzet KOR (geen btw)", eur(d.sales.kor)] as [string, string]]
      : []),
    ["", ""],
    [`Inkoopbonnen (${d.receipts.length})`, eur(d.purchases.incl)],
    ["Voorbelasting (btw op bonnen)", eur(d.purchases.vat)],
    ["", ""],
    [
      d.toPay >= 0
        ? "Te betalen btw (schatting)"
        : "Terug te ontvangen btw (schatting)",
      eur(Math.abs(d.toPay)),
    ],
    ...(d.trips.length
      ? [
          ["", ""] as [string, string],
          [
            `Zakelijke kilometers (${d.trips.length} ritten)`,
            `${Math.round(d.km).toLocaleString("nl-NL")} km`,
          ] as [string, string],
        ]
      : []),
    ...(d.kmMoney !== null && d.trips.length
      ? [
          [
            `Kilometervergoeding × € ${KM_RATE.toFixed(2).replace(".", ",")}`,
            eur(d.kmMoney),
          ] as [string, string],
        ]
      : []),
  ];
  const notes = [
    "Samengesteld door Haaks uit de facturen, bonnen en ritten van de ondernemer. Controleer de bedragen vóór de aangifte.",
    ...(d.checks.unread.length
      ? [
          `${d.checks.unread.length} bon(nen) zonder gelezen bedrag; zie de map Inkoopbonnen.`,
        ]
      : []),
    ...(d.checks.notCompany.length
      ? [`${d.checks.notCompany.length} bon(nen) niet op naam van het bedrijf.`]
      : []),
    ...(d.checks.drafts.length
      ? [`${d.checks.drafts.length} conceptfactuur/-facturen niet meegenomen.`]
      : []),
  ];
  const overview: OverviewInput = {
    name: profile.company_name || profile.full_name || "",
    kvk: profile.kvk_number,
    btw: profile.btw_number,
    quarterLabel: label,
    deadline: vatDeadline(q),
    rows,
    notes,
  };

  const who = safe(profile.company_name || profile.full_name || "Haaks");
  return {
    fileName: `${who} ${label}.zip`,
    profile,
    invoices,
    receipts,
    texts,
    overviewName: `Btw-overzicht ${label}.pdf`,
    overview,
  };
}
