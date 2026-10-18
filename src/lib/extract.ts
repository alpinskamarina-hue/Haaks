import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { claudeModel } from "./env";
import { LANG_NAMES, type Lang } from "./i18n";

const ExtractedDocument = z.object({
  doc_type_detected: z.string(),
  holder_name: z.string().nullable(),
  company_name: z.string().nullable(),
  kvk_number: z.string().nullable(),
  btw_number: z.string().nullable(),
  document_number: z.string().nullable(),
  issued_on: z.string().nullable(),
  expires_on: z.string().nullable(),
  insurer: z.string().nullable(),
  coverage_amount: z.string().nullable(),
  summary: z.string(),
  warnings: z.array(z.string()),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocument>;


let client: Anthropic | null = null;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

function isImageType(mime: string): mime is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(mime);
}

function fileBlock(file: { base64: string; mimeType: string }): Anthropic.ContentBlockParam {
  return isImageType(file.mimeType)
    ? { type: "image", source: { type: "base64", media_type: file.mimeType, data: file.base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } };
}

// Reads a KvK extract, VCA certificate or insurance policy and returns its key fields.
export async function extractDocument(
  file: { base64: string; mimeType: string },
  expectedType: string,
  lang: Lang,
): Promise<ExtractedDocument | null> {
  const source = fileBlock(file);
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: claudeModel(),
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: zodOutputFormat(ExtractedDocument),
    },
    system:
      "You read Dutch business documents uploaded by self-employed construction workers (ZZP): " +
      "KvK extracts (uittreksel Handelsregister), VCA certificates (B-VCA, VOL-VCA, VIL-VCU) and " +
      "insurance policies (AVB bedrijfsaansprakelijkheid, CAR). Extract only what is printed on the document; " +
      "use null when a field is missing or unreadable. Dates must be YYYY-MM-DD. " +
      "For a KvK extract, issued_on is the extract date (datum uittreksel). " +
      "For insurance, expires_on is the end of the current insurance period if printed. " +
      `Write summary and warnings in ${LANG_NAMES[lang]}, in plain words a worker understands. ` +
      "Add a warning if the document is expired, unreadable, not the expected type, or seems to be an ID card or passport.",
    messages: [
      {
        role: "user",
        content: [
          source,
          {
            type: "text",
            text: `The worker uploaded this as: ${expectedType}. Extract the fields.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function cleanDate(value: string | null): string | null {
  return value && isoDate.test(value) && !Number.isNaN(Date.parse(value)) ? value : null;
}

const ExtractedReceipt = z.object({
  store_name: z.string().nullable(),
  store_city: z.string().nullable(),
  receipt_number: z.string().nullable(),
  purchased_on: z.string().nullable(),
  total_incl_vat: z.number().nullable(),
  total_excl_vat: z.number().nullable(),
  vat_total: z.number().nullable(),
  vat_lines: z.array(z.object({ rate: z.number(), base: z.number().nullable(), vat: z.number() })),
  items: z.array(
    z.object({ description: z.string(), quantity: z.number().nullable(), total: z.number().nullable() }),
  ),
  addressed_to_company: z.boolean().nullable(),
  summary: z.string(),
  warnings: z.array(z.string()),
});

export type ExtractedReceipt = z.infer<typeof ExtractedReceipt>;

// Reads a till receipt or purchase invoice from a building supplies store.
export async function extractReceipt(
  file: { base64: string; mimeType: string },
  companyName: string | null,
  lang: Lang,
): Promise<ExtractedReceipt | null> {
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: claudeModel(),
    max_tokens: 8000,
    output_config: {
      effort: "low",
      format: zodOutputFormat(ExtractedReceipt),
    },
    system:
      "You read purchase receipts (kassabon) and invoices (factuur) from Dutch building supplies stores " +
      "such as Hornbach, Gamma, Praxis, Bouwmaat, PontMeyer and Stiho, photographed or uploaded by a self-employed " +
      "construction worker. Extract only what is printed; use null when missing or unreadable. " +
      "Dates must be YYYY-MM-DD. Amounts are numbers in euros with a dot as decimal separator. " +
      "vat_lines lists each btw rate (21, 9 or 0) with its base amount and btw amount as printed. " +
      "items lists the purchased products with their line totals; keep product names as printed. " +
      "addressed_to_company is true only if the document is made out to a named business customer" +
      (companyName ? ` (the worker's company is "${companyName}")` : "") +
      ", false for an anonymous till receipt, null if unclear. " +
      `Write summary and warnings in ${LANG_NAMES[lang]}, in plain words a worker understands. ` +
      "Add a warning if the image is unreadable, the totals do not add up, it is not a receipt or invoice, " +
      "or it is an anonymous receipt above 100 euros (the worker may need an invoice in the company name to deduct btw).",
    messages: [
      {
        role: "user",
        content: [fileBlock(file), { type: "text", text: "Extract the receipt." }],
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

const DraftedQuote = z.object({
  title: z.string(),
  intro: z.string(),
  lines: z.array(
    z.object({
      kind: z.enum(["labour", "material", "other"]),
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      unit_price: z.number(),
      vat_rate: z.number(),
    }),
  ),
  notes: z.array(z.string()),
});

export type DraftedQuote = z.infer<typeof DraftedQuote>;

// Turns the worker's description and site photos into a first quote draft for the client.
export async function draftQuote(input: {
  description: string;
  photos: { base64: string; mimeType: string }[];
  hourlyRate: number;
  vatRate: number;
  clientName: string | null;
  address: string | null;
  lang: Lang;
}): Promise<DraftedQuote | null> {
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: claudeModel(),
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(DraftedQuote),
    },
    system:
      "You help a self-employed construction worker (ZZP) in the Netherlands write a quote (offerte) for a client. " +
      "The worker describes the job, possibly in their own language and possibly with photos of the site. " +
      "Write title, intro and every line description in clear, polite Dutch for the Dutch client. " +
      "Break the job into concrete lines: labour lines (kind labour, unit 'uur', unit_price = the worker's hourly rate), " +
      "material lines (kind material, realistic quantities with units like m², m, stuk, zak, liter, and typical current " +
      "Dutch building store prices excluding btw), and other costs such as waste removal or transport (kind other). " +
      "All unit_price values exclude btw. Use the given btw rate for every line unless the job clearly falls under " +
      "another Dutch rate. Do not invent work the description and photos do not support. " +
      "intro is two or three sentences restating what will be done. " +
      `notes are for the worker, written in ${LANG_NAMES[input.lang]}: list the assumptions you made ` +
      "(measurements read from photos, material choices, hours) and what the worker should check or ask the client " +
      "before sending. Keep each note short.",
    messages: [
      {
        role: "user",
        content: [
          ...input.photos.map(fileBlock),
          {
            type: "text",
            text:
              `Job description from the worker:\n${input.description}\n\n` +
              `Hourly rate excl. btw: €${input.hourlyRate}\nBtw rate: ${input.vatRate}%\n` +
              (input.clientName ? `Client: ${input.clientName}\n` : "") +
              (input.address ? `Site address: ${input.address}\n` : "") +
              "Draft the quote.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

const AnalyzedLead = z.object({
  is_job: z.boolean(),
  title: z.string(),
  summary: z.string(),
  trade: z.string().nullable(),
  city: z.string().nullable(),
  client_name: z.string().nullable(),
  client_contact: z.string().nullable(),
  timing: z.string().nullable(),
  match_score: z.number(),
  match_reason: z.string(),
  reply_nl: z.string().nullable(),
});

export type AnalyzedLead = z.infer<typeof AnalyzedLead>;

// Reads a post or message where someone looks for a builder and judges it for this worker.
export async function analyzeLead(input: {
  text: string;
  image: { base64: string; mimeType: string } | null;
  worker: { name: string | null; trade: string | null; city: string | null; regions: string | null };
  passportUrl: string | null;
  lang: Lang;
}): Promise<AnalyzedLead | null> {
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: claudeModel(),
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: zodOutputFormat(AnalyzedLead),
    },
    system:
      "You help a self-employed construction worker (ZZP) in the Netherlands find clients. You get a post, message " +
      "or publication (from a Facebook or Telegram group, WhatsApp, Marktplaats, an e-mail alert or a building permit " +
      "publication) and decide whether someone is looking for construction or renovation work to be done. " +
      "is_job is false for advertisements of builders offering services, permanent job vacancies, spam or unrelated posts. " +
      `Write title (max 8 words) and summary (2 or 3 sentences: what, where, when, size) in ${LANG_NAMES[input.lang]}. ` +
      "trade is the Dutch trade name (tegelzetter, timmerman, stukadoor, schilder, loodgieter, elektricien, " +
      "metselaar, dakdekker, klusjesman...). Copy client_name and client_contact (phone, e-mail) only if printed. " +
      "match_score 0-100: how well the job fits this worker's trade and regions; match_reason explains it in one " +
      `sentence in ${LANG_NAMES[input.lang]}. ` +
      "reply_nl: if is_job, a short polite reply in Dutch the worker can send themselves: greet, say what you can do, " +
      "ask one or two practical questions or propose to come and look, mention being a registered ZZP with KvK" +
      (input.passportUrl ? ` and include this link to the worker's documents: ${input.passportUrl}` : "") +
      ". No exaggerated claims. Otherwise null.",
    messages: [
      {
        role: "user",
        content: [
          ...(input.image ? [fileBlock(input.image)] : []),
          {
            type: "text",
            text:
              `Worker: ${input.worker.name ?? "—"}, trade: ${input.worker.trade ?? "unknown"}, ` +
              `based in ${input.worker.city ?? "unknown"}, works in: ${input.worker.regions ?? input.worker.city ?? "unknown"}.\n\n` +
              `Post:\n${input.text || "(see image)"}`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}
