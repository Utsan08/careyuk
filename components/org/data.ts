import type { LucideIcon } from "lucide-react";
import { Calendar, Droplet, Eye, Heart, Stethoscope, Tag } from "lucide-react";

/**
 * Static shape of the org dashboard. Replace with API data when the backend
 * lands: GET /api/applications?oppId=X, PATCH /api/applications/:id,
 * POST /api/opportunities, POST /api/checkin.
 */

/** Display face for headings and figures. Variable is set by app/org/layout.tsx. */
export const displayFont = "var(--font-bricolage), sans-serif";

export type Tab = "post" | "appl" | "chk";
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
  post: ["Post an opportunity", "Create a ticket — volunteers get matched and earn verified hours."],
  appl: ["Applicants", "Review matched volunteers and build your team."],
  chk: ["Live check-in", "Stamp volunteers verified on-site with a QR scan."],
};

/** XP awarded per verified hour. */
export const XP_PER_HOUR = 25;

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
