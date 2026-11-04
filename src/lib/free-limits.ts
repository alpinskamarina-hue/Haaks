import type { SupabaseClient } from "@supabase/supabase-js";
import { claudeEnabled } from "@/lib/env";
import type { Lang } from "@/lib/i18n";

// Free plan: functions that bring work or cost Haaks money can be used 3 times per 24 hours
// (the database enforces it in use_free(); feed cards have their own counter). Pro has no limit.
export const FREE_LIMIT = 3;
export type FreeFeature = "job_reply" | "profile_view" | "ai";

export type FreeQuota = { left: number; hours: number; pro: boolean };

// What is left today for one function. hours = when the next use opens (0 while some are left).
export async function freeLeft(supabase: SupabaseClient, feature: FreeFeature): Promise<FreeQuota> {
  const { data } = await supabase.rpc("free_uses_left", { p_feature: feature }).maybeSingle<{ uses_left: number; next_at: string | null }>();
  const left = data?.uses_left ?? FREE_LIMIT;
  const hours = data?.next_at ? Math.max(1, Math.ceil((new Date(data.next_at).getTime() - Date.now()) / 3_600_000)) : 0;
  return { left: Math.min(left, FREE_LIMIT), hours, pro: left > FREE_LIMIT };
}

// Uses one function once; false when today's free uses are gone.
export async function spendFree(supabase: SupabaseClient, feature: FreeFeature, ref?: string) {
  const { error } = await supabase.rpc("use_free", { p_feature: feature, p_ref: ref ?? null });
  return !error;
}

// AI runs only when it is switched on and the account still has an AI use today.
// Without it the page works the same way as with AI switched off.
export async function aiAllowed(supabase: SupabaseClient) {
  return claudeEnabled() && (await spendFree(supabase, "ai"));
}

type LimitText = { left: string; none: string; pro: string };
const TEXT: Record<Lang, Record<FreeFeature, LimitText>> = {
  ru: {
    job_reply: { left: "Сегодня бесплатно осталось {n} из 3 откликов", none: "3 бесплатных отклика на сегодня использованы. Новый через {h} ч", pro: "Pro без ограничений" },
    profile_view: { left: "Сегодня бесплатно осталось {n} из 3 профилей", none: "3 бесплатных профиля на сегодня просмотрены. Новый через {h} ч", pro: "Pro без ограничений" },
    ai: { left: "Сегодня осталось {n} из 3 разборов ИИ", none: "3 разбора ИИ на сегодня использованы. Новый через {h} ч", pro: "Pro без ограничений" },
  },
  uk: {
    job_reply: { left: "Сьогодні безкоштовно залишилось {n} з 3 відгуків", none: "3 безкоштовні відгуки на сьогодні використано. Новий через {h} год", pro: "Pro без обмежень" },
    profile_view: { left: "Сьогодні безкоштовно залишилось {n} з 3 профілів", none: "3 безкоштовні профілі на сьогодні переглянуто. Новий через {h} год", pro: "Pro без обмежень" },
    ai: { left: "Сьогодні залишилось {n} з 3 розборів ШІ", none: "3 розбори ШІ на сьогодні використано. Новий через {h} год", pro: "Pro без обмежень" },
  },
  pl: {
    job_reply: { left: "Dziś zostało {n} z 3 darmowych zgłoszeń", none: "Dzisiejsze 3 darmowe zgłoszenia wykorzystane. Nowe za {h} godz.", pro: "Pro bez limitów" },
    profile_view: { left: "Dziś zostało {n} z 3 darmowych profili", none: "Dzisiejsze 3 darmowe profile obejrzane. Nowy za {h} godz.", pro: "Pro bez limitów" },
    ai: { left: "Dziś zostało {n} z 3 analiz AI", none: "Dzisiejsze 3 analizy AI wykorzystane. Nowa za {h} godz.", pro: "Pro bez limitów" },
  },
  ro: {
    job_reply: { left: "Azi mai ai {n} din 3 răspunsuri gratuite", none: "Cele 3 răspunsuri gratuite de azi sunt folosite. Următorul în {h} h", pro: "Pro fără limite" },
    profile_view: { left: "Azi mai ai {n} din 3 profiluri gratuite", none: "Cele 3 profiluri gratuite de azi sunt văzute. Următorul în {h} h", pro: "Pro fără limite" },
    ai: { left: "Azi mai ai {n} din 3 analize AI", none: "Cele 3 analize AI de azi sunt folosite. Următoarea în {h} h", pro: "Pro fără limite" },
  },
  tr: {
    job_reply: { left: "Bugün 3 ücretsiz başvurudan {n} kaldı", none: "Bugünkü 3 ücretsiz başvuru kullanıldı. Sonraki {h} saat sonra", pro: "Pro'da sınır yok" },
    profile_view: { left: "Bugün 3 ücretsiz profilden {n} kaldı", none: "Bugünkü 3 ücretsiz profil görüntülendi. Sonraki {h} saat sonra", pro: "Pro'da sınır yok" },
    ai: { left: "Bugün 3 yapay zekâ kontrolünden {n} kaldı", none: "Bugünkü 3 yapay zekâ kontrolü kullanıldı. Sonraki {h} saat sonra", pro: "Pro'da sınır yok" },
  },
  en: {
    job_reply: { left: "{n} of 3 free replies left today", none: "Today's 3 free replies are used. Next one in {h} h", pro: "Pro has no limits" },
    profile_view: { left: "{n} of 3 free profiles left today", none: "Today's 3 free profiles are viewed. Next one in {h} h", pro: "Pro has no limits" },
    ai: { left: "{n} of 3 AI checks left today", none: "Today's 3 AI checks are used. Next one in {h} h", pro: "Pro has no limits" },
  },
  nl: {
    job_reply: { left: "Nog {n} van 3 gratis reacties vandaag", none: "De 3 gratis reacties van vandaag zijn gebruikt. Volgende over {h} uur", pro: "Pro zonder limiet" },
    profile_view: { left: "Nog {n} van 3 gratis profielen vandaag", none: "De 3 gratis profielen van vandaag zijn bekeken. Volgende over {h} uur", pro: "Pro zonder limiet" },
    ai: { left: "Nog {n} van 3 AI-controles vandaag", none: "De 3 AI-controles van vandaag zijn gebruikt. Volgende over {h} uur", pro: "Pro zonder limiet" },
  },
};

export function limitText(lang: Lang, feature: FreeFeature) {
  return TEXT[lang][feature];
}
