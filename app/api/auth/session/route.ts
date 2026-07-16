import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/profile";

export async function GET() {
  const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const profile = await getProfileById(admin, data.user.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found for this account" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
