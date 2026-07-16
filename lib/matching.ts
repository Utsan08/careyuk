// Import hook for Darren's matching function. Do NOT implement scoring logic
// here — this file only defines the agreed shape so app/api/opportunities
// can wire up the feed today. Swap the body of matchVolunteerToOpportunity
// for Darren's real implementation (or re-point this import at his module)
// once it lands.

export interface MatchVolunteerInput {
  id: string;
  faculty: string | null;
  educationLevel: string | null;
  interests: string[] | null;
  zoneId: string | null;
}

export interface MatchOpportunityInput {
  id: string;
  facultiesWanted: string[] | null;
  levelsWanted: string[] | null;
  lat: number | null;
  lng: number | null;
  zoneId: string | null;
}

export interface MatchResult {
  match_score: number;
  match_reason: string;
  distance_km: number;
  priority: boolean;
}

export function matchVolunteerToOpportunity(
  _volunteer: MatchVolunteerInput,
  _opportunity: MatchOpportunityInput
): MatchResult {
  // PLACEHOLDER — replace with Darren's matching function.
  return {
    match_score: 0,
    match_reason: "matching not yet implemented",
    distance_km: 0,
    priority: false,
  };
}
