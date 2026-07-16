import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BadgeCriteria = { tag?: string; min_events?: number };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { opportunityId, volunteerId } = (body ?? {}) as {
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

  const { data: participant, error: participantError } = await admin
    .from("participants")
    .select("event_id, user_id, application_status, events(event_duration)")
    .eq("event_id", opportunityId)
    .eq("user_id", volunteerId)
    .maybeSingle();

  if (participantError) {
    return NextResponse.json({ error: participantError.message }, { status: 500 });
  }
  if (!participant) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (participant.application_status !== "accepted") {
    return NextResponse.json(
      { error: "Application must be accepted before check-in" },
      { status: 400 }
    );
  }

  const eventDuration =
    (participant.events as unknown as { event_duration: number | null } | null)
      ?.event_duration ?? 0;
  const now = new Date();
  const checkOut = new Date(now.getTime() + eventDuration * 60 * 60 * 1000);

  const { error: updateError } = await admin
    .from("participants")
    .update({
      certification: true,
      application_status: "verified",
      check_in_time: now.toISOString(),
      check_out_time: checkOut.toISOString(),
      student_event_duration: eventDuration,
    })
    .eq("event_id", opportunityId)
    .eq("user_id", volunteerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: completedSessions, error: sessionsError } = await admin
    .from("participants")
    .select("student_event_duration, events(event_tags)")
    .eq("user_id", volunteerId)
    .eq("certification", true);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const sessions = (completedSessions ?? []) as unknown as {
    student_event_duration: number | null;
    events: { event_tags: string[] | null } | null;
  }[];

  const totalHours = sessions.reduce((sum, s) => sum + (s.student_event_duration ?? 0), 0);
  const sessionCount = sessions.length;

  const { data: existingBadges, error: badgesError } = await admin
    .from("badges")
    .select("badge_id, badge_name, criteria");
  if (badgesError) {
    return NextResponse.json({ error: badgesError.message }, { status: 500 });
  }

  const { data: alreadyEarned, error: earnedError } = await admin
    .from("student_badges")
    .select("badge_id")
    .eq("user_id", volunteerId);
  if (earnedError) {
    return NextResponse.json({ error: earnedError.message }, { status: 500 });
  }
  const earnedIds = new Set((alreadyEarned ?? []).map((b) => b.badge_id));

  const newBadges: { id: string; name: string; icon: string | null }[] = [];

  for (const badge of existingBadges ?? []) {
    if (earnedIds.has(badge.badge_id)) continue;

    const criteria = (badge.criteria ?? {}) as BadgeCriteria;
    if (!criteria.tag || !criteria.min_events) continue;

    const matchingSessions = sessions.filter((s) =>
      s.events?.event_tags?.includes(criteria.tag!)
    ).length;

    if (matchingSessions >= criteria.min_events) {
      const { error: insertError } = await admin.from("student_badges").insert({
        user_id: volunteerId,
        badge_id: badge.badge_id,
        date_earned: now.toISOString(),
      });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      // badges.icon isn't in the schema yet — null until that migration lands.
      newBadges.push({ id: badge.badge_id, name: badge.badge_name, icon: null });
    }
  }

  return NextResponse.json({
    hours_credited: eventDuration,
    total_hours: totalHours,
    session_count: sessionCount,
    new_badges: newBadges,
  });
}
