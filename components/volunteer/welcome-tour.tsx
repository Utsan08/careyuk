"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Award, Check, MapPin, QrCode, Sparkles, X } from "lucide-react";

import styles from "./welcome-tour.module.css";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";

/**
 * First-run walkthrough of the volunteer features. Shown when /volunteer/explore
 * is opened with ?tour=1 (the signup flow sends new users here) and not shown
 * again once dismissed.
 *
 * Deliberately a narrated overlay rather than element-anchored coach marks: the
 * explore page's map and cards move around at different viewport sizes, and a
 * mis-anchored bubble on stage is worse than none.
 */
const STORAGE_KEY = "careyuk.tour.seen.v1";

type Step = {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    eyebrow: "Matched for you",
    title: "These aren't random listings",
    body: "Every opportunity is scored against the interests you just picked. The ones matching what you care about are ranked first and carry a match percentage — so the top of your feed is always the best fit.",
  },
  {
    icon: MapPin,
    eyebrow: "Priority zones",
    title: "Where you're needed most",
    body: "Red rings mark priority zones — communities with the lowest health scores nearby. Opportunities in your own zone surface first, so you can help close to home.",
  },
  {
    icon: Check,
    eyebrow: "Applying",
    title: "One tap to apply",
    body: "Hit Apply and the organisation sees you in their applicants list straight away, with your match score and faculty. They accept or decline, and you're notified either way.",
  },
  {
    icon: QrCode,
    eyebrow: "On the day",
    title: "Verified by QR check-in",
    body: "The organisation scans you in on-site. That stamp is what makes your hours verified rather than self-reported — nobody can claim hours they didn't work.",
  },
  {
    icon: Award,
    eyebrow: "Your portfolio",
    title: "Hours become evidence",
    body: "Every verified session lands on your care portfolio with badges and XP — a real record you can show a faculty, a scholarship panel, or an employer.",
  },
];

/** Reads "have they seen it" without an effect, so the server render and the first
 *  client render agree (server assumes seen → renders nothing → no flash). */
function useTourSeen() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return window.localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => true
  );
}

export function WelcomeTour() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const seen = useTourSeen();

  const open = params.get("tour") === "1" && !seen && !dismissed;

  const close = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // private mode — the tour just shows again next time
    }
    router.replace("/volunteer/explore");
  };

  if (!open) return null;

  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${styles.backdrop}`}>
      <div className={`relative w-full max-w-[460px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_90px_-30px_rgba(28,61,39,.6)] ${styles.card}`}>
        <button
          type="button"
          onClick={close}
          aria-label="Skip the tour"
          className="absolute top-4 right-4 z-[2] cursor-pointer rounded-full p-1.5 text-[#9aa39c] transition-colors hover:bg-[#EEF3EC] hover:text-[#23472D]"
        >
          <X className="size-4" strokeWidth={2.4} />
        </button>

        <div className="relative overflow-hidden px-7 pt-8 pb-7 text-[#EAF7E3]" style={{ background: "linear-gradient(180deg,#2c5e3c 0%,#245030 100%)" }}>
          <div className={`pointer-events-none absolute -top-14 -right-12 h-[200px] w-[200px] rounded-full opacity-25 blur-[20px] ${styles.blob}`} style={{ background: "radial-gradient(circle,#8FD14F,transparent 70%)" }} />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] text-[#0f3d1e]" style={{ background: "linear-gradient(145deg,#8FD14F,#3DA35D)" }}>
            <Icon className="size-7" strokeWidth={2} />
          </div>
          <div className="relative mt-5 text-[10.5px] font-semibold tracking-[.09em] text-[#8FD14F] uppercase">{s.eyebrow}</div>
          <h2 className="relative mt-1.5 text-[22px] leading-[1.2] font-semibold tracking-[-.02em] text-white" style={{ fontFamily: disp }}>
            {s.title}
          </h2>
        </div>

        <div key={step} className={`px-7 pt-6 pb-7 ${styles.fadeIn}`}>
          <p className="text-[13.5px] leading-[1.65] text-[#516155]">{s.body}</p>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === step ? 22 : 6, background: i <= step ? "#8FD14F" : "#E2E8DE" }}
                />
              ))}
            </div>
            {!last && (
              <button type="button" onClick={close} className="cursor-pointer text-[12.5px] font-semibold text-[#9aa39c] transition-colors hover:text-[#516155]">
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setStep((n) => n + 1))}
              className="flex cursor-pointer items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-[13px] font-semibold text-[#0f2a17] transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 10px 22px -10px rgba(143,209,79,.8)" }}
            >
              {last ? "Start exploring" : "Next"}
              <ArrowRight className="size-3.5" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
