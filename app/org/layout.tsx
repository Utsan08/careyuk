import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Fonts are scoped to /org rather than added to the root layout, so the org
 * dashboard stays self-contained and doesn't collide with the other areas.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${bricolage.variable} ${jakarta.variable} flex flex-1 flex-col`}>{children}</div>;
}
