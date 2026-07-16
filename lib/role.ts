// CONTRACT.md uses "volunteer" | "org". The live schema's public.user_role
// enum uses "student" | "organization". Translate at the API boundary only —
// nothing outside app/api/* should ever see the DB spelling.

export type ContractRole = "volunteer" | "org";
export type DbRole = "student" | "organization";

export function roleToDb(role: ContractRole): DbRole {
  return role === "volunteer" ? "student" : "organization";
}

export function roleFromDb(role: DbRole): ContractRole {
  return role === "student" ? "volunteer" : "org";
}
