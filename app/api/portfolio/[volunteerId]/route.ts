import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/portfolio/[volunteerId]">
) {
  const { volunteerId } = await ctx.params;
  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("student")
    .select("display_name, faculty")
    .eq("user_id", volunteerId)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  const { data: sessions, error: sessionsError } = await admin
    .from("participants")
    .select("student_event_duration, events(event_name, event_date, organization(display_name))")
    .eq("user_id", volunteerId)
    .eq("certification", true);

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const rows = (sessions ?? []) as unknown as {
    student_event_duration: number | null;
    events: {
      event_name: string;
      event_date: string | null;
      organization: { display_name: string } | null;
    } | null;
  }[];

  const activities = rows.map((row) => ({
    title: row.events?.event_name ?? null,
    org_name: row.events?.organization?.display_name ?? null,
    date: row.events?.event_date ?? null,
    hours: row.student_event_duration ?? 0,
  }));

  const totalHours = rows.reduce((sum, r) => sum + (r.student_event_duration ?? 0), 0);

  const { data: badgeRows, error: badgesError } = await admin
    .from("student_badges")
    .select("badge_id, date_earned, badges(badge_name)")
    .eq("user_id", volunteerId);

  if (badgesError) {
    return NextResponse.json({ error: badgesError.message }, { status: 500 });
  }

  const badges = ((badgeRows ?? []) as unknown as {
    badge_id: string;
    date_earned: string;
    badges: { badge_name: string } | null;
  }[]).map((row) => ({
    id: row.badge_id,
    name: row.badges?.badge_name ?? null,
    // badges.icon isn't in the schema yet — null until that migration lands.
    icon: null,
    earned_at: row.date_earned,
  }));

  return NextResponse.json({
    full_name: student.display_name,
    // student.education_level isn't in the schema yet — null until that migration lands.
    education_level: null,
    faculty: student.faculty,
    total_hours: totalHours,
    session_count: rows.length,
    activities,
    badges,
  });
}
