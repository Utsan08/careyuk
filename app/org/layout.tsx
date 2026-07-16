/**
 * The design handoff specifies Geist for the org dashboard, read through
 * `--font-display`. The root layout points that variable at Bricolage for the
 * rest of the app, so we override it here rather than in the root — /org gets
 * Geist without restyling the volunteer and login pages.
 *
 * Geist is already loaded by the root layout as --font-geist-sans, so there's
 * no second font request.
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-1 flex-col"
      style={
        {
          "--font-display": "var(--font-geist-sans)",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
