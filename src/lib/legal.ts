// Legal pages: privacy statement, terms of use (with the data processing
// agreement) and cookies. The Dutch text is binding; English is a translation.
// Placeholders like {name} are filled from COMPANY in company.ts.
// Written without a lawyer: have it reviewed before paid plans start.

import type { Lang } from "./i18n";

export type LegalKind = "privacy" | "terms" | "cookies";
export type LegalLang = "nl" | "en";
type Section = { h: string; p: string[] };
export type LegalDoc = { title: string; updated: string; sections: Section[] };

const UPDATED_NL = "Laatst bijgewerkt: 19 oktober 2026";
const UPDATED_EN = "Last updated: 19 October 2026";

const privacyNl: LegalDoc = {
  title: "Privacyverklaring",
  updated: UPDATED_NL,
  sections: [
    {
      h: "1. Wie wij zijn",
      p: [
        "Haaks is een online dienst van {name}, ingeschreven bij de Kamer van Koophandel onder nummer {kvk}, gevestigd op {address}. Voor vragen over privacy mailt u naar {email}.",
        "Wij zijn verwerkingsverantwoordelijke voor de gegevens van uw account en profiel. Voor de gegevens van uw eigen klanten bent u zelf verantwoordelijk en zijn wij verwerker (zie artikel 4).",
      ],
    },
    {
      h: "2. Welke gegevens wij verwerken",
      p: [
        "Account: e-mailadres, wachtwoord (alleen versleuteld opgeslagen, wij kunnen het niet lezen) en taalkeuze.",
        "Profiel: naam, bedrijfsnaam, vak, plaats, telefoonnummer, KvK-nummer, btw-nummer, IBAN en adresgegevens die u op offertes en facturen zet.",
        "Documenten die u uploadt, zoals een KvK-uittreksel, VCA-certificaat en verzekeringspolissen, en de gegevens die daaruit worden gelezen (nummers, data, verzekeraar, dekking).",
        "Bonnetjes (foto's en gegevens zoals winkel, datum, bedragen en btw), opdrachten, offertes en facturen, inclusief de gegevens van uw klanten die u invult.",
        "Klusberichten en schermafbeeldingen die u zelf plakt om klanten te vinden. Daarin kunnen namen of contactgegevens van anderen staan.",
        "Technische gegevens: inlogcookies (zie de cookieverklaring) en, als iemand uw paspoortlink opent, het tijdstip en het type browser, zodat u ziet dat de link is bekeken.",
        "Wij hebben uw BSN, paspoort of identiteitskaart niet nodig. Upload die niet.",
      ],
    },
    {
      h: "3. Waarom en op welke grondslag",
      p: [
        "Om de dienst te leveren die u met ons afspreekt (uitvoering van de overeenkomst, art. 6 lid 1 sub b AVG): uw account, het opslaan van uw documenten, het maken van offertes en facturen en het delen van links.",
        "Voor de veiligheid van de dienst, het voorkomen van misbruik en het oplossen van fouten (gerechtvaardigd belang, art. 6 lid 1 sub f AVG).",
        "Als de wet ons verplicht gegevens te bewaren of te verstrekken (wettelijke plicht, art. 6 lid 1 sub c AVG).",
        "Wij verkopen uw gegevens niet, tonen geen advertenties en sturen geen marketing zonder uw toestemming.",
      ],
    },
    {
      h: "4. Gegevens van uw klanten en anderen",
      p: [
        "Gegevens van uw klanten en van anderen die u invoert (bijvoorbeeld op offertes, facturen of in klusberichten) verwerken wij alleen in uw opdracht. Daarvoor bent u verwerkingsverantwoordelijke en zijn wij verwerker. De afspraken daarover staan in artikel 12 van de gebruiksvoorwaarden.",
      ],
    },
    {
      h: "5. Automatisch lezen met AI",
      p: [
        "Om documenten, bonnetjes en klusberichten automatisch te lezen en teksten in het Nederlands op te stellen, sturen wij de betreffende inhoud naar de AI-dienst van Anthropic (Claude). Anthropic gebruikt deze gegevens volgens zijn zakelijke voorwaarden niet om zijn modellen te trainen.",
        "AI kan fouten maken. Controleer de uitkomst altijd zelf. De score die laat zien of een klus bij u past, is alleen een advies. Er worden geen besluiten met rechtsgevolgen automatisch over u genomen.",
      ],
    },
    {
      h: "6. Wie uw gegevens nog meer verwerkt",
      p: [
        "Supabase: database, opslag van bestanden en het versturen van inlogmails. Uw gegevens staan op servers in Frankfurt, Duitsland.",
        "Vercel: hosting van de website, in de regio Frankfurt.",
        "Anthropic: automatisch lezen en schrijven met AI (artikel 5).",
        "Met deze partijen hebben wij verwerkersafspraken. Zij zijn (ook) in de Verenigde Staten gevestigd. Voor doorgifte buiten de Europese Economische Ruimte gelden de standaardcontractbepalingen van de Europese Commissie of een ander passend waarborg volgens de AVG.",
        "Wij geven gegevens alleen aan anderen als u dat zelf doet (bijvoorbeeld door een link te delen) of als de wet ons daartoe verplicht.",
      ],
    },
    {
      h: "7. Hoe lang wij gegevens bewaren",
      p: [
        "Zolang uw account bestaat. Als u vraagt om uw account te verwijderen, wissen wij uw gegevens binnen 30 dagen, behalve wat wij wettelijk langer moeten bewaren.",
        "Let op: als ondernemer moet u uw administratie, zoals facturen en bonnetjes, zelf 7 jaar bewaren. Download die dus voordat u uw account verwijdert.",
      ],
    },
    {
      h: "8. Beveiliging",
      p: [
        "Alle verbindingen zijn versleuteld (HTTPS). Elke gebruiker ziet alleen zijn eigen gegevens. Wachtwoorden worden niet leesbaar opgeslagen.",
        "Uw paspoort-, offerte- en factuurlinks bevatten een lange willekeurige code. Iedereen met de link kan de pagina zien, dus deel die alleen met wie het nodig heeft. U kunt uw paspoortlink op elk moment uitzetten.",
      ],
    },
    {
      h: "9. Uw rechten",
      p: [
        "U hebt het recht op inzage, correctie, verwijdering, beperking van de verwerking, overdracht van uw gegevens en bezwaar. Stuur uw verzoek naar {email}. Wij reageren binnen een maand.",
        "Bent u niet tevreden over hoe wij met uw gegevens omgaan, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).",
      ],
    },
    {
      h: "10. Wijzigingen",
      p: [
        "Wij kunnen deze verklaring aanpassen. De nieuwste versie staat altijd op deze pagina. Bij belangrijke wijzigingen sturen wij u een e-mail.",
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  title: "Privacy statement",
  updated: UPDATED_EN,
  sections: [
    {
      h: "1. Who we are",
      p: [
        "Haaks is an online service of {name}, registered with the Dutch Chamber of Commerce (KvK) under number {kvk}, at {address}. For privacy questions, email {email}.",
        "We are the controller of your account and profile data. For the data of your own clients you are the controller and we are the processor (see section 4).",
      ],
    },
    {
      h: "2. What data we process",
      p: [
        "Account: email address, password (stored only in encrypted form, we cannot read it) and language.",
        "Profile: name, company name, trade, city, phone number, KvK number, VAT number, IBAN and the address details you put on quotes and invoices.",
        "Documents you upload, such as a KvK extract, VCA certificate and insurance policies, and the details read from them (numbers, dates, insurer, coverage).",
        "Receipts (photos and details such as store, date, amounts and VAT), jobs, quotes and invoices, including your clients' details that you enter.",
        "Job posts and screenshots you paste yourself to find clients. These may contain names or contact details of other people.",
        "Technical data: login cookies (see the cookie statement) and, when someone opens your passport link, the time and the browser type, so you can see that the link was viewed.",
        "We do not need your BSN, passport or ID card. Please do not upload them.",
      ],
    },
    {
      h: "3. Why and on what legal basis",
      p: [
        "To provide the service you agree with us (performance of the contract, Art. 6(1)(b) GDPR): your account, storing your documents, making quotes and invoices and sharing links.",
        "For the security of the service, preventing misuse and fixing errors (legitimate interest, Art. 6(1)(f) GDPR).",
        "When the law requires us to keep or provide data (legal obligation, Art. 6(1)(c) GDPR).",
        "We do not sell your data, show no ads and send no marketing without your consent.",
      ],
    },
    {
      h: "4. Data of your clients and others",
      p: [
        "We process the data of your clients and other people that you enter (for example on quotes, invoices or in job posts) only on your behalf. For that data you are the controller and we are the processor. The agreement on this is in section 12 of the terms of use.",
      ],
    },
    {
      h: "5. Automatic reading with AI",
      p: [
        "To read documents, receipts and job posts automatically and to write texts in Dutch, we send the relevant content to the AI service of Anthropic (Claude). Under its commercial terms, Anthropic does not use this data to train its models.",
        "AI can make mistakes. Always check the result yourself. The score that shows whether a job fits you is only advice. No decisions with legal effects are made about you automatically.",
      ],
    },
    {
      h: "6. Who else processes your data",
      p: [
        "Supabase: database, file storage and sending login emails. Your data is stored on servers in Frankfurt, Germany.",
        "Vercel: hosting of the website, in the Frankfurt region.",
        "Anthropic: automatic reading and writing with AI (section 5).",
        "We have data processing agreements with these parties. They are (also) based in the United States. Transfers outside the European Economic Area are covered by the European Commission's standard contractual clauses or another appropriate safeguard under the GDPR.",
        "We only share data with others when you do so yourself (for example by sharing a link) or when the law requires it.",
      ],
    },
    {
      h: "7. How long we keep data",
      p: [
        "As long as your account exists. If you ask us to delete your account, we erase your data within 30 days, except what the law requires us to keep longer.",
        "Please note: as a business owner you must keep your records, such as invoices and receipts, for 7 years yourself. Download them before you delete your account.",
      ],
    },
    {
      h: "8. Security",
      p: [
        "All connections are encrypted (HTTPS). Each user only sees their own data. Passwords are not stored in readable form.",
        "Your passport, quote and invoice links contain a long random code. Anyone with the link can see the page, so only share it with people who need it. You can switch off your passport link at any time.",
      ],
    },
    {
      h: "9. Your rights",
      p: [
        "You have the right to access, correct and delete your data, to restrict processing, to data portability and to object. Send your request to {email}. We respond within one month.",
        "If you are not satisfied with how we handle your data, you can file a complaint with the Dutch Data Protection Authority (autoriteitpersoonsgegevens.nl).",
      ],
    },
    {
      h: "10. Changes",
      p: [
        "We may update this statement. The latest version is always on this page. We will email you about important changes.",
      ],
    },
  ],
};

const termsNl: LegalDoc = {
  title: "Gebruiksvoorwaarden",
  updated: UPDATED_NL,
  sections: [
    {
      h: "1. Wie wij zijn",
      p: [
        "Haaks is een online dienst van {name}, KvK {kvk}, {address}, e-mail {email} (hierna: Haaks of wij). De gebruiker is de zelfstandige die een account aanmaakt (hierna: u). De klant is uw opdrachtgever.",
      ],
    },
    {
      h: "2. Toepassing",
      p: [
        "Deze voorwaarden gelden voor elk gebruik van Haaks. Door een account aan te maken gaat u ermee akkoord. Haaks is bedoeld voor zakelijk gebruik door zelfstandige ondernemers van 18 jaar of ouder.",
        "Vertalingen zijn alleen ter informatie. Bij verschil gaat de Nederlandse tekst voor.",
      ],
    },
    {
      h: "3. De dienst",
      p: [
        "Haaks helpt u met uw zzp-paspoort, offertes, facturen, bonnetjes en het vinden van klussen. Haaks is geen partij bij afspraken tussen u en uw klanten, is geen bemiddelaar of uitzendbureau en neemt geen commissie op uw opdrachten.",
      ],
    },
    {
      h: "4. Kosten",
      p: [
        "Haaks is nu gratis. Als er betaalde onderdelen komen, maken wij dat vooraf bekend. U betaalt alleen als u daar zelf voor kiest.",
      ],
    },
    {
      h: "5. Uw account",
      p: [
        "U geeft juiste gegevens op, houdt uw wachtwoord geheim en bent verantwoordelijk voor wat er met uw account gebeurt. Merkt u misbruik op, meld het dan direct via {email}.",
      ],
    },
    {
      h: "6. Uw verantwoordelijkheid",
      p: [
        "U bent zelf verantwoordelijk voor de inhoud van uw offertes en facturen, de juiste btw, uw administratie en uw belastingaangiften. Haaks helpt daarbij, maar is geen belastingadviseur of boekhouder.",
        "Teksten en gegevens die met AI zijn gemaakt of gelezen, controleert u voordat u ze gebruikt.",
        "U neemt zelf contact op met klanten en houdt u daarbij aan de wet, de privacyregels en de regels van de platforms waar u klussen vindt. Stuur geen ongevraagde berichten in bulk.",
      ],
    },
    {
      h: "7. Wat niet mag",
      p: [
        "Haaks gebruiken voor iets wat in strijd is met de wet; valse of vervalste documenten uploaden of delen; inhoud plaatsen die inbreuk maakt op rechten van anderen; proberen de beveiliging te omzeilen of de dienst te overbelasten.",
      ],
    },
    {
      h: "8. Illegale inhoud melden",
      p: [
        "Iedereen, ook autoriteiten, kan illegale inhoud op Haaks melden via ons contactpunt {email}, in het Nederlands of Engels. Vermeld de link, waarom de inhoud volgens u illegaal is en uw naam en e-mailadres.",
        "Wij beoordelen meldingen zorgvuldig en zonder onnodige vertraging. Wij kunnen inhoud of links uitzetten of een account blokkeren. Wij laten de betrokken gebruiker weten waarom, en die kan daartegen bezwaar maken via hetzelfde adres.",
      ],
    },
    {
      h: "9. Beschikbaarheid",
      p: [
        "Wij doen ons best om Haaks goed te laten werken, maar kunnen niet beloven dat de dienst altijd zonder onderbreking of fouten beschikbaar is. Wij mogen de dienst verbeteren en onderdelen wijzigen.",
      ],
    },
    {
      h: "10. Aansprakelijkheid",
      p: [
        "Onze aansprakelijkheid is beperkt tot het bedrag dat u in de 12 maanden voor de schade aan ons hebt betaald, met een maximum van € 100 zolang u de dienst gratis gebruikt.",
        "Wij zijn niet aansprakelijk voor indirecte schade, zoals gemiste opdrachten, gederfde winst, belastingaanslagen of boetes. Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van ons.",
      ],
    },
    {
      h: "11. Uw inhoud",
      p: [
        "Alles wat u in Haaks zet, blijft van u. U geeft ons alleen toestemming om het te gebruiken voor zover dat nodig is om de dienst te leveren.",
      ],
    },
    {
      h: "12. Verwerkersovereenkomst",
      p: [
        "Voor persoonsgegevens van uw klanten en anderen die u in Haaks invoert, bent u verwerkingsverantwoordelijke en is Haaks verwerker in de zin van artikel 28 AVG. Dit artikel is de verwerkersovereenkomst tussen u en Haaks.",
        "Haaks verwerkt deze gegevens alleen om de dienst te leveren en volgens uw instructies, houdt ze geheim en neemt passende beveiligingsmaatregelen (artikel 8 van de privacyverklaring).",
        "U geeft toestemming voor de subverwerkers in artikel 6 van de privacyverklaring. Bij een nieuwe subverwerker laten wij u dat vooraf weten, zodat u bezwaar kunt maken.",
        "Wij helpen u bij verzoeken van betrokkenen en bij uw verplichtingen onder de AVG, melden een datalek zonder onredelijke vertraging en uiterlijk binnen 48 uur nadat wij het ontdekken, en geven u de informatie die nodig is om naleving aan te tonen.",
        "Na het einde van uw account wissen wij de gegevens binnen 30 dagen, tenzij de wet langer bewaren verplicht.",
      ],
    },
    {
      h: "13. Stoppen",
      p: [
        "U kunt altijd stoppen. Vraag via {email} om uw account te verwijderen. Wij kunnen uw account opschorten of beëindigen als u deze voorwaarden ernstig schendt. Na beëindiging wissen wij uw gegevens binnen 30 dagen.",
      ],
    },
    {
      h: "14. Wijzigingen",
      p: [
        "Wij kunnen deze voorwaarden wijzigen. Belangrijke wijzigingen melden wij minstens 30 dagen vooraf per e-mail. Gaat u niet akkoord, dan kunt u voor die datum stoppen.",
      ],
    },
    {
      h: "15. Toepasselijk recht",
      p: [
        "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Haaks is gevestigd.",
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of use",
  updated: UPDATED_EN,
  sections: [
    {
      h: "1. Who we are",
      p: [
        "Haaks is an online service of {name}, KvK {kvk}, {address}, email {email} (Haaks or we). The user is the self-employed person who creates an account (you). The client is the person or company you work for.",
      ],
    },
    {
      h: "2. Scope",
      p: [
        "These terms apply to any use of Haaks. By creating an account you accept them. Haaks is meant for business use by self-employed people aged 18 or older.",
        "Translations are for information only. If they differ, the Dutch text prevails.",
      ],
    },
    {
      h: "3. The service",
      p: [
        "Haaks helps you with your ZZP passport, quotes, invoices, receipts and finding jobs. Haaks is not a party to agreements between you and your clients, is not an intermediary or employment agency, and takes no commission on your jobs.",
      ],
    },
    {
      h: "4. Costs",
      p: [
        "Haaks is free right now. If paid features come, we will announce them in advance. You only pay if you choose to.",
      ],
    },
    {
      h: "5. Your account",
      p: [
        "You provide correct details, keep your password secret and are responsible for what happens with your account. If you notice misuse, report it right away to {email}.",
      ],
    },
    {
      h: "6. Your responsibility",
      p: [
        "You are responsible for the content of your quotes and invoices, the correct VAT, your records and your tax returns. Haaks helps with this but is not a tax adviser or accountant.",
        "Check texts and data that were made or read with AI before you use them.",
        "You contact clients yourself and follow the law, privacy rules and the rules of the platforms where you find jobs. Do not send unsolicited bulk messages.",
      ],
    },
    {
      h: "7. What is not allowed",
      p: [
        "Using Haaks for anything illegal; uploading or sharing false or forged documents; posting content that infringes the rights of others; trying to get around security or overload the service.",
      ],
    },
    {
      h: "8. Reporting illegal content",
      p: [
        "Anyone, including authorities, can report illegal content on Haaks to our point of contact {email}, in Dutch or English. Include the link, why you believe the content is illegal, and your name and email address.",
        "We assess reports carefully and without undue delay. We may switch off content or links or block an account. We tell the user concerned why, and they can object at the same address.",
      ],
    },
    {
      h: "9. Availability",
      p: [
        "We do our best to keep Haaks working well, but cannot promise it will always be available without interruptions or errors. We may improve the service and change parts of it.",
      ],
    },
    {
      h: "10. Liability",
      p: [
        "Our liability is limited to the amount you paid us in the 12 months before the damage, with a maximum of € 100 while you use the service for free.",
        "We are not liable for indirect damage, such as missed jobs, lost profit, tax assessments or fines. These limits do not apply in case of intent or deliberate recklessness on our part.",
      ],
    },
    {
      h: "11. Your content",
      p: [
        "Everything you put into Haaks remains yours. You only allow us to use it as far as needed to provide the service.",
      ],
    },
    {
      h: "12. Data processing agreement",
      p: [
        "For personal data of your clients and others that you enter into Haaks, you are the controller and Haaks is the processor within the meaning of Art. 28 GDPR. This section is the data processing agreement between you and Haaks.",
        "Haaks processes this data only to provide the service and according to your instructions, keeps it confidential and takes appropriate security measures (section 8 of the privacy statement).",
        "You authorise the sub-processors listed in section 6 of the privacy statement. We will tell you in advance about a new sub-processor, so that you can object.",
        "We help you with requests from data subjects and with your obligations under the GDPR, report a data breach without undue delay and at the latest within 48 hours after we discover it, and give you the information needed to demonstrate compliance.",
        "After your account ends, we erase the data within 30 days, unless the law requires longer storage.",
      ],
    },
    {
      h: "13. Stopping",
      p: [
        "You can stop at any time. Ask us at {email} to delete your account. We may suspend or end your account if you seriously breach these terms. After termination we erase your data within 30 days.",
      ],
    },
    {
      h: "14. Changes",
      p: [
        "We may change these terms. We will announce important changes by email at least 30 days in advance. If you do not agree, you can stop before that date.",
      ],
    },
    {
      h: "15. Governing law",
      p: [
        "These terms are governed by Dutch law. Disputes are submitted to the competent court in the district where Haaks is established.",
      ],
    },
  ],
};

const cookiesNl: LegalDoc = {
  title: "Cookieverklaring",
  updated: UPDATED_NL,
  sections: [
    {
      h: "Alleen noodzakelijke cookies",
      p: [
        "Haaks gebruikt alleen cookies die nodig zijn om de website te laten werken. Wij gebruiken geen cookies voor statistieken, tracking of advertenties. Daarom vragen wij geen toestemming (artikel 11.7a Telecommunicatiewet).",
      ],
    },
    {
      h: "Welke cookies",
      p: [
        "Inlogcookie (naam begint met “sb-”), van Supabase: houdt u ingelogd. Blijft bewaard tot u uitlogt.",
        "Taalcookie (“lang”): onthoudt de taal die u kiest. Blijft 1 jaar bewaard.",
      ],
    },
    {
      h: "Cookies verwijderen",
      p: [
        "U kunt cookies in uw browser verwijderen of blokkeren. Zonder het inlogcookie kunt u niet inloggen.",
      ],
    },
  ],
};

const cookiesEn: LegalDoc = {
  title: "Cookie statement",
  updated: UPDATED_EN,
  sections: [
    {
      h: "Only necessary cookies",
      p: [
        "Haaks only uses cookies that are needed for the website to work. We use no cookies for statistics, tracking or advertising. That is why we do not ask for consent (Article 11.7a of the Dutch Telecommunications Act).",
      ],
    },
    {
      h: "Which cookies",
      p: [
        "Login cookie (name starts with “sb-”), from Supabase: keeps you signed in. Kept until you sign out.",
        "Language cookie (“lang”): remembers the language you choose. Kept for 1 year.",
      ],
    },
    {
      h: "Deleting cookies",
      p: [
        "You can delete or block cookies in your browser. Without the login cookie you cannot sign in.",
      ],
    },
  ],
};

export const LEGAL: Record<LegalKind, Record<LegalLang, LegalDoc>> = {
  privacy: { nl: privacyNl, en: privacyEn },
  terms: { nl: termsNl, en: termsEn },
  cookies: { nl: cookiesNl, en: cookiesEn },
};

// Short summary in the visitor's own language above the full text.
type Summary = {
  links: Record<LegalKind, string>;
  summaryTitle: string;
  binding: string;
  privacy: string[];
  terms: string[];
  cookies: string[];
  signupConsent: string;
  consentLinks: { terms: string; privacy: string };
};

const en: Summary = {
  links: { privacy: "Privacy", terms: "Terms of use", cookies: "Cookies" },
  summaryTitle: "In short",
  binding: "The full text below is in English. The Dutch version is binding.",
  privacy: [
    "We only use your data to run Haaks for you. We do not sell it and show no ads.",
    "Your data is stored in Frankfurt, Germany. AI reading is done by Anthropic (Claude).",
    "Do not upload your passport, ID card or BSN: they are not needed.",
    "You can ask to see, correct or delete your data at any time by email.",
  ],
  terms: [
    "Haaks is free now. Paid options will be announced in advance.",
    "Haaks is not an agency and takes no commission. You work directly with your clients.",
    "You are responsible for your invoices, VAT and taxes. Always check AI results.",
    "You can stop at any time and ask us to delete your account.",
  ],
  cookies: ["Only cookies for signing in and remembering your language. No tracking, no ads."],
  signupConsent: "By creating an account you accept the {terms} and have read the {privacy}.",
  consentLinks: { terms: "Terms of use", privacy: "Privacy statement" },
};

const SUMMARIES: Record<Lang, Summary> = {
  en,
  nl: {
    links: { privacy: "Privacy", terms: "Gebruiksvoorwaarden", cookies: "Cookies" },
    summaryTitle: "In het kort",
    binding: "Hieronder staat de volledige tekst. Deze Nederlandse tekst is bindend.",
    privacy: [
      "Wij gebruiken uw gegevens alleen om Haaks voor u te laten werken. Wij verkopen ze niet en tonen geen advertenties.",
      "Uw gegevens staan in Frankfurt, Duitsland. AI-lezen gebeurt door Anthropic (Claude).",
      "Upload geen paspoort, identiteitskaart of BSN: die zijn niet nodig.",
      "U kunt altijd per e-mail vragen om uw gegevens in te zien, te verbeteren of te verwijderen.",
    ],
    terms: [
      "Haaks is nu gratis. Betaalde opties maken wij vooraf bekend.",
      "Haaks is geen bemiddelaar en neemt geen commissie. U werkt direct met uw klanten.",
      "U bent verantwoordelijk voor uw facturen, btw en belastingen. Controleer AI-resultaten altijd.",
      "U kunt altijd stoppen en vragen om uw account te verwijderen.",
    ],
    cookies: ["Alleen cookies om in te loggen en uw taal te onthouden. Geen tracking, geen advertenties."],
    signupConsent: "Door een account aan te maken gaat u akkoord met de {terms} en hebt u de {privacy} gelezen.",
    consentLinks: { terms: "gebruiksvoorwaarden", privacy: "privacyverklaring" },
  },
  ru: {
    links: { privacy: "Конфиденциальность", terms: "Условия использования", cookies: "Cookies" },
    summaryTitle: "Коротко",
    binding: "Ниже полный текст на английском языке. Юридическую силу имеет нидерландская версия.",
    privacy: [
      "Мы используем ваши данные только для работы Haaks. Мы их не продаём и не показываем рекламу.",
      "Данные хранятся во Франкфурте, Германия. Чтение документов ИИ выполняет Anthropic (Claude).",
      "Не загружайте паспорт, ID-карту и BSN: они не нужны.",
      "В любой момент можно по почте попросить показать, исправить или удалить ваши данные.",
    ],
    terms: [
      "Сейчас Haaks бесплатный. О платных функциях сообщим заранее.",
      "Haaks не посредник и не берёт комиссию. Вы работаете с заказчиками напрямую.",
      "За счета, НДС и налоги отвечаете вы. Всегда проверяйте результаты ИИ.",
      "Можно в любой момент прекратить пользоваться и попросить удалить аккаунт.",
    ],
    cookies: ["Только cookies для входа и запоминания языка. Без слежки и рекламы."],
    signupConsent: "Создавая аккаунт, вы принимаете {terms} и подтверждаете, что прочитали {privacy}.",
    consentLinks: { terms: "Условия использования", privacy: "Политику конфиденциальности" },
  },
  uk: {
    links: { privacy: "Конфіденційність", terms: "Умови використання", cookies: "Cookies" },
    summaryTitle: "Коротко",
    binding: "Нижче повний текст англійською. Юридичну силу має нідерландська версія.",
    privacy: [
      "Ми використовуємо ваші дані лише для роботи Haaks. Ми їх не продаємо й не показуємо рекламу.",
      "Дані зберігаються у Франкфурті, Німеччина. Читання документів ШІ виконує Anthropic (Claude).",
      "Не завантажуйте паспорт, ID-картку та BSN: вони не потрібні.",
      "Будь-коли можна поштою попросити показати, виправити чи видалити ваші дані.",
    ],
    terms: [
      "Зараз Haaks безкоштовний. Про платні функції повідомимо заздалегідь.",
      "Haaks не посередник і не бере комісію. Ви працюєте із замовниками напряму.",
      "За рахунки, ПДВ і податки відповідаєте ви. Завжди перевіряйте результати ШІ.",
      "Можна будь-коли припинити користуватися й попросити видалити акаунт.",
    ],
    cookies: ["Лише cookies для входу та запам'ятовування мови. Без стеження й реклами."],
    signupConsent: "Створюючи акаунт, ви приймаєте {terms} і підтверджуєте, що прочитали {privacy}.",
    consentLinks: { terms: "Умови використання", privacy: "Політику конфіденційності" },
  },
  pl: {
    links: { privacy: "Prywatność", terms: "Warunki korzystania", cookies: "Cookies" },
    summaryTitle: "W skrócie",
    binding: "Poniżej pełny tekst po angielsku. Wiążąca jest wersja niderlandzka.",
    privacy: [
      "Używamy Twoich danych tylko po to, żeby Haaks działał. Nie sprzedajemy ich i nie pokazujemy reklam.",
      "Dane są przechowywane we Frankfurcie w Niemczech. Odczyt dokumentów przez AI wykonuje Anthropic (Claude).",
      "Nie przesyłaj paszportu, dowodu osobistego ani BSN: nie są potrzebne.",
      "W każdej chwili możesz mailowo poprosić o wgląd, poprawienie lub usunięcie danych.",
    ],
    terms: [
      "Haaks jest teraz darmowy. O płatnych opcjach poinformujemy z wyprzedzeniem.",
      "Haaks nie jest pośrednikiem i nie bierze prowizji. Pracujesz bezpośrednio z klientami.",
      "Za faktury, VAT i podatki odpowiadasz Ty. Zawsze sprawdzaj wyniki AI.",
      "Możesz w każdej chwili zrezygnować i poprosić o usunięcie konta.",
    ],
    cookies: ["Tylko cookies do logowania i zapamiętania języka. Bez śledzenia i reklam."],
    signupConsent: "Zakładając konto, akceptujesz {terms} i potwierdzasz, że przeczytałeś {privacy}.",
    consentLinks: { terms: "Warunki korzystania", privacy: "Politykę prywatności" },
  },
  ro: {
    links: { privacy: "Confidențialitate", terms: "Condiții de utilizare", cookies: "Cookies" },
    summaryTitle: "Pe scurt",
    binding: "Mai jos este textul complet în engleză. Versiunea în olandeză este cea obligatorie.",
    privacy: [
      "Folosim datele tale doar ca Haaks să funcționeze. Nu le vindem și nu afișăm reclame.",
      "Datele sunt stocate la Frankfurt, Germania. Citirea cu AI este făcută de Anthropic (Claude).",
      "Nu încărca pașaportul, buletinul sau BSN-ul: nu sunt necesare.",
      "Oricând poți cere pe e-mail să vezi, să corectezi sau să ștergi datele tale.",
    ],
    terms: [
      "Haaks este gratuit acum. Opțiunile plătite vor fi anunțate din timp.",
      "Haaks nu este intermediar și nu ia comision. Lucrezi direct cu clienții tăi.",
      "Tu răspunzi de facturi, TVA și taxe. Verifică mereu rezultatele AI.",
      "Poți renunța oricând și poți cere ștergerea contului.",
    ],
    cookies: ["Doar cookies pentru autentificare și limba aleasă. Fără urmărire, fără reclame."],
    signupConsent: "Creând un cont, accepți {terms} și confirmi că ai citit {privacy}.",
    consentLinks: { terms: "Condițiile de utilizare", privacy: "Politica de confidențialitate" },
  },
};

export function legalSummary(lang: Lang): Summary {
  return SUMMARIES[lang];
}
