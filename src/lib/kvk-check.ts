import type { Lang } from "@/lib/i18n";

// «KvK gecontroleerd» (research item 5): Haaks checked by hand on kvk.nl that the company's KvK number
// belongs to its name. Shown to builders on the company's jobs.
export const KVK_BADGE: Record<Lang, { badge: string; hint: string }> = {
  ru: { badge: "KvK проверен", hint: "Haaks проверил по реестру KvK, что номер принадлежит этой компании" },
  uk: { badge: "KvK перевірено", hint: "Haaks перевірив у реєстрі KvK, що номер належить цій компанії" },
  pl: { badge: "KvK sprawdzony", hint: "Haaks sprawdził w rejestrze KvK, że numer należy do tej firmy" },
  ro: { badge: "KvK verificat", hint: "Haaks a verificat în registrul KvK că numărul aparține acestei firme" },
  tr: { badge: "KvK doğrulandı", hint: "Haaks, numaranın bu şirkete ait olduğunu KvK kaydında kontrol etti" },
  en: { badge: "KvK checked", hint: "Haaks checked in the KvK register that the number belongs to this company" },
  nl: { badge: "KvK gecontroleerd", hint: "Haaks heeft in het KvK-register gecontroleerd dat het nummer bij dit bedrijf hoort" },
};

// For the company's own cabinet (Dutch or English).
export const KVK_STATUS: Record<"nl" | "en", { checked: string; waiting: string }> = {
  nl: {
    checked: "✓ KvK gecontroleerd door Haaks op {date}. Vakmensen zien dit bij je vacatures.",
    waiting: "Haaks controleert je KvK-nummer bij je eerste vacature. Daarna zien vakmensen «KvK gecontroleerd» bij je vacatures.",
  },
  en: {
    checked: "✓ KvK checked by Haaks on {date}. Builders see this on your jobs.",
    waiting: "Haaks checks your KvK number with your first job. After that builders see «KvK checked» on your jobs.",
  },
};
