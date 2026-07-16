// No `type` / `slots_total` / faculties_wanted / levels_wanted columns exist on
// public.events (and we're not changing the schema — see project decision).
// We piggyback on the existing event_tags text[] column: plain entries are
// real interest tags (used by badge criteria matching), "key:value" entries
// carry the extra structured fields CONTRACT.md needs. Parse/build only
// through these two functions so the convention stays in one place.

export type OpportunityType = "event" | "clinic_help" | "shadowing";

const TYPE_PREFIX = "opp_type:";
const SLOTS_PREFIX = "slots_total:";
const FACULTY_PREFIX = "faculty_wanted:";
const LEVEL_PREFIX = "level_wanted:";

export interface ParsedOpportunityTags {
  type: OpportunityType;
  slotsTotal: number;
  facultiesWanted: string[];
  levelsWanted: string[];
  interestTags: string[];
}

export function parseEventTags(tags: string[] | null): ParsedOpportunityTags {
  const list = tags ?? [];
  let type: OpportunityType = "event";
  let slotsTotal = 10;
  const facultiesWanted: string[] = [];
  const levelsWanted: string[] = [];
  const interestTags: string[] = [];

  for (const tag of list) {
    if (tag.startsWith(TYPE_PREFIX)) {
      type = tag.slice(TYPE_PREFIX.length) as OpportunityType;
    } else if (tag.startsWith(SLOTS_PREFIX)) {
      slotsTotal = parseInt(tag.slice(SLOTS_PREFIX.length), 10) || 0;
    } else if (tag.startsWith(FACULTY_PREFIX)) {
      facultiesWanted.push(tag.slice(FACULTY_PREFIX.length));
    } else if (tag.startsWith(LEVEL_PREFIX)) {
      levelsWanted.push(tag.slice(LEVEL_PREFIX.length));
    } else {
      interestTags.push(tag);
    }
  }

  return { type, slotsTotal, facultiesWanted, levelsWanted, interestTags };
}

export function buildEventTags(input: {
  type: OpportunityType;
  slotsTotal: number;
  facultiesWanted: string[];
  levelsWanted: string[];
  interestTags: string[];
}): string[] {
  return [
    ...input.interestTags,
    `${TYPE_PREFIX}${input.type}`,
    `${SLOTS_PREFIX}${input.slotsTotal}`,
    ...input.facultiesWanted.map((f) => `${FACULTY_PREFIX}${f}`),
    ...input.levelsWanted.map((l) => `${LEVEL_PREFIX}${l}`),
  ];
}

export function computeStatus(
  slotsTotal: number,
  slotsFilled: number,
  startsAt: string | null
): "open" | "full" | "completed" {
  if (startsAt && new Date(startsAt).getTime() < Date.now()) return "completed";
  if (slotsFilled >= slotsTotal) return "full";
  return "open";
}
