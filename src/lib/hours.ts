// Hours per order (step 1 of «часы → счёт»): grouping by ISO week for the order page and the invoice.

export type HourRow = {
  id: string;
  work_date: string;
  hours: number;
  note: string | null;
  invoice_id: string | null;
  approval_id?: string | null;
};

// ISO week number and the Monday of that week, for a yyyy-mm-dd date.
export function isoWeek(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday 0
  const monday = new Date(d.getTime() - day * 864e5);
  const thursday = new Date(monday.getTime() + 3 * 864e5);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.floor((thursday.getTime() - yearStart) / 864e5 / 7) + 1;
  return { week, year: thursday.getUTCFullYear(), monday: monday.toISOString().slice(0, 10) };
}

export type HourWeek = { key: string; week: number; from: string; to: string; hours: number; rows: HourRow[] };

// Newest week first; inside a week the days in order.
export function groupByWeek(rows: HourRow[]): HourWeek[] {
  const map = new Map<string, HourWeek>();
  for (const r of [...rows].sort((a, b) => a.work_date.localeCompare(b.work_date))) {
    const w = isoWeek(r.work_date);
    const key = `${w.year}-${w.week}`;
    const g = map.get(key) ?? { key, week: w.week, from: r.work_date, to: r.work_date, hours: 0, rows: [] };
    g.rows.push(r);
    g.hours = Math.round((g.hours + Number(r.hours)) * 100) / 100;
    g.to = r.work_date;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => b.from.localeCompare(a.from));
}

// "3–7 nov" in Dutch, for the invoice line.
export function dutchRange(from: string, to: string) {
  const f = (d: string, month: boolean) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("nl-NL", { day: "numeric", ...(month ? { month: "short" } : {}), timeZone: "UTC" });
  if (from === to) return f(from, true);
  return from.slice(0, 7) === to.slice(0, 7) ? `${f(from, false)}–${f(to, true)}` : `${f(from, true)} – ${f(to, true)}`;
}

export type HourApproval = {
  id: string;
  token: string;
  date_from: string;
  date_to: string;
  hours: number;
  status: "pending" | "approved" | "rejected";
  decided_name: string | null;
  comment: string | null;
  viewed_at: string | null;
  decided_at: string | null;
};

// The Dutch message the builder sends to the company with the link.
export function hoursMessage(i: { client: string | null; order: string; week: number; range: string; hours: string; link: string; worker: string }) {
  return [
    i.client ? `Beste ${i.client},` : "Goedendag,",
    "",
    `Hierbij mijn uren voor ${i.order}, week ${i.week} (${i.range}): ${i.hours} uur.`,
    `Wilt u ze controleren en akkoord geven via deze link: ${i.link}`,
    "",
    "Met vriendelijke groet,",
    i.worker,
  ].join("\n");
}
