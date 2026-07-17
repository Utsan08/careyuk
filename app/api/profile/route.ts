import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/profile";

/**
 * The signed-in user's own profile, and updates to it — powers the editable
 * Portfolio profile card. Auth comes from the session cookie; the user id is
 * never taken from the body.
 *
 * education_level and avatar_url are read/written best-effort: the columns are
 * pending a migration (supabase/migrations/0001_add_education_level.sql and
 * a matching avatar_url column), so everything degrades gracefully until then.
 */

async function readExtras(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const res = await admin.from("student").select("education_level, avatar_url").eq("user_id", userId).maybeSingle();
  if (res.error || !res.data) return { education_level: null as string | null, avatar_url: null as string | null };
  const d = res.data as { education_level: string | null; avatar_url: string | null };
  return { education_level: d.education_level ?? null, avatar_url: d.avatar_url ?? null };
}

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const profile = await getProfileById(admin, user.id);
  if (!profile) return NextResponse.json({ error: "No profile yet" }, { status: 404 });

  const extras = profile.role === "volunteer" ? await readExtras(admin, user.id) : { education_level: null, avatar_url: null };
  return NextResponse.json({ ...profile, ...extras });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { faculty, interests, education_level, avatar_url, bio } = body as {
    faculty?: string | null;
    interests?: string[];
    education_level?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };

  const admin = createAdminClient();

  // Split into always-present columns vs. pending-migration columns so a
  // missing education_level/avatar_url can't fail the whole update.
  const core: Record<string, unknown> = {};
  if (faculty !== undefined) core.faculty = faculty;
  if (interests !== undefined) core.interest = interests;
  if (bio !== undefined) core.bio = bio;

  const optional: Record<string, unknown> = {};
  if (education_level !== undefined) optional.education_level = education_level;
  if (avatar_url !== undefined) optional.avatar_url = avatar_url;

  if (Object.keys(core).length || Object.keys(optional).length) {
    let res = await admin.from("student").update({ ...core, ...optional }).eq("user_id", user.id);
    if (res.error && /(education_level|avatar_url)/i.test(res.error.message)) {
      res = await admin.from("student").update(core).eq("user_id", user.id);
    }
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  const profile = await getProfileById(admin, user.id);
  const extras = await readExtras(admin, user.id);
  return NextResponse.json({ ...profile, ...extras });
}
