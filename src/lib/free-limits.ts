import type { SupabaseClient } from "@supabase/supabase-js";
import { claudeEnabled } from "@/lib/env";
import type { Lang } from "@/lib/i18n";

// Limits per plan (the database enforces them in use_free(); feed cards have their own counter):
// replies and profile views 3 per 24 hours on Free, no limit on Pro and Ultra;
// AI 3 (Free), 20 (Pro) or 300 (Ultra) per 30 days.
export const FREE_LIMIT = 3;
export type FreeFeature = "job_reply" | "profile_view" | "ai";

export type FreeQuota = { left: number; hours: number; pro: boolean; limit: number | null };

// What is left for one function. hours = when the next use opens (0 while some are left).
export async function freeLeft(supabase: SupabaseClient, feature: FreeFeature): Promise<FreeQuota> {
  const { data } = await supabase
    .rpc("plan_uses_left", { p_feature: feature })
    .maybeSingle<{ uses_left: number; uses_limit: number | null; next_at: string | null }>();
  const limit = data ? data.uses_limit : FREE_LIMIT;
  const left = data?.uses_left ?? FREE_LIMIT;
  const hours = data?.next_at ? Math.max(1, Math.ceil((new Date(data.next_at).getTime() - Date.now()) / 3_600_000)) : 0;
  return { left: limit === null ? left : Math.min(left, limit), hours, pro: limit === null, limit };
}

// Uses one function once; false when today's free uses are gone.
export async function spendFree(supabase: SupabaseClient, feature: FreeFeature, ref?: string) {
  const { error } = await supabase.rpc("use_free", { p_feature: feature, p_ref: ref ?? null });
  return !error;
}

// AI runs only when it is switched on and the account still has an AI use this month.
// Without it the page works the same way as with AI switched off.
export async function aiAllowed(supabase: SupabaseClient) {
  return claudeEnabled() && (await spendFree(supabase, "ai"));
}

type LimitText = { left: string; none: string; pro: string };
const TEXT: Record<Lang, Record<FreeFeature, LimitText>> = {
  ru: {
    job_reply: { left: "Сегодня бесплатно осталось {n} из 3 откликов", none: "3 бесплатных отклика на сегодня использованы. Новый через {h} ч", pro: "Pro без ограничений" },
    profile_view: { left: "Сегодня бесплатно осталось {n} из 3 профилей", none: "3 бесплатных профиля на сегодня просмотрены. Новый через {h} ч", pro: "Pro без ограничений" },
    ai: { left: "В этом месяце осталось {n} из {max} ИИ-действий", none: "ИИ-действия на этот месяц использованы. Новое через {d} дн.", pro: "Больше ИИ в Ultra" },
  },
  uk: {
    job_reply: { left: "Сьогодні безкоштовно залишилось {n} з 3 відгуків", none: "3 безкоштовні відгуки на сьогодні використано. Новий через {h} год", pro: "Pro без обмежень" },
    profile_view: { left: "Сьогодні безкоштовно залишилось {n} з 3 профілів", none: "3 безкоштовні профілі на сьогодні переглянуто. Новий через {h} год", pro: "Pro без обмежень" },
    ai: { left: "Цього місяця залишилось {n} з {max} дій ШІ", none: "Дії ШІ на цей місяць використано. Нова через {d} дн.", pro: "Більше ШІ в Ultra" },
  },
  pl: {
    job_reply: { left: "Dziś zostało {n} z 3 darmowych zgłoszeń", none: "Dzisiejsze 3 darmowe zgłoszenia wykorzystane. Nowe za {h} godz.", pro: "Pro bez limitów" },
    profile_view: { left: "Dziś zostało {n} z 3 darmowych profili", none: "Dzisiejsze 3 darmowe profile obejrzane. Nowy za {h} godz.", pro: "Pro bez limitów" },
    ai: { left: "W tym miesiącu zostało {n} z {max} działań AI", none: "Działania AI na ten miesiąc wykorzystane. Nowe za {d} dni", pro: "Więcej AI w Ultra" },
  },
  ro: {
    job_reply: { left: "Azi mai ai {n} din 3 răspunsuri gratuite", none: "Cele 3 răspunsuri gratuite de azi sunt folosite. Următorul în {h} h", pro: "Pro fără limite" },
    profile_view: { left: "Azi mai ai {n} din 3 profiluri gratuite", none: "Cele 3 profiluri gratuite de azi sunt văzute. Următorul în {h} h", pro: "Pro fără limite" },
    ai: { left: "Luna aceasta mai ai {n} din {max} acțiuni AI", none: "Acțiunile AI pe luna aceasta sunt folosite. Următoarea în {d} zile", pro: "Mai mult AI în Ultra" },
  },
  tr: {
    job_reply: { left: "Bugün 3 ücretsiz başvurudan {n} kaldı", none: "Bugünkü 3 ücretsiz başvuru kullanıldı. Sonraki {h} saat sonra", pro: "Pro'da sınır yok" },
    profile_view: { left: "Bugün 3 ücretsiz profilden {n} kaldı", none: "Bugünkü 3 ücretsiz profil görüntülendi. Sonraki {h} saat sonra", pro: "Pro'da sınır yok" },
    ai: { left: "Bu ay {max} yapay zekâ işleminden {n} kaldı", none: "Bu ayın yapay zekâ işlemleri kullanıldı. Sonraki {d} gün sonra", pro: "Ultra'da daha fazla yapay zekâ" },
  },
  en: {
    job_reply: { left: "{n} of 3 free replies left today", none: "Today's 3 free replies are used. Next one in {h} h", pro: "Pro has no limits" },
    profile_view: { left: "{n} of 3 free profiles left today", none: "Today's 3 free profiles are viewed. Next one in {h} h", pro: "Pro has no limits" },
    ai: { left: "{n} of {max} AI actions left this month", none: "This month's AI actions are used. Next one in {d} days", pro: "More AI with Ultra" },
  },
  nl: {
    job_reply: { left: "Nog {n} van 3 gratis reacties vandaag", none: "De 3 gratis reacties van vandaag zijn gebruikt. Volgende over {h} uur", pro: "Pro zonder limiet" },
    profile_view: { left: "Nog {n} van 3 gratis profielen vandaag", none: "De 3 gratis profielen van vandaag zijn bekeken. Volgende over {h} uur", pro: "Pro zonder limiet" },
    ai: { left: "Nog {n} van {max} AI-acties deze maand", none: "De AI-acties van deze maand zijn gebruikt. Volgende over {d} dagen", pro: "Meer AI met Ultra" },
  },
};

export function limitText(lang: Lang, feature: FreeFeature) {
  return TEXT[lang][feature];
}
