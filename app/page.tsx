import { redirect } from "next/navigation";

// The app opens on the login screen; role selection there routes to the
// volunteer or org dashboard.
export default function Home() {
  redirect("/login");
}
