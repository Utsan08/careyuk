import { Toaster } from "@/components/ui/sonner";

/**
 * The org dashboard reads --font-display (Geist), which the root layout now
 * sets for the whole app — no font override needed here.
 *
 * Toaster is mounted here rather than in the root layout so the org dashboard
 * gets toasts without changing shared chrome for the volunteer/login pages.
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
