import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
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

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";

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
    model: MODEL,
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
    model: MODEL,
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
