export type Volunteer = {
  name: string;
  faculty: string;
  education_level: "highschool" | "undergrad" | "med_student" | "none";
  interests: string[];
  lat: number;
  lng: number;
};

export type Opportunity = {
  title: string;
  category: string;
  faculties_wanted: string[];
  lat: number;
  lng: number;
  slots_total: number;
  slots_filled: number;
  zone_id?: string | null;
  min_level?: Volunteer["education_level"] | null;
};

export type Zone = {
  id: string;
  name: string;
  community_health_score: number; // 0-1, lower = higher need
};

//haversine_distance
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

//level_gating
const LEVELS: Volunteer["education_level"][] = ["none", "highschool", "undergrad", "med_student"];

function levelRank(level: Volunteer["education_level"]): number {
  const i = LEVELS.indexOf(level);
  return i === -1 ? 0 : i;
}

export function passesLevelGate(volunteer: Volunteer, opp: Opportunity): boolean {
  if (!opp.min_level) return true;
  return levelRank(volunteer.education_level) >= levelRank(opp.min_level);
}

//match_score(0-1) + priority boolean
//interest 0.30 + faculty/level 0.25 + proximity 0.25 + zone priority 0.10 + urgency 0.10
export function matchScore(volunteer: Volunteer, opp: Opportunity, zones: Zone[] = []) {
  const interestScore = opp.category && volunteer.interests.includes(opp.category) ? 1 : 0;

  const facultyOk =
    !opp.faculties_wanted || opp.faculties_wanted.length === 0 || opp.faculties_wanted.includes(volunteer.faculty);
  const levelOk = passesLevelGate(volunteer, opp);
  const facultyScore = facultyOk && levelOk ? 1 : 0;

  const km = haversine(volunteer.lat, volunteer.lng, opp.lat, opp.lng);
  const distScore = Math.max(0, 1 - km / 25);

  const zone = zones.find((z) => z.id === opp.zone_id);
  // low community_health_score = high need = high priority, so invert it for the bonus weight
  const zoneScore = zone ? 1 - zone.community_health_score : 0;
  // threshold is a placeholder — confirm with team what counts as "priority"
  const priority = zone ? zone.community_health_score < 0.4 : false;

  const urgency = 1 - opp.slots_filled / opp.slots_total;

  const score =
    0.3 * interestScore + 0.25 * facultyScore + 0.25 * distScore + 0.1 * zoneScore + 0.1 * urgency;

  return {
    score,
    priority,
    breakdown: { interestScore, facultyScore, distScore, km, zoneScore, urgency, gated: !levelOk },
  };
}

//match_reason(LLM swapped in later)
const CATEGORY_LABELS: Record<string, string> = {
  maternal_child: "maternal & child health",
  elderly: "elderly care",
  nutrition: "nutrition",
  mental_health: "mental health",
  emergency: "emergency care",
  chronic_disease: "chronic disease management",
};

export function prettyCategory(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/_/g, " ");
}

export function matchReason(volunteer: Volunteer, opp: Opportunity): string {
  const km = haversine(volunteer.lat, volunteer.lng, opp.lat, opp.lng);
  return `Matches your interest in ${prettyCategory(opp.category)}, ${km.toFixed(1)}km away, open to ${volunteer.faculty} volunteers.`;
}