// Match scoring for volunteer <-> opportunity feed ranking.
// weights: interest 0.30 + faculty/level 0.25 + proximity 0.25 + zone priority 0.10 + urgency 0.10
//
// The events/student tables don't carry lat/lng or a single category/min_level
// (no schema changes per project decision — see lib/opportunityTags.ts), so
// proximity falls back to a same-zone proxy and interest/level matching works
// against the plural facultiesWanted/levelsWanted/interestTags tag lists.
// lat/lng are accepted as optional so real haversine distance kicks in
// automatically once those columns exist.

export type EducationLevel = "highschool" | "undergrad" | "med_student" | "none";

export interface MatchVolunteerInput {
  id: string;
  faculty: string | null;
  educationLevel: string | null;
  interests: string[] | null;
  zoneId: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface MatchOpportunityInput {
  id: string;
  facultiesWanted: string[] | null;
  levelsWanted: string[] | null;
  interestTags?: string[] | null;
  slotsTotal?: number;
  slotsFilled?: number;
  lat: number | null;
  lng: number | null;
  zoneId: string | null;
}

export interface MatchZoneInput {
  id: string;
  communityHealthScore: number; // 0-1, lower = higher need
}

export interface MatchResult {
  match_score: number;
  match_reason: string;
  distance_km: number;
  priority: boolean;
}

const LEVELS: EducationLevel[] = ["none", "highschool", "undergrad", "med_student"];

function levelRank(level: string | null): number {
  const i = LEVELS.indexOf((level ?? "none") as EducationLevel);
  return i === -1 ? 0 : i;
}

export function passesLevelGate(volunteer: MatchVolunteerInput, opportunity: MatchOpportunityInput): boolean {
  const levelsWanted = opportunity.levelsWanted ?? [];
  if (levelsWanted.length === 0) return true;
  const minRank = Math.min(...levelsWanted.map(levelRank));
  return levelRank(volunteer.educationLevel) >= minRank;
}

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

const CATEGORY_LABELS: Record<string, string> = {
  maternal_child: "maternal & child health",
  elderly: "elderly care",
  nutrition: "nutrition",
  mental_health: "mental health",
  emergency: "emergency care",
  chronic_disease: "chronic disease management",
};

export function prettyCategory(tag: string): string {
  return CATEGORY_LABELS[tag] || tag.replace(/_/g, " ");
}

export function matchVolunteerToOpportunity(
  volunteer: MatchVolunteerInput,
  opportunity: MatchOpportunityInput,
  zones: MatchZoneInput[] = []
): MatchResult {
  const interests = volunteer.interests ?? [];
  const interestTags = opportunity.interestTags ?? [];
  const matchedInterests = interestTags.filter((tag) => interests.includes(tag));
  const interestScore = matchedInterests.length > 0 ? 1 : 0;

  const facultiesWanted = opportunity.facultiesWanted ?? [];
  const facultyOk =
    facultiesWanted.length === 0 || (volunteer.faculty != null && facultiesWanted.includes(volunteer.faculty));
  const levelOk = passesLevelGate(volunteer, opportunity);
  const facultyScore = facultyOk && levelOk ? 1 : 0;

  let km = 0;
  let distScore: number;
  if (volunteer.lat != null && volunteer.lng != null && opportunity.lat != null && opportunity.lng != null) {
    km = haversine(volunteer.lat, volunteer.lng, opportunity.lat, opportunity.lng);
    distScore = Math.max(0, 1 - km / 25);
  } else {
    // no lat/lng tracked yet — same-zone is the best proximity signal we have
    distScore = volunteer.zoneId && opportunity.zoneId && volunteer.zoneId === opportunity.zoneId ? 1 : 0.5;
  }

  const zone = zones.find((z) => z.id === opportunity.zoneId);
  // low communityHealthScore = high need = high priority, so invert it for the bonus weight
  const zoneScore = zone ? 1 - zone.communityHealthScore : 0;
  const priority = zone ? zone.communityHealthScore < 0.4 : false;

  const slotsTotal = opportunity.slotsTotal ?? 0;
  const slotsFilled = opportunity.slotsFilled ?? 0;
  const urgency = slotsTotal > 0 ? 1 - slotsFilled / slotsTotal : 0;

  const score =
    0.3 * interestScore + 0.25 * facultyScore + 0.25 * distScore + 0.1 * zoneScore + 0.1 * urgency;

  const reasonParts: string[] = [];
  if (matchedInterests.length > 0) {
    reasonParts.push(`matches your interest in ${matchedInterests.map(prettyCategory).join(", ")}`);
  }
  if (km > 0) {
    reasonParts.push(`${km.toFixed(1)}km away`);
  }
  reasonParts.push(`open to ${volunteer.faculty ?? "all"} volunteers`);

  return {
    match_score: score,
    match_reason: reasonParts.join(", "),
    distance_km: km,
    priority,
  };
}
