/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { LANG_NAMES, LANGS } from "@/lib/i18n";
import { DEFAULT_NAMES, STAFF_FACES, STAFF_STYLES, faceUrl, staffOf } from "@/lib/staff";
import { getStaffDict, getStaffFeedDict } from "@/lib/staff-i18n";
import { loadWorkspace } from "@/lib/workspace";
import { saveStaffFeedRules, saveStaffSettings } from "../../../staff-actions";

// Face, name and manner of the worker's digital employee.
export default async function StaffSettingsPage() {
  const { profile, lang } = await loadWorkspace();
  const d = getStaffDict(lang);
  const s = staffOf(profile as Parameters<typeof staffOf>[0]);
  const ownName = (profile as { staff_name?: string | null }).staff_name ?? "";
  const f = getStaffFeedDict(lang);
  const rules = profile as { staff_feed?: boolean | null; staff_feed_max?: number | null; staff_feed_kinds?: string[] | null };
  const feedOn = rules.staff_feed ?? true;
  const feedMax = rules.staff_feed_max ?? 5;
  const feedKinds = rules.staff_feed_kinds ?? ["private", "business", "permit", "tender"];

  async function save(formData: FormData) {
    "use server";
    await saveStaffSettings(formData);
    await saveStaffFeedRules(formData);
    redirect("/dashboard/staff");
  }

  const choice = "block cursor-pointer rounded-lg border border-slate-300 py-2 text-center peer-checked:border-orange-600 peer-checked:bg-orange-600 peer-checked:text-white";

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <Link href="/dashboard/staff" className="text-sm text-orange-700">
        {d.back}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">⚙ {d.settingsTitle}</h1>
        <p className="text-sm text-slate-500">{d.settingsSub}</p>
      </div>
      <form action={save} className="space-y-5 text-sm">
        <fieldset>
          <legend className="font-semibold">{d.face}</legend>
          <div className="mt-2 grid grid-cols-4 gap-3">
            {STAFF_FACES.map((f) => (
              <label key={f} className="relative cursor-pointer">
                <input type="radio" name="face" value={f} defaultChecked={s.face === f} className="peer sr-only" />
                <img
                  src={faceUrl(f)}
                  alt={DEFAULT_NAMES[f]}
                  className="aspect-square w-full rounded-full object-cover ring-offset-2 peer-checked:ring-4 peer-checked:ring-orange-500"
                />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="font-semibold">{d.name}</span>
          <input name="name" defaultValue={ownName} placeholder={DEFAULT_NAMES[s.face]} maxLength={30} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <fieldset>
          <legend className="font-semibold">{d.address}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {[
              ["1", d.vy],
              ["0", d.ty],
            ].map(([v, label]) => (
              <label key={v}>
                <input type="radio" name="formal" value={v} defaultChecked={(v === "1") === s.formal} className="peer sr-only" />
                <span className={choice}>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">{d.style}</legend>
          <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
            {STAFF_STYLES.map((st) => (
              <label key={st}>
                <input type="radio" name="style" value={st} defaultChecked={s.style === st} className="peer sr-only" />
                <span className={choice}>{d.styles[st]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="font-semibold">{d.lang}</span>
          <select name="lang" defaultValue={s.lang ?? ""} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{d.langSame}</option>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </label>
        <fieldset id="feed" className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
          <legend className="px-1 font-semibold">📋 {f.rulesTitle}</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="feed_on" value="1" defaultChecked={feedOn} className="h-5 w-5 accent-orange-600" />
            {f.rulesOn}
          </label>
          <label className="block">
            {f.rulesMax}
            <select name="feed_max" defaultValue={String(feedMax)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
              {[3, 5, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p>{f.rulesKinds}</p>
            <div className="mt-1 space-y-1.5">
              {(["private", "business", "permit", "tender"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" name="feed_kind" value={k} defaultChecked={feedKinds.includes(k)} className="h-4 w-4 accent-orange-600" />
                  {f.kinds[k]}
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">🔒 {f.rulesNote}</p>
        </fieldset>
        <SubmitButton className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white">{d.save}</SubmitButton>
      </form>
    </main>
  );
}
