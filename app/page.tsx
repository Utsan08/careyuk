import { redirect } from "next/navigation";

// The app lands on the About page — a cinematic intro (spinning logo) leads into
// the story; Sign in is one tap away from there.
export default function Home() {
  redirect("/about");
}
