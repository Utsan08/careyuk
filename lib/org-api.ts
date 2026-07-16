"use client";

/**
 * Client-side seam between the org dashboard and the backend.
 *
 * Every call returns `null` instead of throwing when the API isn't usable, so
 * the dashboard falls back to the placeholder data in components/org/data.ts.
 * That keeps the demo working before the backend is fully wired, and switches to
 * live data automatically once it is.
 *
 * Status today (verified 2026-07-17):
 * - /api/auth/* works (route client, anon key).
 * - Everything else needs SUPABASE_SERVICE_ROLE_KEY in .env.local — those routes
 *   use createAdminClient() and throw a bare 500 until it exists.
 */

export type OrgProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "org" | "volunteer";
  bio?: string | null;
};

export type ApiApplication = {
  applicationId: string;
  volunteerId: string;
  full_name: string | null;
  education_level: string | null;
  faculty: string | null;
  opportunity_title: string | null;
  starts_at: string | null;
  venue_name: string | null;
  distance_km: number;
  match_score: number;
  match_reason: string;
  status: "pending" | "rejected" | "accepted" | "verified" | "withdrawn";
};

export type OrgDashboardData = {
  needs_attention: { id: string; title: string; starts_at: string; slots_filled: number; slots_total: number; applicant_count: number }[];
  upcoming: { id: string; title: string; starts_at: string; slots_filled: number; slots_total: number; status: string }[];
  slots_to_fill: number;
  impact: { total_volunteers: number; total_hours: number; total_sessions: number };
  recent_activity: { volunteer_name: string; opportunity_title: string; check_in_time: string }[];
};

async function safeJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Current session, or null when signed out / auth unavailable. */
export function getSession() {
  return safeJson<OrgProfile>("/api/auth/session");
}

export function logout() {
  return safeJson<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

/** Applicants for an opportunity. Null until SUPABASE_SERVICE_ROLE_KEY is set. */
export function getApplications(oppId: string) {
  return safeJson<ApiApplication[]>(`/api/applications?oppId=${encodeURIComponent(oppId)}`);
}

export function getOrgDashboard(orgId: string) {
  return safeJson<OrgDashboardData>(`/api/org/dashboard?orgId=${encodeURIComponent(orgId)}`);
}

/** Accept/reject an application. Returns null if the call didn't land. */
export function decideApplication(applicationId: string, status: "accepted" | "rejected") {
  return safeJson<{ id: string; status: string }>(`/api/applications/${encodeURIComponent(applicationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type NewOpportunity = {
  title: string;
  /** The API only accepts these three; custom UI types fall back to "event". */
  type: "event" | "clinic_help" | "shadowing";
  slots_total: number;
  starts_at: string;
  duration_hours: number;
  description?: string;
  faculties_wanted?: string[];
  venue_name?: string;
};

/** Requires an org session — the only role-gated route (401/403 otherwise). */
export function createOpportunity(body: NewOpportunity) {
  return safeJson<{ id: string; title: string }>("/api/opportunities", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function checkInVolunteer(opportunityId: string, volunteerId: string) {
  return safeJson<{ hours_credited: number; total_hours: number; session_count: number }>("/api/checkin", {
    method: "POST",
    body: JSON.stringify({ opportunityId, volunteerId }),
  });
}

/** UI post-type → the enum the API accepts. Custom org-authored types have no API equivalent. */
export function toApiType(uiType: string): NewOpportunity["type"] {
  if (uiType === "clinic") return "clinic_help";
  if (uiType === "shadow") return "shadowing";
  return "event";
}
