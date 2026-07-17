import type { SupabaseClient } from "@supabase/supabase-js";
import { type ContractRole } from "./role";

export type RoleRowInput = {
  userId: string;
  role: ContractRole;
  full_name: string;
  email: string;
  faculty?: string;
  interests?: string[];
  bio?: string;
  zone_id?: string;
  education_level?: string;
};

/**
 * Writes the student/organization row for a new account.
 *
 * `organization.zone_id` is pending a migration:
 *   ALTER TABLE organization ADD COLUMN zone_id uuid REFERENCES zones(zone_id);
 * Until that runs, PostgREST rejects the column outright, which would fail
 * signup for every org. So we try with the region and retry without it if the
 * column isn't there yet — the account is created either way, and starts saving
 * the region the moment the migration lands.
 */
export async function insertRoleRow(
  admin: SupabaseClient,
  { userId, role, full_name, email, faculty, interests, bio, zone_id, education_level }: RoleRowInput
): Promise<{ error: { message: string } | null }> {
  if (role === "volunteer") {
    const base = {
      user_id: userId,
      display_name: full_name,
      email,
      faculty: faculty ?? null,
      interest: interests ?? null,
      bio: bio ?? null,
      zone_id: zone_id ?? null,
    };

    // student.education_level is pending a migration (see
    // supabase/migrations/0001_add_education_level.sql). Try with it and retry
    // without if the column isn't there yet, so signup never breaks.
    const withLevel = await admin.from("student").insert({ ...base, education_level: education_level ?? null });
    if (!withLevel.error) return withLevel;
    if (/education_level/i.test(withLevel.error.message)) {
      return admin.from("student").insert(base);
    }
    return withLevel;
  }

  const base = { user_id: userId, display_name: full_name, email, bio: bio ?? null };

  const withZone = await admin.from("organization").insert({ ...base, zone_id: zone_id ?? null });
  if (!withZone.error) return withZone;

  // PGRST204 / 42703 both surface as a message naming the column.
  if (/zone_id/i.test(withZone.error.message)) {
    return admin.from("organization").insert(base);
  }

  return withZone;
}
