// «Цифровой сотрудник» (Ultra): the worker's own AI employee. Pure data, safe for the browser.
export const STAFF_FACES = [1, 2, 3, 4, 5, 6, 7] as const;
export type StaffFace = (typeof STAFF_FACES)[number];
export const STAFF_STYLES = ["short", "detailed", "humor"] as const;
export type StaffStyle = (typeof STAFF_STYLES)[number];

// The name a face gets until the worker gives it another one.
export const DEFAULT_NAMES: Record<StaffFace, string> = { 1: "Anna", 2: "Sofia", 3: "Amina", 4: "Leyla", 5: "Mark", 6: "Yusuf", 7: "Omar" };

export const faceUrl = (face: number) => `/staff/face-${STAFF_FACES.includes(face as StaffFace) ? face : 1}.jpg`;

export type StaffSettings = { face: StaffFace; name: string; formal: boolean; style: StaffStyle; lang: string | null };

type ProfileStaff = { staff_face?: number | null; staff_name?: string | null; staff_formal?: boolean | null; staff_style?: string | null; staff_lang?: string | null };

export function staffOf(p: ProfileStaff): StaffSettings {
  const face = (STAFF_FACES as readonly number[]).includes(p.staff_face ?? 0) ? (p.staff_face as StaffFace) : 1;
  const style = (STAFF_STYLES as readonly string[]).includes(p.staff_style ?? "") ? (p.staff_style as StaffStyle) : "short";
  return { face, name: p.staff_name?.trim() || DEFAULT_NAMES[face], formal: Boolean(p.staff_formal), style, lang: p.staff_lang ?? null };
}

export type StaffMessage = { id: string; role: "user" | "staff"; body: string; image_path: string | null; image_paths?: string[] | null; created_at: string };
