import type { Lang } from "@/lib/i18n";

// Texts of the draft card (invoice or quote) the digital employee prepares.
export type StaffDraftDict = { invoice: string; quote: string; total: string; create: string; open: string; note: string; failed: string };

const DICTS: Record<Lang, StaffDraftDict> = {
  ru: { invoice: "Черновик счёта", quote: "Черновик предложения", total: "Итого с btw", create: "Создать черновик", open: "Открыть и проверить", note: "Клиенту ничего не уйдёт, пока вы сами не отправите.", failed: "Не получилось создать. Попробуйте ещё раз." },
  uk: { invoice: "Чернетка рахунку", quote: "Чернетка пропозиції", total: "Разом з btw", create: "Створити чернетку", open: "Відкрити й перевірити", note: "Клієнту нічого не піде, поки ви самі не надішлете.", failed: "Не вдалося створити. Спробуйте ще раз." },
  pl: { invoice: "Szkic faktury", quote: "Szkic oferty", total: "Razem z btw", create: "Utwórz szkic", open: "Otwórz i sprawdź", note: "Nic nie trafi do klienta, dopóki sam tego nie wyślesz.", failed: "Nie udało się utworzyć. Spróbuj jeszcze raz." },
  ro: { invoice: "Ciornă de factură", quote: "Ciornă de ofertă", total: "Total cu btw", create: "Creează ciorna", open: "Deschide și verifică", note: "Nimic nu ajunge la client până nu trimiți tu.", failed: "Nu s-a putut crea. Încearcă din nou." },
  tr: { invoice: "Fatura taslağı", quote: "Teklif taslağı", total: "btw dahil toplam", create: "Taslağı oluştur", open: "Aç ve kontrol et", note: "Siz göndermeden müşteriye hiçbir şey gitmez.", failed: "Oluşturulamadı. Tekrar deneyin." },
  en: { invoice: "Draft invoice", quote: "Draft quote", total: "Total incl. btw", create: "Create draft", open: "Open and check", note: "Nothing goes to the client until you send it yourself.", failed: "Could not create it. Please try again." },
  nl: { invoice: "Conceptfactuur", quote: "Conceptofferte", total: "Totaal incl. btw", create: "Concept maken", open: "Openen en controleren", note: "Er gaat niets naar de klant tot je het zelf verstuurt.", failed: "Maken lukte niet. Probeer het opnieuw." },
};

export const getStaffDraftDict = (lang: Lang): StaffDraftDict => DICTS[lang] ?? DICTS.en;
