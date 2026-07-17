import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleToDb, type ContractRole } from "@/lib/role";
import { insertRoleRow } from "@/lib/insert-role-row";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, full_name, role, faculty, interests, bio, zone_id, education_level } = body as {
    email?: string;
    password?: string;
    full_name?: string;
    role?: ContractRole;
    faculty?: string;
    interests?: string[];
    bio?: string;
    /** Home zone. The matcher falls back to a flat 0.5 proximity score without it. */
    zone_id?: string;
    education_level?: string;
  };

  if (!email || !password || !full_name || (role !== "volunteer" && role !== "org")) {
    return NextResponse.json(
      { error: "email, password, full_name, and role ('volunteer' | 'org') are required" },
      { status: 400 }
    );
  }

  const supabase = await createRouteClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user) {
    const status = signUpError?.status && signUpError.status >= 400 ? signUpError.status : 400;
    return NextResponse.json(
      { error: signUpError?.message ?? "Signup failed" },
      { status }
    );
  }

  const userId = signUpData.user.id;
  const admin = createAdminClient();

  const { error: profileError } = await admin.from("user_auth").insert({
    user_id: userId,
    display_name: full_name,
    role: roleToDb(role),
    email,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: roleError } = await insertRoleRow(admin, {
    userId,
    role,
    full_name,
    email,
    faculty,
    interests,
    bio,
    zone_id,
    education_level,
  });

  if (roleError) {
    await admin.from("user_auth").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: userId, email, role, full_name },
    { status: 201 }
  );
}
