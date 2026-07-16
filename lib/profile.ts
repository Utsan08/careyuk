import type { SupabaseClient } from "@supabase/supabase-js";
import { roleFromDb } from "./role";

/**
 * Fetches the combined profile (user_auth + student/organization row) for a
 * given auth user id and shapes it to CONTRACT.md's vocabulary.
 * Pass an admin (service-role) client — this reads across users/roles.
 */
export async function getProfileById(admin: SupabaseClient, id: string) {
  const { data: base, error: baseError } = await admin
    .from("user_auth")
    .select("user_id, display_name, role, email")
    .eq("user_id", id)
    .maybeSingle();

  if (baseError) throw baseError;
  if (!base) return null;

  const role = roleFromDb(base.role as "student" | "organization");

  if (role === "volunteer") {
    const { data: student, error } = await admin
      .from("student")
      .select("faculty, interest, bio, zone_id")
      .eq("user_id", id)
      .maybeSingle();
    if (error) throw error;

    return {
      id: base.user_id as string,
      email: base.email as string,
      full_name: base.display_name as string,
      role,
      faculty: student?.faculty ?? null,
      interests: student?.interest ?? [],
      bio: student?.bio ?? null,
      zone_id: student?.zone_id ?? null,
    };
  }

  const { data: org, error } = await admin
    .from("organization")
    .select("bio")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;

  return {
    id: base.user_id as string,
    email: base.email as string,
    full_name: base.display_name as string,
    role,
    bio: org?.bio ?? null,
  };
}
