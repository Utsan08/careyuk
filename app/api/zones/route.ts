import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();

  const { data: zones, error: zonesError } = await admin
    .from("zones")
    .select("zone_id, zone_name");
  if (zonesError) {
    return NextResponse.json({ error: zonesError.message }, { status: 500 });
  }

  const { data: events, error: eventsError } = await admin
    .from("events")
    .select("zone_id, participants(certification)");
  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const rows = (events ?? []) as unknown as {
    zone_id: string | null;
    participants: { certification: boolean }[];
  }[];

  const sessionsByZone = new Map<string, number>();
  for (const row of rows) {
    if (!row.zone_id) continue;
    const certified = row.participants.filter((p) => p.certification).length;
    sessionsByZone.set(row.zone_id, (sessionsByZone.get(row.zone_id) ?? 0) + certified);
  }

  const result = (zones ?? []).map((zone) => ({
    id: zone.zone_id,
    name: zone.zone_name,
    // community_health_score and status aren't in the schema (no schema
    // changes per project decision) — null until there's a real data source.
    community_health_score: null,
    sessions_run: sessionsByZone.get(zone.zone_id) ?? 0,
    status: null,
  }));

  return NextResponse.json(result);
}
