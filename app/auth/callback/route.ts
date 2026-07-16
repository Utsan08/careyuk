import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/profile";

/**
 * OAuth landing point. Google redirects here with a `code`; we swap it for a
 * session cookie, then decide where the user goes:
 *   - no app profile yet  -> /signup?step=profile  (Google users have no
 *     user_auth/student row, so they must finish onboarding)
 *   - profile exists      -> their role's home
 *
 * Requires the Google provider to be enabled in Supabase and this URL added to
 * the allowed redirect list.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Missing auth code")}`);
  }

  const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "Could not complete sign in")}`
    );
  }

  const admin = createAdminClient();
  const profile = await getProfileById(admin, data.user.id);

  if (!profile) {
    return NextResponse.redirect(`${origin}/signup?step=profile`);
  }

  return NextResponse.redirect(`${origin}${profile.role === "org" ? "/org" : "/volunteer/explore"}`);
}
