import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const status = (body as { status?: string } | null)?.status;

  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json(
      { error: "status must be 'accepted' or 'rejected'" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("participants")
    .update({ application_status: status })
    .eq("application_id", id)
    .select("application_id, user_id, application_status, events(event_name)")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (status === "accepted") {
    const eventName =
      (data.events as unknown as { event_name: string } | null)?.event_name ?? "the opportunity";
    const { error: notifError } = await admin.from("notifications").insert({
      user_id: data.user_id,
      type: "accepted",
      message: `Your application to ${eventName} was accepted!`,
      is_read: false,
    });
    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: data.application_id, status: data.application_status });
}
