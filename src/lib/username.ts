// @nick for the public profile page (/@nick). Same rule as the database check.
export const USERNAME_RE = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", ё: "e", є: "ye", ж: "zh", з: "z", и: "i", і: "i", ї: "yi",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// Lowercase latin: Cyrillic is spelled in latin letters, accents are dropped (ł → l too).
export function toLatin(s: string) {
  return s
    .toLowerCase()
    .split("")
    .map((c) => CYRILLIC[c] ?? c)
    .join("")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// What the builder typed, made into a nick (or null when nothing usable is left).
export function cleanUsername(input: string) {
  const s = toLatin(input.trim().replace(/^@+/, ""))
    .replace(/[\s-]+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/([._])[._]+/g, "$1")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30)
    .replace(/[._]+$/g, "");
  return USERNAME_RE.test(s) ? s : null;
}

// A first suggestion from the builder's name: "Ильгиз Юсупов" → "ilgiz.yusupov".
export function suggestUsername(name: string | null | undefined) {
  return cleanUsername((name ?? "").split(/\s+/).slice(0, 2).join(" ")) ?? "";
}
