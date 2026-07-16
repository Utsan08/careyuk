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
  { userId, role, full_name, email, faculty, interests, bio, zone_id }: RoleRowInput
): Promise<{ error: { message: string } | null }> {
  if (role === "volunteer") {
    return admin.from("student").insert({
      user_id: userId,
      display_name: full_name,
      email,
      faculty: faculty ?? null,
      interest: interests ?? null,
      bio: bio ?? null,
      zone_id: zone_id ?? null,
    });
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
