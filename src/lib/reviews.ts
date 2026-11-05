// Client reviews: one per real Haaks deal (closed order or sent/paid invoice), written by the
// client on a one-time link without an account, public 48 hours after it was written.
export const MIN_REVIEWS_FOR_AVERAGE = 3;
export const CRITERIA = ["quality", "timing", "communication", "cleanliness"] as const;
export type Criterion = (typeof CRITERIA)[number];

export type Review = {
  id: string;
  worker_id: string;
  token: string;
  order_id: string | null;
  invoice_id: string | null;
  work_id: string | null;
  job_title: string;
  client_name: string | null;
  status: "requested" | "submitted" | "hidden";
  stars: number | null;
  quality: number | null;
  timing: number | null;
  communication: number | null;
  cleanliness: number | null;
  body: string | null;
  reviewer_name: string | null;
  reviewer_city: string | null;
  submitted_at: string | null;
  publish_at: string | null;
  created_at: string;
  reply?: string | null;
  reply_at?: string | null;
  report_reason?: ReportReason | null;
  report_note?: string | null;
  reported_at?: string | null;
  held?: boolean;
};

export const REVIEW_REPORT_REASONS = ["insult", "personal", "false", "not_client", "other"] as const;
export type ReportReason = (typeof REVIEW_REPORT_REASONS)[number];

export const isPublished = (r: Pick<Review, "status" | "publish_at" | "held">, now = new Date()) =>
  r.status === "submitted" && !r.held && !!r.publish_at && new Date(r.publish_at) <= now;

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

// Average stars and per-criterion averages of published reviews; the average is shown
// only from MIN_REVIEWS_FOR_AVERAGE reviews, so one review does not make or break a newcomer.
export function ratingSummary(reviews: Review[]) {
  const pub = reviews.filter((r) => isPublished(r) && r.stars);
  const criteria = Object.fromEntries(
    CRITERIA.map((c) => [c, avg(pub.flatMap((r) => (r[c] ? [r[c] as number] : [])))]),
  ) as Record<Criterion, number | null>;
  return {
    n: pub.length,
    avg: avg(pub.map((r) => r.stars as number)),
    showAverage: pub.length >= MIN_REVIEWS_FOR_AVERAGE,
    criteria,
    published: pub,
  };
}

export const ratingText = (x: number) => x.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Dutch message the builder sends the client with the review link.
export function reviewMessage(r: { clientName: string | null; title: string; link: string; workerName: string | null }) {
  return [
    r.clientName ? `Goedendag ${r.clientName},` : "Goedendag,",
    "",
    `Bedankt dat ik "${r.title}" voor u mocht doen. Wilt u in 1 minuut laten weten hoe het ging? Uw beoordeling helpt mij bij nieuwe opdrachtgevers.`,
    r.link,
    "",
    "Met vriendelijke groet,",
    r.workerName ?? "",
  ]
    .join("\n")
    .trim();
}

// "Jan de Vries" -> "Jan V.": reviewers are shown by first name and last initial only (AVG).
export function reviewerShort(name: string | null) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "—";
  if (words.length === 1) return words[0]!;
  const last = words[words.length - 1]!;
  return /\.$/.test(last) && last.length <= 3 ? `${words[0]} ${last}` : `${words[0]} ${last[0]!.toUpperCase()}.`;
}
