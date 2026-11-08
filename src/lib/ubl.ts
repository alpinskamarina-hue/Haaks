// UBL 2.1 e-invoice (EN 16931, Dutch NLCIUS when both sides have a KvK number), for accounting software:
// Moneybird, e-Boekhouden, Exact, SnelStart, Twinfield and others read it in one go, so the accountant
// does not type invoices over. Credit notes are a UBL CreditNote with positive amounts.
import type { Profile } from "./documents";
import { invoiceTotals, vatNote, type Invoice } from "./invoices";
import { lineTotal } from "./quotes";

const x = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
const amt = (n: number) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
const qty = (n: number) => String(Math.round(n * 10000) / 10000);

// Units the app uses (Dutch) → UN/ECE Rec 20 codes.
const UNIT: Record<string, string> = {
  uur: "HUR",
  u: "HUR",
  dag: "DAY",
  dagen: "DAY",
  stuk: "H87",
  st: "H87",
  stuks: "H87",
  m: "MTR",
  "m¹": "MTR",
  "m²": "MTK",
  m2: "MTK",
  "m³": "MTQ",
  m3: "MTQ",
  kg: "KGM",
  l: "LTR",
  liter: "LTR",
};
export const unitCode = (unit: string) => UNIT[unit.trim().toLowerCase()] ?? "C62";

// "Kerkstraat 12, 3011 AB Rotterdam" → street, postcode, city (best effort; the rest stays in the street).
export function splitAddress(address: string | null | undefined) {
  const text = (address ?? "").replace(/\s*\n\s*/g, ", ").trim();
  const m = text.match(/^(.*?)[,\s]*\b(\d{4}\s?[A-Za-z]{2})\b[,\s]*(.*)$/);
  if (!m) return { street: text || null, postcode: null, city: null };
  return {
    street: m[1].replace(/[,\s]+$/, "") || null,
    postcode: m[2].toUpperCase().replace(/^(\d{4})\s?/, "$1 "),
    city: m[3].replace(/[,\s]+$/, "") || null,
  };
}

function address(text: string | null | undefined) {
  const a = splitAddress(text);
  return [
    "<cac:PostalAddress>",
    a.street ? `<cbc:StreetName>${x(a.street)}</cbc:StreetName>` : "",
    a.city ? `<cbc:CityName>${x(a.city)}</cbc:CityName>` : "",
    a.postcode ? `<cbc:PostalZone>${x(a.postcode)}</cbc:PostalZone>` : "",
    "<cac:Country><cbc:IdentificationCode>NL</cbc:IdentificationCode></cac:Country>",
    "</cac:PostalAddress>",
  ].join("");
}

const cleanKvk = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "").slice(0, 8);
const cleanBtw = (s: string | null | undefined) => (s ?? "").replace(/[\s.]/g, "").toUpperCase();

// Tax category per line: S standard, Z zero rate, AE reverse charge (btw verlegd), E exempt (KOR).
function category(invoice: Pick<Invoice, "vat_mode">, rate: number) {
  if (invoice.vat_mode === "reverse") return { id: "AE", rate: 0, reason: "Btw verlegd" };
  if (invoice.vat_mode === "kor") return { id: "E", rate: 0, reason: "Kleineondernemersregeling (KOR)" };
  return rate > 0 ? { id: "S", rate, reason: null } : { id: "Z", rate: 0, reason: null };
}

const taxCat = (tag: string, c: { id: string; rate: number; reason: string | null }) =>
  `<cac:${tag}><cbc:ID>${c.id}</cbc:ID><cbc:Percent>${c.rate}</cbc:Percent>${
    c.reason && tag === "TaxCategory" ? `<cbc:TaxExemptionReason>${x(c.reason)}</cbc:TaxExemptionReason>` : ""
  }<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:${tag}>`;

export function invoiceUbl(invoice: Invoice, profile: Profile, opts: { creditFor?: { number: string; date: string } | null } = {}) {
  const credit = !!invoice.credit_for;
  const sign = credit ? -1 : 1; // a credit note's lines are stored negative; UBL wants them positive
  // A price must not be negative in UBL: a discount line gets a negative quantity instead.
  const lines = invoice.lines.map((l) => {
    const q = sign * Number(l.quantity);
    const p = Number(l.unit_price);
    return p < 0 ? { ...l, quantity: -q, unit_price: -p } : { ...l, quantity: q, unit_price: p };
  });
  const totals = invoiceTotals(lines, invoice.vat_mode);
  const sellerKvk = cleanKvk(profile.kvk_number);
  const buyerKvk = cleanKvk(invoice.client_kvk);
  const nlcius = !!sellerKvk && !!buyerKvk;
  const root = credit ? "CreditNote" : "Invoice";
  const lineTag = credit ? "CreditNoteLine" : "InvoiceLine";
  const qtyTag = credit ? "CreditedQuantity" : "InvoicedQuantity";
  const seller = profile.company_name || profile.full_name || "ZZP";
  const iban = (profile.iban ?? "").replace(/\s/g, "").toUpperCase();

  // Tax subtotals per category and rate.
  const groups = new Map<string, { c: ReturnType<typeof category>; base: number }>();
  for (const l of lines) {
    const c = category(invoice, Number(l.vat_rate) || 0);
    const key = `${c.id}:${c.rate}`;
    const g = groups.get(key) ?? { c, base: 0 };
    g.base += lineTotal(l);
    groups.set(key, g);
  }
  const vatOf = (c: { id: string; rate: number }) =>
    c.id === "S" ? (totals.vatLines.find((v) => v.rate === c.rate)?.vat ?? 0) : 0;
  const notes = [vatNote(invoice), invoice.work_period ? `Periode: ${invoice.work_period}` : null, invoice.notes].filter(Boolean) as string[];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`,
    `<cbc:CustomizationID>${nlcius ? "urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0" : "urn:cen.eu:en16931:2017"}</cbc:CustomizationID>`,
    "<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>",
    `<cbc:ID>${x(invoice.number)}</cbc:ID>`,
    `<cbc:IssueDate>${invoice.invoice_date}</cbc:IssueDate>`,
    !credit && invoice.due_date ? `<cbc:DueDate>${invoice.due_date}</cbc:DueDate>` : "",
    credit ? "<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>" : "<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>",
    ...notes.map((n) => `<cbc:Note>${x(n)}</cbc:Note>`),
    "<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>",
    invoice.project_address ? `<cbc:BuyerReference>${x(invoice.project_address.slice(0, 100))}</cbc:BuyerReference>` : `<cbc:BuyerReference>${x(invoice.number)}</cbc:BuyerReference>`,
    opts.creditFor
      ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${x(opts.creditFor.number)}</cbc:ID><cbc:IssueDate>${opts.creditFor.date}</cbc:IssueDate></cac:InvoiceDocumentReference></cac:BillingReference>`
      : "",
    // Seller (the builder).
    "<cac:AccountingSupplierParty><cac:Party>",
    sellerKvk ? `<cac:PartyIdentification><cbc:ID schemeID="0106">${sellerKvk}</cbc:ID></cac:PartyIdentification>` : "",
    `<cac:PartyName><cbc:Name>${x(seller)}</cbc:Name></cac:PartyName>`,
    address(profile.business_address),
    profile.btw_number
      ? `<cac:PartyTaxScheme><cbc:CompanyID>${x(cleanBtw(profile.btw_number))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
      : "",
    `<cac:PartyLegalEntity><cbc:RegistrationName>${x(seller)}</cbc:RegistrationName>${
      sellerKvk ? `<cbc:CompanyID schemeID="0106">${sellerKvk}</cbc:CompanyID>` : ""
    }</cac:PartyLegalEntity>`,
    profile.phone || profile.business_email
      ? `<cac:Contact>${profile.phone ? `<cbc:Telephone>${x(profile.phone)}</cbc:Telephone>` : ""}${
          profile.business_email ? `<cbc:ElectronicMail>${x(profile.business_email)}</cbc:ElectronicMail>` : ""
        }</cac:Contact>`
      : "",
    "</cac:Party></cac:AccountingSupplierParty>",
    // Buyer.
    "<cac:AccountingCustomerParty><cac:Party>",
    buyerKvk ? `<cac:PartyIdentification><cbc:ID schemeID="0106">${buyerKvk}</cbc:ID></cac:PartyIdentification>` : "",
    `<cac:PartyName><cbc:Name>${x(invoice.client_name || "Klant")}</cbc:Name></cac:PartyName>`,
    address(invoice.client_address),
    invoice.client_btw
      ? `<cac:PartyTaxScheme><cbc:CompanyID>${x(cleanBtw(invoice.client_btw))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
      : "",
    `<cac:PartyLegalEntity><cbc:RegistrationName>${x(invoice.client_name || "Klant")}</cbc:RegistrationName>${
      buyerKvk ? `<cbc:CompanyID schemeID="0106">${buyerKvk}</cbc:CompanyID>` : ""
    }</cac:PartyLegalEntity>`,
    invoice.client_email ? `<cac:Contact><cbc:ElectronicMail>${x(invoice.client_email)}</cbc:ElectronicMail></cac:Contact>` : "",
    "</cac:Party></cac:AccountingCustomerParty>",
    // Payment by bank transfer, with the invoice number as reference.
    !credit && iban
      ? `<cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cbc:PaymentID>${x(invoice.number)}</cbc:PaymentID><cac:PayeeFinancialAccount><cbc:ID>${x(iban)}</cbc:ID><cbc:Name>${x(seller)}</cbc:Name></cac:PayeeFinancialAccount></cac:PaymentMeans>`
      : "",
    // Taxes.
    `<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">${amt(totals.vat)}</cbc:TaxAmount>`,
    ...[...groups.values()].map(
      (g) =>
        `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">${amt(g.base)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">${amt(vatOf(g.c))}</cbc:TaxAmount>${taxCat("TaxCategory", g.c)}</cac:TaxSubtotal>`,
    ),
    "</cac:TaxTotal>",
    "<cac:LegalMonetaryTotal>",
    `<cbc:LineExtensionAmount currencyID="EUR">${amt(totals.excl)}</cbc:LineExtensionAmount>`,
    `<cbc:TaxExclusiveAmount currencyID="EUR">${amt(totals.excl)}</cbc:TaxExclusiveAmount>`,
    `<cbc:TaxInclusiveAmount currencyID="EUR">${amt(totals.incl)}</cbc:TaxInclusiveAmount>`,
    `<cbc:PayableAmount currencyID="EUR">${amt(totals.incl)}</cbc:PayableAmount>`,
    "</cac:LegalMonetaryTotal>",
    ...lines.map((l, i) => {
      const c = category(invoice, Number(l.vat_rate) || 0);
      const name = (l.description.split("\n")[0] || "Werkzaamheden").slice(0, 200);
      return [
        `<cac:${lineTag}><cbc:ID>${i + 1}</cbc:ID>`,
        `<cbc:${qtyTag} unitCode="${unitCode(l.unit)}">${qty(Number(l.quantity))}</cbc:${qtyTag}>`,
        `<cbc:LineExtensionAmount currencyID="EUR">${amt(lineTotal(l))}</cbc:LineExtensionAmount>`,
        `<cac:Item>${l.description.length > name.length ? `<cbc:Description>${x(l.description.slice(0, 1000))}</cbc:Description>` : ""}<cbc:Name>${x(name)}</cbc:Name>${taxCat("ClassifiedTaxCategory", c)}</cac:Item>`,
        `<cac:Price><cbc:PriceAmount currencyID="EUR">${amt(Number(l.unit_price))}</cbc:PriceAmount></cac:Price>`,
        `</cac:${lineTag}>`,
      ].join("");
    }),
    `</${root}>`,
  ];
  return xml.filter(Boolean).join("\n");
}
