// One-off seed script — extends the existing live Supabase data to the
// target demo counts (8 volunteers, 6 orgs, 5 zones, 20 opportunities) and
// creates matching Supabase Auth accounts (password: demo1234) for every
// seed profile so they can log in through the real auth flow.
//
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// event_tags carries an extra "opp_type:<event|clinic_help|shadowing>" marker
// alongside real interest tags — there's no `type` column on events yet (see
// the migration handed to the schema owner). Once that column exists, backfill
// it from this marker instead of re-guessing.

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

const DEMO_PASSWORD = "demo1234";

async function ensureAuthUser(id, email) {
  const { error } = await admin.auth.admin.createUser({
    id,
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error && !error.message.includes("already been registered") && !error.message.includes("already exists")) {
    throw new Error(`auth user ${email}: ${error.message}`);
  }
}

async function upsert(table, rows, conflictCol) {
  const { error } = await admin.from(table).upsert(rows, { onConflict: conflictCol });
  if (error) throw new Error(`${table}: ${error.message}`);
}

const newVolunteers = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    display_name: "Budi Santoso",
    email: "budi.santoso@ui.ac.id",
    faculty: "pharmacy",
    interest: ["chronic_disease"],
    bio: "Pharmacy student interested in medication counseling for chronic disease patients.",
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    display_name: "Dewi Anggraini",
    email: "dewi.anggraini@ui.ac.id",
    faculty: "psychology",
    interest: ["mental_health"],
    bio: "Psychology student focused on community mental health support.",
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    display_name: "Farhan Hidayat",
    email: "farhan.hidayat@ui.ac.id",
    faculty: "public_health",
    interest: ["emergency", "chronic_disease"],
    bio: "Public health student interested in community outreach and disaster preparedness.",
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    display_name: "Maya Kusuma",
    email: "maya.kusuma@student.sman1depok.sch.id",
    faculty: "exploring",
    interest: ["maternal_child", "nutrition"],
    bio: "High school student exploring a future in community health.",
  },
];

const newOrgs = [
  {
    id: "f1111111-1111-1111-1111-111111111111",
    display_name: "RSCM Outreach",
    email: "outreach@rscm.co.id",
    bio: "RS Cipto Mangunkusumo's community outreach program running mobile clinics and student shadowing.",
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    display_name: "PMI Jakarta Selatan",
    email: "pmi.jaksel@pmi.or.id",
    bio: "Indonesian Red Cross South Jakarta chapter — blood drives and emergency response training.",
  },
  {
    id: "f3333333-3333-3333-3333-333333333333",
    display_name: "FKUI Komunitas",
    email: "komunitas@fk.ui.ac.id",
    bio: "Faculty of Medicine UI community health program — clinical shadowing and public health workshops.",
  },
  {
    id: "f4444444-4444-4444-4444-444444444444",
    display_name: "Klinik Sehat Jagakarsa",
    email: "klinik.jagakarsa@jakarta.go.id",
    bio: "Local clinic serving the Jagakarsa and Srengseng communities in South Jakarta.",
  },
];

const orgIds = {
  posyanduMelati: "44444444-4444-4444-4444-444444444444",
  puskesmasKby: "55555555-5555-5555-5555-555555555555",
  rscm: newOrgs[0].id,
  pmi: newOrgs[1].id,
  fkui: newOrgs[2].id,
  klinikJagakarsa: newOrgs[3].id,
};

const newEvents = [
  { name: "Posyandu Weighing Day", org: orgIds.posyanduMelati, type: "event", tags: ["maternal_child"], loc: "Posyandu Melati - Depok", date: "2026-08-03T02:00:00+00:00", hrs: 3, desc: "Monthly infant weighing and growth tracking session." },
  { name: "Prenatal Class", org: orgIds.posyanduMelati, type: "clinic_help", tags: ["maternal_child"], loc: "Posyandu Melati - Depok", date: "2026-08-17T03:00:00+00:00", hrs: 2, desc: "Prenatal education class for expecting mothers." },
  { name: "Diabetes Screening", org: orgIds.puskesmasKby, type: "clinic_help", tags: ["chronic_disease"], loc: "Puskesmas Kebayoran Lama", date: "2026-08-12T02:00:00+00:00", hrs: 4, desc: "Community diabetes screening and counseling." },
  { name: "Elderly Wellness Check", org: orgIds.puskesmasKby, type: "event", tags: ["elderly"], loc: "Puskesmas Kebayoran Lama", date: "2026-08-19T02:00:00+00:00", hrs: 3, desc: "Wellness checks for elderly residents." },
  { name: "RSCM Mobile Clinic - Cipedak", org: orgIds.rscm, type: "clinic_help", tags: ["chronic_disease"], loc: "RW 04 Cipedak, Jagakarsa", date: "2026-08-09T01:00:00+00:00", hrs: 5, desc: "Mobile clinic bringing RSCM specialists to RW 04 Cipedak." },
  { name: "Pediatric Ward Shadowing", org: orgIds.rscm, type: "shadowing", tags: ["maternal_child"], loc: "RSCM - Jakarta Pusat", date: "2026-08-14T01:00:00+00:00", hrs: 6, desc: "Shadow pediatric staff on rounds." },
  { name: "Emergency Room Shadowing", org: orgIds.rscm, type: "shadowing", tags: ["emergency"], loc: "RSCM - Jakarta Pusat", date: "2026-08-21T01:00:00+00:00", hrs: 6, desc: "Shadow ER staff during a shift." },
  { name: "Disaster Preparedness Training", org: orgIds.pmi, type: "event", tags: ["emergency"], loc: "PMI Jakarta Selatan", date: "2026-08-06T03:00:00+00:00", hrs: 3, desc: "Community disaster preparedness and first-aid training." },
  { name: "Blood Donation Drive - Pasar Minggu", org: orgIds.pmi, type: "event", tags: ["blood_drive"], loc: "Pasar Minggu, Jakarta Selatan", date: "2026-08-23T02:00:00+00:00", hrs: 4, desc: "Community blood donation drive." },
  { name: "Blood Donation Drive - Blok M", org: orgIds.pmi, type: "event", tags: ["blood_drive"], loc: "Blok M, Jakarta Selatan", date: "2026-08-28T02:00:00+00:00", hrs: 4, desc: "Blood donation drive at Blok M." },
  { name: "Medical Student Shadowing - Internal Medicine", org: orgIds.fkui, type: "shadowing", tags: ["chronic_disease"], loc: "FKUI - Salemba", date: "2026-08-11T01:00:00+00:00", hrs: 8, desc: "Shadow internal medicine rounds at FKUI teaching hospital." },
  { name: "Community Mental Health Workshop", org: orgIds.fkui, type: "event", tags: ["mental_health"], loc: "FKUI - Salemba", date: "2026-08-18T03:00:00+00:00", hrs: 3, desc: "Workshop on community mental health awareness." },
  { name: "Free Health Screening - Cipedak", org: orgIds.fkui, type: "clinic_help", tags: ["chronic_disease"], loc: "RW 04 Cipedak, Jagakarsa", date: "2026-08-25T01:00:00+00:00", hrs: 4, desc: "Free general health screening for RW 04 Cipedak residents." },
  { name: "Child Immunization Day", org: orgIds.klinikJagakarsa, type: "event", tags: ["maternal_child"], loc: "RW 02 Jagakarsa", date: "2026-08-05T02:00:00+00:00", hrs: 3, desc: "Routine child immunization day." },
  { name: "Elderly Home Visit Program", org: orgIds.klinikJagakarsa, type: "shadowing", tags: ["elderly"], loc: "RW 09 Srengseng", date: "2026-08-15T02:00:00+00:00", hrs: 5, desc: "Home visits checking on elderly residents in RW 09 Srengseng." },
  { name: "Nutrition Counseling Session", org: orgIds.klinikJagakarsa, type: "clinic_help", tags: ["nutrition"], loc: "RW 02 Jagakarsa", date: "2026-08-27T02:00:00+00:00", hrs: 2, desc: "One-on-one nutrition counseling for families." },
];

async function main() {
  console.log("Creating auth accounts for existing orphaned profiles...");
  await ensureAuthUser("22222222-2222-2222-2222-222222222222", "aditya.pratama@fkui.ac.id");
  await ensureAuthUser("33333333-3333-3333-3333-333333333333", "sari.wulandari@ui.ac.id");
  await ensureAuthUser(orgIds.posyanduMelati, "posyandumelati@depok.go.id");
  await ensureAuthUser(orgIds.puskesmasKby, "pkm.kebayoranlama@jakarta.go.id");

  console.log("Creating new volunteers (user_auth + student + auth)...");
  for (const v of newVolunteers) {
    await ensureAuthUser(v.id, v.email);
    await upsert("user_auth", [{ user_id: v.id, display_name: v.display_name, role: "student", email: v.email }], "user_id");
    await upsert("student", [{ user_id: v.id, display_name: v.display_name, email: v.email, faculty: v.faculty, interest: v.interest, bio: v.bio }], "user_id");
  }

  console.log("Creating new orgs (user_auth + organization + auth)...");
  for (const o of newOrgs) {
    await ensureAuthUser(o.id, o.email);
    await upsert("user_auth", [{ user_id: o.id, display_name: o.display_name, role: "organization", email: o.email }], "user_id");
    await upsert("organization", [{ user_id: o.id, display_name: o.display_name, email: o.email, bio: o.bio }], "user_id");
  }

  console.log("Adding 5th zone...");
  await upsert(
    "zones",
    [{ zone_id: "a5555555-5555-5555-5555-555555555555", zone_name: "RW 02 Jagakarsa", province: "DKI Jakarta" }],
    "zone_id"
  );

  console.log("Creating 16 new events...");
  const eventRows = newEvents.map((e, i) => ({
    event_id: `10000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, "0")}`,
    event_name: e.name,
    organization_id: e.org,
    event_tags: [...e.tags, `opp_type:${e.type}`],
    event_location: e.loc,
    event_date: e.date,
    event_duration: e.hrs,
    event_description: e.desc,
    qr_code: `QR-EVT-${String(i + 5).padStart(3, "0")}`,
  }));
  await upsert("events", eventRows, "event_id");

  console.log("Seeding a few applications for demo breadth...");
  const applications = [
    { event_id: eventRows[0].event_id, user_id: newVolunteers[0].id, application_status: "pending" },
    { event_id: eventRows[2].event_id, user_id: newVolunteers[1].id, application_status: "accepted" },
    { event_id: eventRows[7].event_id, user_id: newVolunteers[2].id, application_status: "pending" },
    { event_id: eventRows[13].event_id, user_id: newVolunteers[3].id, application_status: "accepted" },
  ];
  await upsert(
    "participants",
    applications.map((a) => ({ ...a, certification: false })),
    "event_id,user_id"
  );

  console.log("Seeding notifications for the newly-accepted applications...");
  const accepted = applications.filter((a) => a.application_status === "accepted");
  for (const a of accepted) {
    const event = eventRows.find((e) => e.event_id === a.event_id);
    const { data: existing } = await admin
      .from("notifications")
      .select("notification_id")
      .eq("user_id", a.user_id)
      .eq("type", "accepted")
      .ilike("message", `%${event.event_name}%`)
      .maybeSingle();
    if (!existing) {
      await admin.from("notifications").insert({
        user_id: a.user_id,
        type: "accepted",
        message: `Your application to ${event.event_name} was accepted!`,
        is_read: false,
      });
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
