// The business behind Haaks, shown in the footer and the legal pages.
// Dutch law (art. 3:15d BW, Handelsregisterwet) requires these on the site.
export const COMPANY = {
  name: "Badr Company Bouwbedrijf",
  kvk: "93714130",
  // The btw-id (NL…B..), not the old omzetbelastingnummer. Shown once filled in.
  btw: "",
  address: "Parallelweg 30-16, 8271 PB IJsselmuiden",
  email: "badrkomp@gmail.com",
};

export function fillCompany(text: string) {
  return text
    .replaceAll("{name}", COMPANY.name)
    .replaceAll("{kvk}", COMPANY.kvk)
    .replaceAll("{address}", COMPANY.address)
    .replaceAll("{email}", COMPANY.email);
}
