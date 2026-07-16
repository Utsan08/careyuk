import type { Metadata } from "next";

import { OrgDashboard } from "@/components/org/org-dashboard";

export const metadata: Metadata = {
  title: "Org dashboard · CareYuk",
  description: "Post opportunities, review matched volunteers, and verify check-ins on-site.",
};

export default function OrgDashboardPage() {
  return <OrgDashboard />;
}
