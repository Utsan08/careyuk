import { matchVolunteerToOpportunity } from "./matching";
import { parseEventTags, computeStatus } from "./opportunityTags";

type ParticipantStatusRow = { application_status: string };

export type EventWithCounts = {
  event_id: string;
  event_name: string;
  event_date: string | null;
  event_duration: number | null;
  event_tags: string[] | null;
  event_location: string | null;
  zone_id: string | null;
  organization_id: string;
  organization: { display_name: string } | null;
  zones: { zone_name: string } | null;
  participants: ParticipantStatusRow[];
};

export function mapOrgOpportunityRow(row: EventWithCounts) {
  const { type, slotsTotal } = parseEventTags(row.event_tags);
  const slotsFilled = row.participants.filter((p) => p.application_status === "accepted").length;
  const applicantCount = row.participants.length;

  return {
    id: row.event_id,
    title: row.event_name,
    type,
    starts_at: row.event_date,
    slots_total: slotsTotal,
    slots_filled: slotsFilled,
    applicant_count: applicantCount,
    status: computeStatus(slotsTotal, slotsFilled, row.event_date),
  };
}

export function mapFeedOpportunityRow(
  row: EventWithCounts,
  volunteer: {
    id: string;
    faculty: string | null;
    educationLevel: string | null;
    interests: string[] | null;
    zoneId: string | null;
  }
) {
  const { type, slotsTotal, facultiesWanted, levelsWanted } = parseEventTags(row.event_tags);
  const slotsFilled = row.participants.filter((p) => p.application_status === "accepted").length;

  const match = matchVolunteerToOpportunity(volunteer, {
    id: row.event_id,
    facultiesWanted,
    levelsWanted,
    lat: null,
    lng: null,
    zoneId: row.zone_id,
  });

  return {
    id: row.event_id,
    title: row.event_name,
    org_name: row.organization?.display_name ?? null,
    type,
    distance_km: match.distance_km,
    starts_at: row.event_date,
    slots_total: slotsTotal,
    slots_filled: slotsFilled,
    match_score: match.match_score,
    match_reason: match.match_reason,
    zone_name: row.zones?.zone_name ?? null,
    // Needs community_health_score to determine "low-score zone" — that
    // column doesn't exist (no schema changes per project decision).
    priority: false,
  };
}
