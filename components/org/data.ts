import type { LucideIcon } from "lucide-react";
import { Calendar, Droplet, Eye, Heart, Stethoscope, Tag } from "lucide-react";

/**
 * Static shape of the org dashboard. Replace with API data when the backend
 * lands: GET /api/applications?oppId=X, PATCH /api/applications/:id,
 * POST /api/opportunities, POST /api/checkin.
 */

/** Display face for headings and figures. app/org/layout.tsx points --font-display at Geist for /org. */
export const displayFont = "var(--font-display,'Geist','Inter',sans-serif)";

export type Tab = "post" | "appl" | "chk" | "prog";
export type Decision = "accepted" | "rejected";

export type Applicant = {
  id: number;
  name: string;
  level: string;
  faculty: string;
  match: number;
  reason: string;
  distance: number;
  avatar: string;
};

export type VerifiedVolunteer = {
  id: number;
  name: string;
  faculty: string;
  hours: number;
  time: string;
  avatar: string;
};

/** Total slots the opportunity was published with. */
export const TOTAL_SLOTS = 8;

/** Applications received. Higher than APPLICANTS.length — the table lists only the top matches. */
export const TOTAL_APPLIED = 12;

export const APPLICANTS: Applicant[] = [
  {
    id: 1,
    name: "Rina Wulandari",
    level: "Undergrad",
    faculty: "Medicine",
    match: 92,
    reason: "Maternal & child interest · 2 prior sessions",
    distance: 2.3,
    avatar: "#F6C9D6",
  },
  {
    id: 2,
    name: "Budi Santoso",
    level: "Med student",
    faculty: "Medicine",
    match: 88,
    reason: "Clinic experience, lives nearby",
    distance: 1.8,
    avatar: "#BFE0FF",
  },
  {
    id: 3,
    name: "Sari Dewi",
    level: "Undergrad",
    faculty: "Nursing",
    match: 81,
    reason: "Nursing skills fit the vitals role",
    distance: 3.4,
    avatar: "#C9F3B0",
  },
  {
    id: 4,
    name: "Andi Pratama",
    level: "Highschool",
    faculty: "Exploring",
    match: 64,
    reason: "New volunteer, very close by",
    distance: 0.9,
    avatar: "#FFE3B0",
  },
];

export const INITIAL_VERIFIED: VerifiedVolunteer[] = [
  { id: 1, name: "Rina Wulandari", faculty: "Medicine", hours: 4, time: "08:04", avatar: "#F6C9D6" },
  { id: 2, name: "Dewi Anggraini", faculty: "Nutrition", hours: 4, time: "08:11", avatar: "#D8F0C4" },
];

/** Volunteers the "simulate scan" button walks through, in order. */
export const SCAN_POOL: { name: string; faculty: string; avatar: string }[] = [
  { name: "Andi Pratama", faculty: "Public health", avatar: "#FFE3B0" },
  { name: "Sari Dewi", faculty: "Nursing", avatar: "#C9F3B0" },
  { name: "Budi Santoso", faculty: "Medicine", avatar: "#BFE0FF" },
  { name: "Maya Putri", faculty: "Psychology", avatar: "#F6C9D6" },
];

export const BASE_TYPES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "event", label: "Event", icon: Calendar },
  { key: "clinic", label: "Clinic help", icon: Stethoscope },
  { key: "shadow", label: "Shadowing", icon: Eye },
];

/** Icon shown for org-authored types that aren't one of BASE_TYPES. */
export const CUSTOM_TYPE_ICON: LucideIcon = Tag;

export const INITIAL_FACULTIES: Record<string, boolean> = {
  Medicine: true,
  Nursing: true,
  Nutrition: false,
  Pharmacy: false,
  Psychology: false,
  "Public health": false,
  Exploring: false,
};

/** Badge volunteers earn, keyed by opportunity type. */
export const REWARDS: Record<string, { badge: string; icon: LucideIcon }> = {
  event: { badge: "Blood Drive Volunteer", icon: Droplet },
  clinic: { badge: "Clinic Contributor", icon: Stethoscope },
  shadow: { badge: "Care Observer", icon: Eye },
};

export const FALLBACK_REWARD = { badge: "Community Volunteer", icon: Heart };

export const HEADERS: Record<Tab, [string, string]> = {
  post: [
    "Post an opportunity",
    "Build healthier communities by creating opportunities for volunteers to serve and grow.",
  ],
  appl: ["Applicants", "Review matched volunteers and build your healthy community"],
  chk: ["Live check-in", "Stamp volunteers verified on-site with a QR scan."],
  prog: ["Progress", "Track volunteers growing into certified community health workers."],
};

/**
 * Org-facing notifications. Placeholder — /api/notifications is volunteer-scoped
 * (it takes volunteerId), so there's no org feed to read from yet.
 */
export const NOTIFICATIONS: { id: number; title: string; body: string; time: string }[] = [
  { id: 1, title: "New applicant", body: "Rina Wulandari applied to Maternal & Child Health Drive.", time: "2 min ago" },
  { id: 2, title: "Check-in complete", body: "Dewi Anggraini was verified on-site — 4h credited.", time: "18 min ago" },
  { id: 3, title: "Slots filling up", body: "Maternal & Child Health Drive is 5 of 8 filled.", time: "1 hour ago" },
  { id: 4, title: "Volunteer ready to certify", body: "Ibu Dewi finished module 2 of 3.", time: "Yesterday" },
];

/** Footer stats on the left rail. */
export const SIDEBAR_STATS: { label: string; value: string }[] = [
  { label: "People helped", value: "1,284" },
  { label: "Volunteers developed", value: "47" },
];

export type PipelinePerson = {
  name: string;
  meta: string;
  avatar: string;
  /** Pull-quote explaining why they were flagged, or what they do now. */
  note?: string;
  /** Training completion, e.g. "66%". Renders a progress bar instead of a note. */
  barPct?: string;
};

/** Citizen → certified volunteer pipeline shown on the Progress tab. */
export const PIPELINE: { title: string; count: number; people: PipelinePerson[] }[] = [
  {
    title: "Flagged",
    count: 3,
    people: [
      {
        name: "Ibu Sari",
        meta: "RT 03 · 5 sessions attended",
        avatar: "#F6C9D6",
        note: "“Asked follow-up questions at 3 straight sessions”",
      },
      {
        name: "Pak Herman",
        meta: "RT 05 · 4 sessions attended",
        avatar: "#BFE0FF",
        note: "“Helped translate for neighbors during screening”",
      },
    ],
  },
  {
    title: "In training",
    count: 2,
    people: [
      { name: "Ibu Dewi", meta: "RT 01 · Module 2 of 3", avatar: "#C9F3B0", barPct: "66%" },
      { name: "Ibu Yuli", meta: "RT 07 · Module 3 of 3", avatar: "#FFE3B0", barPct: "95%" },
    ],
  },
  {
    title: "Certified",
    count: 4,
    people: [
      {
        name: "Ibu Ratna",
        meta: "RT 02 · now mentoring 2",
        avatar: "#D8F0C4",
        note: "Certified 3 months ago · runs monthly monitoring solo",
      },
      {
        name: "Pak Agus",
        meta: "RT 04 · now mentoring 1",
        avatar: "#EFEAF0",
        note: "Certified 2 months ago · leads hypertension check-ins",
      },
    ],
  },
];

/** XP awarded per verified hour. */
export const XP_PER_HOUR = 25;

/** Manual check-in code for this opportunity. The backend generates a real one per event (events.qr_code). */
export const CHECKIN_CODE = "CYK-4821";

/** Default copy for a new opportunity — the form starts prefilled so the demo has something to publish. */
export const DEFAULT_FORM = {
  title: "Maternal & Child Health Drive",
  when: "Sat 19 Jul · 08:00",
  where: "RW 04 Cipedak, Jakarta",
  notes: "Comfortable clothes, a water bottle, and enthusiasm. Basic training provided on-site by our certified volunteers.",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function matchColor(match: number) {
  if (match >= 85) return "#3DA35D";
  if (match >= 75) return "#C7A008";
  return "#D2453F";
}

/**
 * Deterministic QR-like pattern. Seeded so server and client render the same
 * cells — a random pattern would break hydration. Swap for a real encoder
 * once check-in codes are issued by the backend.
 */
export function qrCells() {
  const n = 21;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
      const on = finder
        ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)) &&
          !(x === 7 || y === 7)
        : rnd() > 0.52;
      if (on) cells.push({ x, y });
    }
  }
  return cells;
}
