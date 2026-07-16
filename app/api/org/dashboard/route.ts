import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEventTags, computeStatus } from "@/lib/opportunityTags";

type ParticipantRow = {
  user_id: string;
  application_status: string;
  certification: boolean;
  check_in_time: string | null;
  student_event_duration: number | null;
  student: { display_name: string } | null;
};

type EventRow = {
  event_id: string;
  event_name: string;
  event_date: string | null;
  event_tags: string[] | null;
  participants: ParticipantRow[];
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId query param is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(
      "event_id, event_name, event_date, event_tags, participants(user_id, application_status, certification, check_in_time, student_event_duration, student(display_name))"
    )
    .eq("organization_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []) as unknown as EventRow[];

  const enriched = events.map((event) => {
    const { slotsTotal } = parseEventTags(event.event_tags);
    const slotsFilled = event.participants.filter((p) => p.application_status === "accepted").length;
    const applicantCount = event.participants.length;
    const status = computeStatus(slotsTotal, slotsFilled, event.event_date);
    return { event, slotsTotal, slotsFilled, applicantCount, status };
  });

  const now = Date.now();

  const needs_attention = enriched
    .filter((e) => {
      if (e.status !== "open" || !e.event.event_date) return false;
      const startsIn = new Date(e.event.event_date).getTime() - now;
      return startsIn >= 0 && startsIn <= SEVEN_DAYS_MS;
    })
    .map((e) => ({
      id: e.event.event_id,
      title: e.event.event_name,
      starts_at: e.event.event_date,
      slots_filled: e.slotsFilled,
      slots_total: e.slotsTotal,
      applicant_count: e.applicantCount,
    }));

  const upcoming = enriched
    .filter((e) => e.status !== "completed")
    .sort((a, b) => {
      const aTime = a.event.event_date ? new Date(a.event.event_date).getTime() : 0;
      const bTime = b.event.event_date ? new Date(b.event.event_date).getTime() : 0;
      return aTime - bTime;
    })
    .map((e) => ({
      id: e.event.event_id,
      title: e.event.event_name,
      starts_at: e.event.event_date,
      slots_filled: e.slotsFilled,
      slots_total: e.slotsTotal,
      status: e.status,
    }));

  const slots_to_fill = enriched
    .filter((e) => e.status === "open")
    .reduce((sum, e) => sum + Math.max(e.slotsTotal - e.slotsFilled, 0), 0);

  const certifiedRows = enriched.flatMap((e) =>
    e.event.participants.filter((p) => p.certification)
  );
  const impact = {
    total_volunteers: new Set(certifiedRows.map((p) => p.user_id)).size,
    total_hours: certifiedRows.reduce((sum, p) => sum + (p.student_event_duration ?? 0), 0),
    total_sessions: certifiedRows.length,
  };

  const recent_activity = enriched
    .flatMap((e) =>
      e.event.participants
        .filter((p) => p.check_in_time)
        .map((p) => ({
          volunteer_name: p.student?.display_name ?? null,
          opportunity_title: e.event.event_name,
          check_in_time: p.check_in_time,
        }))
    )
    .sort((a, b) => new Date(b.check_in_time!).getTime() - new Date(a.check_in_time!).getTime())
    .slice(0, 10);

  return NextResponse.json({
    needs_attention,
    upcoming,
    slots_to_fill,
    impact,
    recent_activity,
  });
}
