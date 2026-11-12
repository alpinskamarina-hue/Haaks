// Checked Dutch rules for ZZP builders (tax year 2026), with sources. Source of truth:
// /mnt/project-files/research/staff-knowledge/nl-zzp-2026.md (project files). Re-check every December.
// The employee gets this text with every question; it is cached, so it costs little.
export const STAFF_KNOWLEDGE_CHECKED = "2026-11";

export const STAFF_KNOWLEDGE = String.raw`
# NL ZZP construction reference (справочник), tax year 2026

Scope: Dutch rules for self-employed (ZZP) construction workers, incl. foreign (EU) builders. Checked November 2026 (today 2026-11-12).
Every fact ends with its source and check date, or is marked NOT VERIFIED. Not legal or tax advice. For an individual case, refer the user to the Belastingdienst (BelastingTelefoon 0800-0543, from abroad +31 555 385 385), a bookkeeper, or Juridisch Loket.

## Not verified / changes on or after 1 Jan 2027 (read first)

**NOT VERIFIED (do not state as fact):**
- Maximum verzuimboete for late or missing btw *aangifte* (only the €82 standard fine is confirmed).
- CJIB: the standard payment term (often said to be 8 weeks) and the 6-week term to object to a traffic fine (Wet Mulder). The CJIB site could not be fetched. Tell users to follow the date in the CJIB letter.
- CJIB betalingsregeling conditions (minimum amount, number of instalments).
- Whether the €38/hour rechtsvermoeden threshold will be indexed for 2027, and to what amount.
- KvK registration fee for 2027.
- Zvw percentage and maximum bijdrage-inkomen for 2027.
- MKB-winstvrijstelling percentage for 2027.
- Whether reverse-charged (btw verlegd) turnover counts toward the €20,000 KOR threshold.

**Changes on or after 1 Jan 2027:**
- Zelfstandigenaftrek drops from €1,200 (2026) to €900 (2027). This is already in law.
- Startersaftrek: the Belastingplan 2027 *proposes* cutting it from €2,123 to €10 from 1 Jan 2027 and abolishing it from 2028. This is a proposal still going through parliament.
- Box 1 rates 2027 (proposed): 36.23% up to €39,247; 38.16% up to €78,426; 49.50% above that.
- Stakingsaftrek drops from €3,630 to €908 (proposed, Belastingplan 2027).
- Rechtsvermoeden (presumed employment at an hourly rate below €38) takes effect on **31 Dec 2026** and also applies to existing contracts.
- Wet DBA enforcement: from 1 Jan 2027 the Belastingdienst may also impose verzuimboetes. In 2026 it imposes only vergrijpboetes.
- Wtta (licensing for lenders of workers, incl. ZZP'ers who are hired out): the law starts 1 Jan 2027; the ban on unlicensed lenders starts 1 Jan 2028.
- Minimum wage (21+) becomes €15.29/hour on 1 Jan 2027. Source is a news report of the minister's letter, not an official page.
- Mandatory AOV (BAZ): the bill is still in the Tweede Kamer. The expected start is 2030, with no fixed date.
- Belastingrente, invorderingsrente and wettelijke (handels)rente are reset each half-year or year. Re-check them after 1 Jan 2027.

---

## 1. Btw (VAT)

### Rates
- 21% is the general rate for all taxable goods and services that are not reduced or exempt (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_berekenen_aan_uw_klanten/btw_berekenen/btw_tarief/btw_tarief, gecontroleerd 2026-11)
- 9% is the reduced rate, e.g. for food and certain services (bron: same URL, gecontroleerd 2026-11)
- 0% applies to certain cross-border supplies (e.g. some EU/export business). You charge no btw but can still deduct input btw (bron: same URL, gecontroleerd 2026-11)
- 9% construction exception: isoleren, schilderen, stukadoren and behangen of homes (woningen) older than 2 years are 9%. Cleaning homes is 9% with no age condition. Other work on homes is 21% (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/tarieven_en_vrijstellingen/diensten_9_btw/werkzaamheden_aan_woningen/werkzaamheden_aan_woningen, gecontroleerd 2026-11)
- The 9% rate still applies when a main contractor subcontracts that work. In a larger project, show the 9% and 21% parts separately on the quote and invoice (bron: same URL, gecontroleerd 2026-11)
- Whether materials used in 9% home work are 9% or 21%: NOT VERIFIED.

### Btw verlegd (reverse charge) in construction subcontracting
- Reverse charge applies to subcontracting and to hiring out staff in construction, shipbuilding, cleaning and gardening/landscaping (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_berekenen_aan_uw_klanten/waarover_btw_berekenen/verleggingsregeling/wanneer_btw_verleggen/, gecontroleerd 2026-11)
- It covers only physical work on immovable property or ships, such as building, demolishing, constructing, maintaining, repairing and cleaning. It does not cover design work, surveillance or rental (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_berekenen_aan_uw_klanten/waarover_btw_berekenen/verleggingsregeling/wanneer_btw_verleggen/bij_onderaanneming_en_personeel_uitlenen, gecontroleerd 2026-11)
- The btw is owed by the customer, the contractor (aannemer) or hirer (inlener), not by the subcontractor (bron: same URL, gecontroleerd 2026-11)
- No reverse charge applies if the work is done wholly or mostly (>50%) in your own workshop, or if it concerns goods you sold to the main contractor (bron: same URL, gecontroleerd 2026-11)
- If the subcontractor or hirer has no permanent establishment (vaste inrichting) in NL, separate rules for foreign businesses apply (bron: same URL, gecontroleerd 2026-11)
- In practice: a ZZP'er working as a subcontractor for another construction business (main contractor, developer) may have to apply reverse charge. Working directly for a private client is not subcontracting, so normal btw is charged (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/starten-als-zzper-in-de-bouw, gecontroleerd 2026-11)
- Invoice wording: charge no btw, write **"btw verlegd"**, and include the customer's btw-identificatienummer (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/factuureisen/aangepaste_regels_facturen/u_maakt_gebruik_van_de_verleggingsregeling, gecontroleerd 2026-11)
- If it is unclear who the customer is, reverse charge was applied wrongly. You remain responsible for the btw you reverse-charge (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_berekenen_aan_uw_klanten/waarover_btw_berekenen/verleggingsregeling/hoe_werkt_btw_verleggen, gecontroleerd 2026-11)

### KOR (kleineondernemersregeling)
- Threshold: turnover of at most €20,000 (excl. btw) in the calendar year you join **and** in the year before. The business must be established in NL (bron: https://belastingdienst.nl/wps/wcm/connect/nl/btw/content/kor-voorwaarden, gecontroleerd 2026-11)
- How to apply: use the online form "Melding omzetbelasting kleineondernemersregeling" in Mijn Belastingdienst Zakelijk, at least 4 weeks before the start of the filing period it should apply from (bron: https://ondernemersplein.overheid.nl/kleineondernemersregeling/, gecontroleerd 2026-11)
- Consequences: you charge no btw to customers, you generally file no btw returns, and you cannot deduct btw on business costs or investments (bron: same URL, gecontroleerd 2026-11)
- Above €20,000: once turnover passes €20,000 in a calendar year, you must deregister. Btw applies from the transaction that crosses the threshold, and that transaction is taxed in full (bron: https://belastingdienst.nl/wps/wcm/connect/nl/btw/content/afmelden-kor, gecontroleerd 2026-11)
- After deregistering, you cannot rejoin for the rest of that calendar year plus the following year (bron: same URL, gecontroleerd 2026-11)
- You may deregister voluntarily at any time (bron: https://ondernemersplein.overheid.nl/kleineondernemersregeling/, gecontroleerd 2026-11)
- Below the €2,200 registration threshold, you do not need to register as a btw-ondernemer and automatically use the KOR (bron: same URL, gecontroleerd 2026-11)

### Quarterly return and payment
- Filing is usually per quarter. The return must be received by the last day of the month after the quarter: Q1 by 30 Apr, Q2 by 31 Jul, Q3 by 31 Oct, Q4 by 31 Jan of the next year (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw-aangifte-waar-moet-u-aan-denken/btw-aangifte-waar-moet-u-aan-denken, gecontroleerd 2026-11)
- The exact payment deadline and payment reference for each period are in the aangiftebrief and in Mijn Belastingdienst Zakelijk (bron: same URL, gecontroleerd 2026-11)
- Foreign businesses without a NL establishment have later deadlines, where both return and payment must be received: Q1 2026 by 31 May 2026, Q2 by 31 Aug 2026, Q3 by 30 Nov 2026, Q4 2026 by 28 Feb 2027 (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/internationaal/btw_voor_buitenlandse_ondernemers/btw_aangifte_doen_en_betalen/uiterste_ontvangstdatum_aangifte_en_betaling_btw_aangifte, gecontroleerd 2026-11)
- Pay to IBAN NL04 RABO 0200 1122 44 in the name of "Belastingdienst" (BIC RABONL2U), with the betalingskenmerk in the betalingskenmerk field. The account moved from ING to Rabobank on 1 May 2026 (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/btw_betalen/btw_betalen, gecontroleerd 2026-11)

### Late filing or payment (verzuimboete)
- Late or missing btw return: €82 fine. There is a 7-calendar-day grace period after the deadline with no fine (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/boetes/u_doet_geen_of_te_laat_aangifte, gecontroleerd 2026-11)
- Maximum fine for repeated late btw returns: NOT VERIFIED.
- Late, missing or insufficient btw payment: 3% of the amount, minimum €50, maximum €6,709 (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_aangifte_doen_en_betalen/boetes/u_betaalt_niet_te_laat_of_te_weinig, gecontroleerd 2026-11)
- Payment grace period: 7 calendar days after the final payment date. If the previous return was paid on time and in full, you get only a notice (verzuimmededeling) and no fine. Otherwise the 3% fine applies (bron: same URL, gecontroleerd 2026-11)
- If no return is filed, the Belastingdienst sends a naheffingsaanslag with an estimated btw amount. The 3% (minimum €50) fine applies to unpaid btw (bron: https://www.belastingdienst.nl/naheffingsaanslag, gecontroleerd 2026-11)

## 2. Inkomstenbelasting (income tax) for ZZP

- Box 1 rates 2026 (below AOW age): 35.75% up to €38,883; 37.56% from €38,883 to €78,426; 49.50% above €78,426 (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen, gecontroleerd 2026-11)
- Maximum algemene heffingskorting 2026 is €3,115, for income up to €29,736. Maximum arbeidskorting 2026 is €5,685, reached at €45,592 of work income (bron: same URL, gecontroleerd 2026-11)
- Deadline for the 2025 return: before the date in your aangiftebrief, usually 1 May (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/belastingaangifte/content/wanneer-moet-ik-aangifte-doen, gecontroleerd 2026-11)
- Uitstel (extension): request it before 1 May 2026 to get an extension until 1 September 2026. This is only possible if you received an aangiftebrief. Tax advisers may have their own arrangement (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/belastingaangifte/content/ik-moet-aangifte-doen-maar-ik-wil-graag-uitstel-kan-dat, gecontroleerd 2026-11)
- Late income tax return after an aanmaning: verzuimboete of €469, rising to up to €6,709 for repeated lapses. If no return is filed, the Belastingdienst estimates your income. Belastingrente is also charged (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/belastingaangifte/content/wat-gebeurt-er-als-ik-geen-aangifte-doe-of-te-laat-of-onvolledig, gecontroleerd 2026-11)
- Zelfstandigenaftrek: €1,200 in 2026 and €900 in 2027 (bron: https://ondernemersplein.overheid.nl/subsidies-en-regelingen/zelfstandigenaftrek/, gecontroleerd 2026-11)
- Startersaftrek 2026: €2,123 on top of the zelfstandigenaftrek. It can be used at most 3 times in the first 5 years and requires meeting the urencriterium (bron: https://www.kvk.nl/starten/de-magische-1225-uur-alles-over-het-urencriterium/, gecontroleerd 2026-11)
- Startersaftrek 2027 (PROPOSAL, Belastingplan 2027, not yet law): €10 from 1 Jan 2027, abolished from 2028 (bron: https://www.kvk.nl/wetten-en-regels/plannen-voor-je-eenmanszaak-vof-maatschap-of-cv/, gecontroleerd 2026-11)
- Urencriterium: at least 1,225 hours per calendar year on your business. This is required for the zelfstandigenaftrek and the startersaftrek. If you have been an ondernemer for more than 5 years, you must also spend more time on the business than on other work, such as a job. Starters are exempt from that second condition (bron: https://www.kvk.nl/starten/de-magische-1225-uur-alles-over-het-urencriterium/, gecontroleerd 2026-11)
- MKB-winstvrijstelling: 12.70% of profit (after ondernemersaftrek) is exempt in 2025 and 2026 (bron: https://ondernemersplein.overheid.nl/mkb-winstvrijstelling/, gecontroleerd 2026-11)
- Zvw (health insurance law) income-dependent contribution for ondernemers in 2026: 4.85% of profit and other income, with a maximum contribution income of €79,409. You pay it yourself through the (voorlopige) aanslag (bron: https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/inkomensafhankelijke_bijdrage_zorgverzekeringswet, gecontroleerd 2026-11)
- Voorlopige aanslag 2026: if you have no aangiftebrief, you can request or change it until 1 May 2027. If you have one, the date in the aangiftebrief (or the extension date) applies (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/tot-wanneer-voorlopige-aanslag-aanvragen-wijzigen, gecontroleerd 2026-11)
- Belastingrente 2026 is 5% for income tax, btw and other taxes, except vennootschapsbelasting and toeslagen. It is set once a year (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/belastingrente/overzicht_percentages_belastingrente, gecontroleerd 2026-11)

## 3. Wet DBA / schijnzelfstandigheid (false self-employment)

- Since 1 Jan 2025 the Belastingdienst again checks whether ZZP'ers really work independently. Back-payment of loonheffing cannot go further back than 1 Jan 2025, unless there was intent or Belastingdienst instructions were ignored (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/schijnzelfstandigheid-voorkomen-met-dba-voor-zzpers/, gecontroleerd 2026-11)
- 2026: generally no fines. Fines are possible only for intent or gross negligence (vergrijpboete) (bron: same URL, gecontroleerd 2026-11)
- In 2026 there are no verzuimboetes, and audits start with a company visit. These soft-landing rules end on 1 Jan 2027 (bron: https://www.salarisvanmorgen.nl/2026/01/07/handhaven-in-2026-met-gedeeltelijke-verlenging-zachte-landing/, gecontroleerd 2026-11; secondary source)
- Legal test for employment (loondienst): personal work obligation, pay, and employer authority (gezag). All facts and circumstances are weighed (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/arbeidsrelaties/content/wanneer-is-sprake-van-loondienst, gecontroleerd 2026-11)
- Signs of gezag: the client decides how, when, where and with whom you work, controls your hours or days, organizes your cooperation with others, or can give you the same instructions as its own employees. One or more "yes" answers is a strong sign of employment (bron: same URL, gecontroleerd 2026-11)
- Signs of real entrepreneurship: you carry commercial risk, you look for clients and build a reputation, you have several clients, and you work for one client for a short time. Signs against it: being part of the client's organization (inbedding) and having to do the work personally (bron: same URL, gecontroleerd 2026-11)
- Practical questions to ask a client, derived from the official indicators above: Who decides my working hours and method? Can I send a replacement or helper? Do I bring my own tools and van? Do I bear the risk if the work must be redone? Am I treated like your employees (same instructions, clothing, roster)? Can I take other clients at the same time? Is my rate per job or per hour, and is it above €38/hour? (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/arbeidsrelaties/content/wanneer-is-sprake-van-loondienst, gecontroleerd 2026-11)
- Tools: Webmodule Beoordeling Arbeidsrelatie and Toelichting Beoordeling Arbeidsrelaties (Belastingdienst), the SZW keuzehulp, and the KvK article "10 kenmerken van een zzp-opdracht" (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/schijnzelfstandigheid-voorkomen-met-dba-voor-zzpers/, gecontroleerd 2026-11)
- Modelovereenkomsten: no new ones are assessed. Approved ones can be used until the end of 2029, but only if you actually work as the contract says (bron: same URL, gecontroleerd 2026-11)
- Rechtsvermoeden (presumed employment): Wet invoering rechtsvermoeden van arbeidsovereenkomst op basis van uurtarief (36.783). Adopted by the Tweede Kamer on 21 Apr 2026 and by the Eerste Kamer on 16 Jun 2026 (bron: https://www.eerstekamer.nl/wetsvoorstel/36783_wet_invoering, gecontroleerd 2026-11)
- It takes effect on **31 Dec 2026** (bron: https://zoek.officielebekendmakingen.nl/stb-2026-207.odt, gecontroleerd 2026-11)
- Content: at a rate below €38/hour (reference date 1 Jan 2026), an employment contract is presumed. The client must prove otherwise; if it cannot, full employee protection applies (bron: https://www.eerstekamer.nl/wetsvoorstel/36783_wet_invoering, gecontroleerd 2026-11)
- Only the worker (or a union acting for them) can invoke it, not the Belastingdienst, UWV or Arbeidsinspectie (bron: https://www.zzp-nederland.nl/nieuws/tweede-kamer-stemt-met-wet-rechtsvermoeden-bij-laag-uurtarief, gecontroleerd 2026-11; secondary source)
- It also applies to existing contracts, with no transitional rules (bron: https://www.rendement.nl/arbeidsrecht/nieuws/ingangsdata-wetten-voor-zzpers-en-flexwerkers-bekend.html, gecontroleerd 2026-11; secondary source)
- The rest of VBAR / the planned Zelfstandigenwet is still being prepared. Timing is unknown and the proposals may change (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/schijnzelfstandigheid-voorkomen-met-dba-voor-zzpers/, gecontroleerd 2026-11)

## 4. Documents and registrations

### KvK
- Registration fee is €85.15, one-off. It is adjusted yearly for inflation (bron: https://www.kvk.nl/inschrijven/inschrijfvergoeding/, gecontroleerd 2026-11)
- Timing: register from 1 week before to 1 week after your start date. Prepare online (an eenmanszaak needs DigiD, which needs a BSN), then complete it at an appointment at a KvK office (bron: https://www.kvk.nl/hulp-en-contact/hulp-bij-inschrijven/, gecontroleerd 2026-11)
- You need business activities and a visiting address in NL; border-area residents may be an exception. Non-residents must bring valid ID plus an original foreign population-register extract no older than 2 months, legalized or translated if needed (bron: same URL, gecontroleerd 2026-11)
- KvK passes your data to the Belastingdienst. If you must charge btw, you receive a btw number within 5 days (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/starten-als-zzper-in-de-bouw, gecontroleerd 2026-11)

### BSN / RNI (foreigners)
- People staying in NL for less than 4 months can register in the RNI (Registratie Niet-Ingezetenen) and receive a BSN (bron: https://www.rvig.nl/registratie-niet-ingezetenen-voor-burgers, gecontroleerd 2026-11)
- With a European passport you can register at one of 19 RNI counters. Without one, from Jan 2026 only at 2 counters (Breda and Venlo). Bring a valid identity document (bron: same URL, gecontroleerd 2026-11)
- No BSN and living abroad? Register in the RNI to get a BSN, then apply for DigiD for the KvK registration (bron: https://www.kvk.nl/hulp-en-contact/hulp-bij-inschrijven/, gecontroleerd 2026-11)
- Whether RNI registration is free: NOT VERIFIED.

### A1 certificate and notification duty (EU self-employed working temporarily in NL)
- An A1 certificate shows which country's social insurance applies. A self-employed person based in another EU/EEA country who works temporarily in NL applies for it in the **home country**. It is valid for up to 24 months. You must have been self-employed for at least 2 months before leaving (bron: https://business.gov.nl/regulation/a1-statement, gecontroleerd 2026-11)
- Show the A1 to the labour inspectorate if asked (bron: same URL, gecontroleerd 2026-11)
- Notification duty (WagwEU): self-employed people from the EU/EEA/Switzerland working in designated sectors, **including construction (SBI F)**, must notify before work starts via the online meldloket (meldloket.postedworkers.nl). Documents must stay available for 5 years (bron: https://english.postedworkers.nl/faq/reporting-system/i-am-self-employed.-does-this-mean-i-have-to-notify, gecontroleerd 2026-11)
- The client checks and confirms the notification. Without a correct notification, both client and self-employed person can be fined (bron: https://ondernemersplein.overheid.nl/wetten-en-regels/meldingsplicht-voor-buitenlandse-bedrijven-en-zelfstandigen/, gecontroleerd 2026-11)

### Waadi / Wtta (hiring out of workers)
- Waadi: anyone who places workers at another company's disposal under that company's supervision (terbeschikkingstelling) must be registered in the Handelsregister as an uitlener. The inlener must check this registration at KvK, and both can be fined by the Arbeidsinspectie (bron: https://www.kvk.nl/waadi, gecontroleerd 2026-11)
- A normal ZZP'er doing their own job (aanneming van werk) is usually not an uitlener. Whether a situation counts as terbeschikkingstelling depends on the facts (bron: same URL, gecontroleerd 2026-11)
- Wtta (licensing system) also covers parties that hire out ZZP'ers. The law starts 1 Jan 2027, with notification to the NAU before then. The toelating application window is 1 May – 30 Jun 2027. Inleners face fines for using unlicensed uitleners from 1 Jan 2028 (bron: https://www.sra.nl/nieuws/000000/2026/07/gefaseerde-inwerkingtreding-wet-toelating-ter-beschikking-stelling-arbeidskrachten-wtta, gecontroleerd 2026-11; secondary source)

### VCA
- VCA is a safety, health and environment checklist/certificate for contractors. It is **not legally required**, but clients and insurers often ask for it (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/starten-als-zzper-in-de-bouw, gecontroleerd 2026-11)
- A VCA certificate (B-VCA / VCA Basis, VCA-VOL, VIL-VCU) is valid for 10 years and is registered in the VCA register (bron: https://www.pbna.com/en/vca/certificaat/, gecontroleerd 2026-11; exam institute, not government)

### G-rekening / ketenaansprakelijkheid
- Ketenaansprakelijkheid makes a contractor liable for the loonheffingen (payroll taxes) its subcontractor fails to pay for the work. Each link in the chain is liable for all later links (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/aangifte_betalen_en_toezicht/aansprakelijkheid/ketenaansprakelijkheid/ketenaansprakelijkheid, gecontroleerd 2026-11)
- G-rekening: a blocked account into which the contractor pays the payroll-tax part. Opening one needs permission from the Belastingdienst and the bank (bron: same URL, gecontroleerd 2026-11)
- A **ZZP'er without staff** is not a withholding agent (inhoudingsplichtige) and cannot get a G-rekening, even if a client asks for one (bron: same URL, gecontroleerd 2026-11)

## 5. Insurance

- Liability insurance (AVB): not legally required for a ZZP'er in construction, but clients or sector bodies may require it (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/starten-als-zzper-in-de-bouw, gecontroleerd 2026-11)
- CAR (Construction All Risks) / montageverzekering: covers damage during construction or installation work, e.g. to the home you work in. It comes in several types (bron: same URL, gecontroleerd 2026-11)
- WA (third-party liability) insurance for your work van is mandatory (bron: same URL, gecontroleerd 2026-11)
- Some trades must join a sector pension fund: painters, glaziers and finishing trades, and stone, terrazzo, plaster and finishing trades (bron: same URL, gecontroleerd 2026-11)
- AOV (disability insurance) is **currently not mandatory** for ondernemers. Alternatives include a broodfonds/schenkkring, a private vangnetverzekering for starters (self-employed under 15 months), and voluntary UWV insurance (under conditions, e.g. within 13 weeks after mandatory employee insurance ends) (bron: https://ondernemersplein.overheid.nl/bedrijfsvoering/verzekeringen/arbeidsongeschiktheidsverzekering/, gecontroleerd 2026-11)
- Mandatory basisverzekering (BAZ), bill 36.912: submitted 20 Mar 2026 and still in written preparation in the Tweede Kamer. It is not adopted and has no start date (to be set by royal decree). Proposed: benefit of at most minimum wage, coverage until AOW age, and an opt-out via a private policy that meets conditions (bron: https://www.eerstekamer.nl/wetsvoorstel/36912_wet_basisverzekering, gecontroleerd 2026-11)
- Expected start is 2030, with possibly no benefit in the first 2 years (bron: https://ondernemersplein.overheid.nl/bedrijfsvoering/verzekeringen/arbeidsongeschiktheidsverzekering/, gecontroleerd 2026-11)
- Estimated premium is about 5.7% (bron: https://www.zzp-nederland.nl/nieuws/beweging-dossier-verplichte-aov-baz-maar-niets-zeker, gecontroleerd 2026-11; secondary source, an estimate)

## 6. Letters from authorities

### Belastingdienst
- Naheffingsaanslag: an additional assessment, e.g. when a btw return was not filed. It contains an estimated btw amount (bron: https://www.belastingdienst.nl/naheffingsaanslag, gecontroleerd 2026-11)
- Bezwaar (objection) against a naheffingsaanslag must be filed within 6 weeks of the date on the assessment (bron: same URL, gecontroleerd 2026-11)
- Aanmaning: pay within 2 weeks of the date of the aanmaning. Costs are €10 if the amount is below €454, and €22 if it is €454 or more. Bezwaar against these costs is possible within 6 weeks (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/aanmaning, gecontroleerd 2026-11)
- Dwangbevel: follows an unpaid aanmaning. Pay within 2 days of the date of the dwangbevel. Extra costs range from €56 to €16,524 depending on the debt (example: €271 on €2,000) (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/dwangbevel, gecontroleerd 2026-11)
- If a dwangbevel is not paid, the Belastingdienst can seize property, wages, benefits or bank balances. Bezwaar is possible only against the costs, within 6 weeks (bron: same URL, gecontroleerd 2026-11)
- Invorderingsrente: 4.3% from 1 Jan 2026, set every half-year (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/invorderingsrente, gecontroleerd 2026-11)
- Fines in general: a verzuimboete is for missed deadlines; a vergrijpboete is for intent (50%) or gross negligence (25%) and can rise to 100%. Bezwaar against a boete is possible (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/boete, gecontroleerd 2026-11)
- Betalingsregeling (payment plan) for ondernemers: up to 12 months as standard. Use the form "Verzoek betalingsregeling en uitstel van betaling van belasting en/of premie voor ondernemingen". If requested before the payment deadline, no aanmaning or dwangbevel is sent. Invorderingsrente still applies. Answer within 8 weeks; if refused, the full amount is due at once (bron: https://www.belastingdienst.nl/wps/wcm/connect/nl/betalenenontvangen/content/ik-kan-mijn-belasting-niet-op-tijd-betalen-betalingsregeling, gecontroleerd 2026-11)
- Practical tip: call the BelastingTelefoon (0800-0543) early to avoid dwangbevel costs (bron: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/standaard_functies/prive/contact/rechten_en_plichten_bij_de_belastingdienst/aanmaning, gecontroleerd 2026-11)

### CJIB (Centraal Justitieel Incassobureau)
- The CJIB is the government agency that sends and collects fines, e.g. traffic fines (bron: https://www.rijksoverheid.nl/onderwerpen/straffen-en-maatregelen/vraag-en-antwoord/werkwijze-boete-verkeersovertreding, gecontroleerd 2026-11)
- Payment term: pay before the date in the CJIB letter. The commonly cited standard term of 8 weeks is NOT VERIFIED (bron: https://www.juridischloket.nl/politie-en-justitie/verkeersovertredingen/gijzeling-na-niet-betalen-boete/, gecontroleerd 2026-11)
- Escalation for traffic fines: the 1st aanmaning adds 50% of the fine, the 2nd aanmaning adds 100%. For other fine types each aanmaning is +20%, minimum €40. Administrative costs are €7 (under €500) or €15 (€500 or more) (bron: https://www.cjib.nl/bedragen-verhogingen, gecontroleerd 2026-11)
- From 1 Jul 2026 a pilot runs for at least 18 months: a free payment reminder is sent before the first increase on traffic fines (bron: https://www.rijksoverheid.nl/actueel/nieuws/2026/06/24/nieuwe-wetten-justitie-en-veiligheid-per-1-juli-2026, gecontroleerd 2026-11)
- After the reminders: garnishment of wages or bank account, a dwangbevel via a deurwaarder (bailiff), seizure of driving licence or car, and finally gijzeling (detention) of at most 7 days per fine with a judge's permission (bron: https://www.juridischloket.nl/politie-en-justitie/verkeersovertredingen/gijzeling-na-niet-betalen-boete/, gecontroleerd 2026-11)
- You can ask the CJIB for a betalingsregeling. Exact conditions are NOT VERIFIED (bron: same URL, gecontroleerd 2026-11)
- Objecting to a traffic fine goes via the Digitaal Loket Verkeer of the OM (verkeer.loket.om.nl). The 6-week deadline is NOT VERIFIED (bron: https://www.om.nl/onderwerpen/v/verkeersboete, gecontroleerd 2026-11)

## 7. Payment by clients

- B2B: if no term is agreed, the payment term is 30 days. The maximum is 60 days, unless agreed otherwise and there is no disadvantage to either party (bron: https://ondernemersplein.overheid.nl/wetten-en-regels/betalingstermijn-incassokosten-en-wettelijke-rente/, gecontroleerd 2026-11)
- Large companies paying an SME or ZZP'er: maximum 30 days. A company is "large" if it meets 2 of 3 criteria in 2 consecutive years: ≥250 employees, net turnover >€50M, balance sheet total >€25M (bron: same URL, gecontroleerd 2026-11)
- Government clients: 30 days after receiving the invoice (bron: same URL, gecontroleerd 2026-11)
- Consumers: there is no statutory term. Set a reasonable term in the contract or terms and conditions (bron: same URL, gecontroleerd 2026-11)
- Wettelijke handelsrente (B2B and government) is 10.4% since 1 Jul 2026. Wettelijke rente for consumers is 4% since 1 Jan 2026 (bron: https://www.rijksoverheid.nl/onderwerpen/schulden/vraag-en-antwoord/hoogte-wettelijke-rente, gecontroleerd 2026-11)
- You must tell the client in advance that you charge statutory interest, e.g. on the invoice or reminder (bron: https://ondernemersplein.overheid.nl/wetten-en-regels/betalingstermijn-incassokosten-en-wettelijke-rente/, gecontroleerd 2026-11)
- Incassokosten (WIK scale, maximum): 15% of the first €2,500; 10% of the next €2,500; 5% of the next €5,000; 1% of the next €190,000; 0.5% above that. The minimum is €40 (bron: https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/schulden/hoogte-incassokosten, gecontroleerd 2026-11)
- The overall maximum is €6,775 (bron: https://ondernemersplein.overheid.nl/wetten-en-regels/betalingstermijn-incassokosten-en-wettelijke-rente/, gecontroleerd 2026-11)
- Consumers: incassokosten may only be charged after a free reminder letter (the 14-dagenbrief) giving 14 days to pay. If the letter is missing or wrong, the costs are not owed (bron: https://www.juridischloket.nl/schulden-en-incasso/incasso-en-betalingsachterstand/incassokosten/, gecontroleerd 2026-11)
- B2B: a reminder is not required. Parties may agree different collection terms in a contract; without a contract the statutory rules apply (bron: https://ondernemersplein.overheid.nl/wetten-en-regels/betalingstermijn-incassokosten-en-wettelijke-rente/, gecontroleerd 2026-11)
- Btw on incassokosten may be added only if the creditor itself is not btw-liable (bron: https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/schulden/hoogte-incassokosten, gecontroleerd 2026-11)

## 8. Minimum wage and other thresholds

- There is no legal minimum hourly rate for ZZP'ers. The minimum wage applies to employees. From 31 Dec 2026, however, a rate below €38/hour triggers the presumption of employment (see section 3) (bron: https://www.zzp-nederland.nl/nieuws/tweede-kamer-stemt-met-wet-rechtsvermoeden-bij-laag-uurtarief, gecontroleerd 2026-11; secondary source)
- Minimum wage for ages 21+ in 2026: €14.71/hour from 1 Jan 2026 and €14.99/hour from 1 Jul 2026 (bron: https://www.rijksoverheid.nl/themas/werk/minimumloon/bedragen-minimumloon/bedragen-minimumloon-2026, gecontroleerd 2026-11)
- Minimum wage for ages 21+ from 1 Jan 2027: €15.29/hour (bron: https://www.hrpraktijk.nl/juridisch/belonen/werkgevers-betalen-21-plussers-vanaf-januari-2027-minimaal-1529-euro-per-uur/, gecontroleerd 2026-11; secondary source citing the minister's letter, not an official page)
- Other 2026 thresholds: KOR €20,000; urencriterium 1,225 hours; Zvw maximum contribution income €79,409; btw registration threshold €2,200 (see sections above for sources).
- Safety rules (Arbo) in construction: inspect tools and machines at least once a year, and use fall protection when working above 2.5 m (bron: https://ondernemersplein.overheid.nl/bedrijf-starten/starten-als-zzper/starten-als-zzper-in-de-bouw, gecontroleerd 2026-11)
`;
