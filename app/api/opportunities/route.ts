import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteClient } from "@/lib/supabase/route";
import { buildEventTags, type OpportunityType } from "@/lib/opportunityTags";
import { mapOrgOpportunityRow, mapFeedOpportunityRow, type EventWithCounts } from "@/lib/opportunities";

const OPPORTUNITY_SELECT =
  "event_id, event_name, event_date, event_duration, event_tags, event_location, zone_id, organization_id, organization(display_name), zones(zone_name), participants(application_status)";

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId");
  const volunteerId = request.nextUrl.searchParams.get("volunteerId");

  if (!orgId && !volunteerId) {
    return NextResponse.json(
      { error: "orgId or volunteerId query param is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  if (orgId) {
    const { data, error } = await admin
      .from("events")
      .select(OPPORTUNITY_SELECT)
      .eq("organization_id", orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as unknown as EventWithCounts[];
    return NextResponse.json(rows.map(mapOrgOpportunityRow));
  }

  const { data: student, error: studentError } = await admin
    .from("student")
    .select("faculty, interest, zone_id")
    .eq("user_id", volunteerId!)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const { data, error } = await admin.from("events").select(OPPORTUNITY_SELECT);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as EventWithCounts[];
  const volunteer = {
    id: volunteerId!,
    faculty: student.faculty,
    educationLevel: null,
    interests: student.interest,
    zoneId: student.zone_id,
  };

  const feed = rows
    .map((row) => mapFeedOpportunityRow(row, volunteer))
    .filter((row) => {
      const total = row.slots_total;
      const filled = row.slots_filled;
      const isPast = row.starts_at ? new Date(row.starts_at).getTime() < Date.now() : false;
      return !isPast && filled < total;
    })
    .sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json(feed);
}

export async function POST(request: NextRequest) {
  const routeClient = await createRouteClient();
  const { data: authData, error: authError } = await routeClient.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("user_auth")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile || profile.role !== "organization") {
    return NextResponse.json({ error: "Only organizations can post opportunities" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    title,
    description,
    type,
    faculties_wanted,
    levels_wanted,
    slots_total,
    starts_at,
    duration_hours,
    venue_name,
    zone_id,
  } = body as {
    title?: string;
    description?: string;
    type?: OpportunityType;
    faculties_wanted?: string[];
    levels_wanted?: string[];
    slots_total?: number;
    starts_at?: string;
    duration_hours?: number;
    venue_name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    zone_id?: string;
  };

  if (!title || !type || !slots_total || !starts_at || !duration_hours) {
    return NextResponse.json(
      { error: "title, type, slots_total, starts_at, and duration_hours are required" },
      { status: 400 }
    );
  }

  const eventTags = buildEventTags({
    type,
    slotsTotal: slots_total,
    facultiesWanted: faculties_wanted ?? [],
    levelsWanted: levels_wanted ?? [],
    interestTags: [],
  });

  const { data, error } = await admin
    .from("events")
    .insert({
      event_name: title,
      organization_id: authData.user.id,
      event_tags: eventTags,
      event_location: venue_name ?? null,
      event_date: starts_at,
      event_duration: duration_hours,
      event_description: description ?? null,
      zone_id: zone_id ?? null,
      qr_code: `QR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    })
    .select("event_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: data.event_id,
      title,
      description: description ?? null,
      type,
      faculties_wanted: faculties_wanted ?? [],
      levels_wanted: levels_wanted ?? [],
      slots_total,
      starts_at,
      duration_hours,
      venue_name: venue_name ?? null,
      // address/lat/lng aren't persisted (no schema changes per project decision).
      address: null,
      lat: null,
      lng: null,
      zone_id: zone_id ?? null,
      slots_filled: 0,
      status: "open",
    },
    { status: 201 }
  );
}
