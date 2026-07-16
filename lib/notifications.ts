// CONTRACT.md notification.type = "accepted" | "reminder" | "checkin_confirmed" | "update".
// Older seed rows were written with ad-hoc values before this contract existed
// (e.g. "application_accepted", "badge_progress") — normalize those on read.
const LEGACY_TYPE_MAP: Record<string, string> = {
  application_accepted: "accepted",
  application_pending: "update",
  badge_progress: "update",
};

const TITLE_BY_TYPE: Record<string, string> = {
  accepted: "Application Accepted",
  reminder: "Reminder",
  checkin_confirmed: "Check-in Confirmed",
  update: "Update",
};

export function normalizeNotificationType(type: string | null): string {
  if (!type) return "update";
  return LEGACY_TYPE_MAP[type] ?? type;
}

export function titleForType(type: string): string {
  return TITLE_BY_TYPE[type] ?? "Notification";
}
