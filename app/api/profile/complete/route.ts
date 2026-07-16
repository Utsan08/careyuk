import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/profile";
import { roleToDb, type ContractRole } from "@/lib/role";

/**
 * Creates the app profile for an already-authenticated user.
 *
 * /api/auth/signup can't serve OAuth users: it calls auth.signUp() and needs a
 * password, which a Google user doesn't have. Without this, a Google sign-in
 * produces an auth.users row with no user_auth/student row, and every profile
 * lookup 404s.
 *
 * Auth comes from the session cookie — the user id is never taken from the body.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { full_name, role, faculty, interests, bio, zone_id } = body as {
    full_name?: string;
    role?: ContractRole;
    faculty?: string;
    interests?: string[];
    bio?: string;
    zone_id?: string;
  };

  if (role !== "volunteer" && role !== "org") {
    return NextResponse.json({ error: "role must be 'volunteer' or 'org'" }, { status: 400 });
  }

  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Already onboarded — return the existing profile rather than duplicating rows.
  const existing = await getProfileById(admin, user.id);
  if (existing) return NextResponse.json(existing);

  const email = user.email ?? "";
  const name = full_name?.trim() || (user.user_metadata?.full_name as string) || email.split("@")[0] || "New user";

  const { error: profileError } = await admin.from("user_auth").insert({
    user_id: user.id,
    display_name: name,
    role: roleToDb(role),
    email,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const roleInsert =
    role === "volunteer"
      ? admin.from("student").insert({
          user_id: user.id,
          display_name: name,
          email,
          faculty: faculty ?? null,
          interest: interests ?? null,
          bio: bio ?? null,
          zone_id: zone_id ?? null,
        })
      : admin.from("organization").insert({
          user_id: user.id,
          display_name: name,
          email,
          bio: bio ?? null,
        });

  const { error: roleError } = await roleInsert;

  if (roleError) {
    await admin.from("user_auth").delete().eq("user_id", user.id);
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  const profile = await getProfileById(admin, user.id);
  return NextResponse.json(profile, { status: 201 });
}

/** Lets the client ask "does this signed-in user still need onboarding?" */
export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const profile = await getProfileById(admin, user.id);
  return NextResponse.json({ needsOnboarding: !profile, email: user.email, profile });
}
