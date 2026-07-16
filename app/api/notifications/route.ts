import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNotificationType, titleForType } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const volunteerId = request.nextUrl.searchParams.get("volunteerId");

  if (!volunteerId) {
    return NextResponse.json({ error: "volunteerId query param is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("notification_id, type, message, is_read, created_at")
    .eq("user_id", volunteerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []).map((row) => {
    const type = normalizeNotificationType(row.type);
    return {
      id: row.notification_id,
      type,
      title: titleForType(type),
      body: row.message,
      // notifications has no event_id FK yet — see migration note for schema owner.
      opportunity_title: null,
      read: row.is_read,
      created_at: row.created_at,
    };
  });

  return NextResponse.json(notifications);
}
