/**
 * The org dashboard reads --font-display (Geist), which the root layout now
 * sets for the whole app — no font override needed here.
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
