import { matchVolunteerToOpportunity } from "./matching";

export type ParticipantRow = {
  application_id: string;
  event_id: string;
  user_id: string;
  application_status: "pending" | "rejected" | "accepted" | "verified" | "withdrawn";
  student: { display_name: string; faculty: string | null } | null;
  events: {
    event_name: string;
    event_date: string | null;
    event_location: string | null;
    zone_id: string | null;
  } | null;
};

// education_level isn't on the student table yet (pending schema migration) —
// returns null until that column exists.
export function mapApplicationRow(row: ParticipantRow) {
  const match = matchVolunteerToOpportunity(
    {
      id: row.user_id,
      faculty: row.student?.faculty ?? null,
      educationLevel: null,
      interests: null,
      zoneId: null,
    },
    {
      id: row.event_id,
      facultiesWanted: null,
      levelsWanted: null,
      lat: null,
      lng: null,
      zoneId: row.events?.zone_id ?? null,
    }
  );

  return {
    applicationId: row.application_id,
    volunteerId: row.user_id,
    full_name: row.student?.display_name ?? null,
    education_level: null,
    faculty: row.student?.faculty ?? null,
    opportunity_title: row.events?.event_name ?? null,
    starts_at: row.events?.event_date ?? null,
    venue_name: row.events?.event_location ?? null,
    distance_km: match.distance_km,
    match_score: match.match_score,
    match_reason: match.match_reason,
    status: row.application_status,
  };
}
