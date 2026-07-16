/**
 * The five administrative regions (kota administrasi) of DKI Jakarta.
 *
 * Zone pickers are limited to these. Filtering by province alone isn't enough —
 * "RW 02 Jagakarsa" is also DKI Jakarta but is a sub-district, not a region, and
 * "Depok" is West Java entirely. Both stay in the zones table (seeded events
 * reference Depok) but are never offered.
 */
export const JAKARTA_REGIONS = [
  "Jakarta Pusat",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Selatan",
  "Jakarta Timur",
] as const;

/** Keeps a zone list to the five regions, in the canonical order above. */
export function toJakartaRegions<T extends { name: string }>(zones: T[]): T[] {
  return JAKARTA_REGIONS.map((region) => zones.find((z) => z.name === region)).filter(
    (z): z is T => Boolean(z)
  );
}

/**
 * Options offered during profile building.
 *
 * INTEREST_OPTIONS are not cosmetic: the matcher scores a volunteer's
 * `student.interest` against the interest tags on `events.event_tags`, and a hit
 * is worth 0.30 — the single biggest term in the score (lib/matching.ts). These
 * values must stay identical to the tags actually used on events, or matching
 * silently returns nothing.
 *
 * Verified against the live DB on 2026-07-17:
 *   blood_drive, chronic_disease, elderly, emergency, maternal_child,
 *   mental_health, nutrition
 */
export const INTEREST_OPTIONS: { value: string; label: string; blurb: string; icon: string }[] = [
  { value: "maternal_child", label: "Maternal & child health", blurb: "Posyandu weighing, prenatal classes", icon: "🤱" },
  { value: "elderly", label: "Elderly care", blurb: "Wellness checks, blood pressure screening", icon: "🧓" },
  { value: "nutrition", label: "Nutrition", blurb: "Education workshops, growth monitoring", icon: "🥗" },
  { value: "chronic_disease", label: "Chronic disease", blurb: "Diabetes and hypertension screening", icon: "🩺" },
  { value: "mental_health", label: "Mental health", blurb: "Community support and awareness", icon: "🧠" },
  { value: "emergency", label: "Emergency care", blurb: "First response and triage support", icon: "🚑" },
  { value: "blood_drive", label: "Blood drive", blurb: "Donation drives and donor care", icon: "🩸" },
];

/**
 * Faculty is stored on the profile but currently has no effect on matching: no
 * event carries a `faculty_wanted:` tag, so an empty wanted-list auto-passes and
 * facultyScore is always 1. Kept because the matcher will use it as soon as orgs
 * start restricting who can apply.
 */
export const FACULTY_OPTIONS = [
  "medicine",
  "nursing",
  "nutrition",
  "pharmacy",
  "psychology",
  "public health",
  "exploring",
];

export const FACULTY_LABELS: Record<string, string> = {
  medicine: "Medicine",
  nursing: "Nursing",
  nutrition: "Nutrition",
  pharmacy: "Pharmacy",
  psychology: "Psychology",
  "public health": "Public health",
  exploring: "Still exploring",
};
