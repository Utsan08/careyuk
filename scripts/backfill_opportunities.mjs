// One-off: assigns zone_id (real column, already existed) and adds
// opp_type:/slots_total: tags (see lib/opportunityTags.ts) to every event so
// the opportunities/zones/dashboard endpoints have real data to read, without
// any schema changes.
//
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill_opportunities.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ZONE = {
  depok: "a1111111-1111-1111-1111-111111111111",
  jaksel: "a2222222-2222-2222-2222-222222222222",
  jakpus: "a3333333-3333-3333-3333-333333333333",
  jaktim: "a4444444-4444-4444-4444-444444444444",
  jagakarsa: "a5555555-5555-5555-5555-555555555555",
};

// event_name -> { zone, type, slotsTotal, extraTags (only for events with no tags yet) }
const PATCHES = {
  "Blood Donation Drive - Blok M": { zone: ZONE.jaksel, type: "event", slots: 15 },
  "Blood Donation Drive - Pasar Minggu": { zone: ZONE.jaksel, type: "event", slots: 15 },
  "Blood Pressure Screening": { zone: ZONE.jaksel, type: "event", slots: 6, extraTags: ["elderly"] },
  "Child Growth Monitoring": { zone: ZONE.depok, type: "event", slots: 8 },
  "Child Immunization Day": { zone: ZONE.jagakarsa, type: "event", slots: 10 },
  "Community Mental Health Workshop": { zone: ZONE.jakpus, type: "event", slots: 12 },
  "Diabetes Screening": { zone: ZONE.jaksel, type: "clinic_help", slots: 8 },
  "Disaster Preparedness Training": { zone: ZONE.jaksel, type: "event", slots: 20 },
  "Elderly Home Visit Program": { zone: ZONE.jaksel, type: "shadowing", slots: 5 },
  "Elderly Wellness Check": { zone: ZONE.jaksel, type: "event", slots: 8 },
  "Emergency Room Shadowing": { zone: ZONE.jakpus, type: "shadowing", slots: 3 },
  "Free Health Screening - Cipedak": { zone: ZONE.jagakarsa, type: "clinic_help", slots: 10 },
  "Maternal Health Checkup": { zone: ZONE.depok, type: "clinic_help", slots: 5 },
  "Medical Student Shadowing - Internal Medicine": { zone: ZONE.jakpus, type: "shadowing", slots: 4 },
  "Nutrition Counseling Session": { zone: ZONE.jagakarsa, type: "clinic_help", slots: 6 },
  "Nutrition Education Workshop": { zone: ZONE.jaksel, type: "event", slots: 10 },
  "Pediatric Ward Shadowing": { zone: ZONE.jakpus, type: "shadowing", slots: 4 },
  "Posyandu Weighing Day": { zone: ZONE.depok, type: "event", slots: 10 },
  "Prenatal Class": { zone: ZONE.depok, type: "clinic_help", slots: 8 },
  "RSCM Mobile Clinic - Cipedak": { zone: ZONE.jagakarsa, type: "clinic_help", slots: 12 },
};

async function main() {
  const { data: events, error } = await admin
    .from("events")
    .select("event_id, event_name, event_tags");
  if (error) throw error;

  for (const event of events) {
    const patch = PATCHES[event.event_name];
    if (!patch) {
      console.warn(`No patch defined for "${event.event_name}", skipping`);
      continue;
    }

    const existingTags = (event.event_tags ?? []).filter(
      (t) => !t.startsWith("opp_type:") && !t.startsWith("slots_total:")
    );
    const interestTags = existingTags.length > 0 ? existingTags : patch.extraTags ?? [];

    const newTags = [
      ...interestTags,
      `opp_type:${patch.type}`,
      `slots_total:${patch.slots}`,
    ];

    const { error: updateError } = await admin
      .from("events")
      .update({ zone_id: patch.zone, event_tags: newTags })
      .eq("event_id", event.event_id);

    if (updateError) throw updateError;
    console.log(`Updated ${event.event_name}: zone=${patch.zone}, tags=${JSON.stringify(newTags)}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
