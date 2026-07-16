import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapApplicationRow, type ParticipantRow } from "@/lib/applications";

const APPLICATION_SELECT =
  "application_id, event_id, user_id, application_status, applied_at, student(display_name, faculty), events(event_name, event_date, event_location, zone_id)";

export async function GET(request: NextRequest) {
  const oppId = request.nextUrl.searchParams.get("oppId");
  const volunteerId = request.nextUrl.searchParams.get("volunteerId");

  if (!oppId && !volunteerId) {
    return NextResponse.json(
      { error: "oppId or volunteerId query param is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let query = admin.from("participants").select(APPLICATION_SELECT);
  query = oppId ? query.eq("event_id", oppId) : query.eq("user_id", volunteerId!);
  query = query.order("applied_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ParticipantRow[];
  return NextResponse.json(rows.map(mapApplicationRow));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { opportunityId, volunteerId } = body as {
    opportunityId?: string;
    volunteerId?: string;
  };

  if (!opportunityId || !volunteerId) {
    return NextResponse.json(
      { error: "opportunityId and volunteerId are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("participants")
    .insert({
      event_id: opportunityId,
      user_id: volunteerId,
      application_status: "pending",
      certification: false,
    })
    .select("application_id, application_status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already applied to this opportunity" },
        { status: 409 }
      );
    }
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Invalid opportunityId or volunteerId" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.application_id, status: data.application_status },
    { status: 201 }
  );
}
