"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Sparkles } from "lucide-react";

import { createClient, isProviderEnabled } from "@/lib/supabase/client";
import { FACULTY_LABELS, FACULTY_OPTIONS, INTEREST_OPTIONS } from "@/lib/profile-options";
import styles from "./signup.module.css";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";
type Role = "volunteer" | "org";
type Zone = { id: string; name: string };

/** Account details -> faculty -> interests -> home zone. Orgs skip the volunteer-only steps. */
const VOLUNTEER_STEPS = ["Account", "Study", "Interests", "Zone"];
const ORG_STEPS = ["Account"];

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupFlow />
    </Suspense>
  );
}

function SignupFlow() {
  const router = useRouter();
  const params = useSearchParams();

  // `?step=profile` means a Google user landed here from /auth/callback: they're
  // already authenticated but have no profile row yet, so skip the account step.
  const oauthMode = params.get("step") === "profile";

  const [step, setStep] = useState(oauthMode ? 1 : 0);
  const [role, setRole] = useState<Role>("volunteer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState<string>("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = role === "org" ? ORG_STEPS : VOLUNTEER_STEPS;

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => (r.ok ? r.json() : []))
      .then((z) => Array.isArray(z) && setZones(z.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }))))
      .catch(() => {});
  }, []);

  // Prefill the name Google gave us.
  useEffect(() => {
    if (!oauthMode) return;
    fetch("/api/profile/complete")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email) setEmail(d.email);
        if (d && !d.needsOnboarding && d.profile) {
          router.replace(d.profile.role === "org" ? "/org" : "/volunteer/explore");
        }
      })
      .catch(() => {});
  }, [oauthMode, router]);

  const toggleInterest = (value: string) =>
    setInterests((list) => (list.includes(value) ? list.filter((i) => i !== value) : [...list, value]));

  const canAdvance = () => {
    if (step === 0) return fullName.trim() && email.trim() && password.length >= 6;
    if (step === 1) return !!faculty;
    if (step === 2) return interests.length > 0;
    if (step === 3) return !!zoneId;
    return false;
  };

  const finish = async () => {
    setBusy(true);
    setError(null);

    const body = {
      full_name: fullName.trim(),
      role,
      faculty: faculty || undefined,
      interests,
      zone_id: zoneId || undefined,
    };

    // OAuth users already have a session — they only need the profile rows.
    const res = oauthMode
      ? await fetch("/api/profile/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, email: email.trim(), password }),
        });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create your account.");
      setBusy(false);
      return;
    }

    // Email/password signup doesn't set a session cookie — log in so the tour has one.
    if (!oauthMode) {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      }).catch(() => {});
    }

    router.push(role === "org" ? "/org" : "/volunteer/explore?tour=1");
  };

  const google = async () => {
    setError(null);
    setBusy(true);

    // Check first — signInWithOAuth would redirect to a raw JSON error page.
    if (!(await isProviderEnabled("google"))) {
      setBusy(false);
      setError("Google sign-in isn't switched on for this project yet. Use your email for now.");
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setBusy(false);
      setError(err.message);
    }
  };

  const next = () => (step === steps.length - 1 ? finish() : setStep((s) => s + 1));

  return (
    <div className="flex min-h-screen w-full text-[#202320]" style={{ background: "#F7FAF5" }}>
      {/* brand panel */}
      <div
        className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden p-10 text-[#EAF7E3] lg:flex"
        style={{ background: "linear-gradient(180deg,#2c5e3c 0%,#245030 60%,#1e4429 100%)" }}
      >
        <div className={`pointer-events-none absolute -top-16 -right-20 h-[320px] w-[320px] rounded-full opacity-25 blur-[24px] ${styles.blob}`} style={{ background: "radial-gradient(circle,#8FD14F,transparent 70%)" }} />
        <div className="relative flex items-center gap-2.5">
          <Image src="/careyuk-logo.png" alt="" width={30} height={30} className="object-contain [filter:brightness(1.4)]" />
          <span className="text-[18px] font-semibold text-[#F8F9F7]" style={{ fontFamily: disp }}>CareYuk</span>
        </div>
        <div className="relative">
          <h2 className="text-[32px] leading-[1.15] font-semibold tracking-[-.03em] text-white" style={{ fontFamily: disp }}>
            Every hour you give
            <br />
            becomes verified experience.
          </h2>
          <p className="mt-4 max-w-sm text-[13.5px] leading-[1.6] text-[#EAF7E3]/60">
            Tell us what you care about and where you are. We&apos;ll match you to the clinics and Posyandu that need
            you most — and stamp every session onto your care portfolio.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {["Matched to what you actually care about", "Verified hours, not self-reported", "A portfolio that grows with you"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-[12.5px] font-medium text-[#EAF7E3]/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8FD14F]/25">
                  <Check className="size-3 text-[#C9F3B0]" strokeWidth={3} />
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-[11.5px] text-[#EAF7E3]/40">12,480 verified hours given across Jakarta &amp; Depok</div>
      </div>

      {/* form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="mb-7">
            <div className="mb-3 flex items-center gap-1.5">
              {steps.map((label, i) => (
                <div key={label} className="flex flex-1 flex-col gap-1.5">
                  <div className="h-1 overflow-hidden rounded-full bg-[#E2E8DE]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: i <= step ? "100%" : "0%", background: "linear-gradient(90deg,#8FD14F,#3DA35D)" }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tracking-[.04em] uppercase" style={{ color: i <= step ? "#3DA35D" : "#9aa39c" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div key={step} className={styles.stepIn}>
            {step === 0 && (
              <>
                <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: disp }}>
                  Create your account
                </h1>
                <p className="mt-1 mb-6 text-[13px] font-medium text-[#8a938b]">Start turning hours into verified care experience.</p>

                <div className="mb-4 flex rounded-[14px] bg-[#EEF3EC] p-1">
                  {(["volunteer", "org"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="flex-1 cursor-pointer rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                      style={{
                        background: role === r ? "#fff" : "transparent",
                        color: role === r ? "#23472D" : "#7c887f",
                        boxShadow: role === r ? "0 2px 8px -3px rgba(28,61,39,.25)" : "none",
                      }}
                    >
                      {r === "volunteer" ? "🩺 Volunteer" : "🏥 Organisation"}
                    </button>
                  ))}
                </div>

                <Field label="Full name">
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rina Wulandari" className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </Field>
                <Field label="Password" hint="At least 6 characters">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                </Field>

                <div className="my-5 flex items-center gap-3 text-[11px] text-[#9aa39c]">
                  <span className="h-px flex-1 bg-[#E2E8DE]" />or continue with<span className="h-px flex-1 bg-[#E2E8DE]" />
                </div>
                <button
                  type="button"
                  onClick={google}
                  className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white py-3 text-[13.5px] font-semibold text-[#3f4a43] transition-all hover:bg-[#F7FAF5] active:scale-[.99]"
                >
                  <GoogleIcon /> Sign up with Google
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: disp }}>
                  What are you studying?
                </h1>
                <p className="mt-1 mb-6 text-[13px] font-medium text-[#8a938b]">
                  Organisations use this when a role needs specific training.
                </p>
                <div className="flex flex-wrap gap-2">
                  {FACULTY_OPTIONS.map((f) => {
                    const on = faculty === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFaculty(f)}
                        className="cursor-pointer rounded-xl border-[1.5px] px-4 py-2.5 text-[13px] font-medium transition-all active:scale-95"
                        style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff", color: on ? "#23472D" : "#516155" }}
                      >
                        {FACULTY_LABELS[f]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: disp }}>
                  What do you care about?
                </h1>
                <p className="mt-1 mb-5 flex items-center gap-1.5 text-[13px] font-medium text-[#8a938b]">
                  <Sparkles className="size-3.5 text-[#8FD14F]" strokeWidth={2.4} />
                  This is what drives your matches — pick at least one.
                </p>
                <div className="flex flex-col gap-2">
                  {INTEREST_OPTIONS.map((o) => {
                    const on = interests.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleInterest(o.value)}
                        className="flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-3 text-left transition-all active:scale-[.99]"
                        style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff" }}
                      >
                        <span className="text-[20px]">{o.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold" style={{ color: on ? "#23472D" : "#3f4a43" }}>{o.label}</span>
                          <span className="block text-[11.5px] text-[#8a938b]">{o.blurb}</span>
                        </span>
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all"
                          style={{ borderColor: on ? "#3DA35D" : "#D5DED1", background: on ? "#3DA35D" : "transparent" }}
                        >
                          {on && <Check className="size-3 text-white" strokeWidth={3.5} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: disp }}>
                  Where are you based?
                </h1>
                <p className="mt-1 mb-5 flex items-center gap-1.5 text-[13px] font-medium text-[#8a938b]">
                  <MapPin className="size-3.5 text-[#8FD14F]" strokeWidth={2.4} />
                  We put opportunities in your zone first.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map((z) => {
                    const on = zoneId === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setZoneId(z.id)}
                        className="cursor-pointer rounded-[14px] border-[1.5px] px-4 py-3 text-left text-[13px] font-semibold transition-all active:scale-[.99]"
                        style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff", color: on ? "#23472D" : "#516155" }}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                  {zones.length === 0 && <div className="col-span-2 text-[12.5px] text-[#8a938b]">Couldn&apos;t load zones.</div>}
                </div>
              </>
            )}
          </div>

          {error && <div className={`mt-4 rounded-xl border border-[#EF5A5A]/30 bg-[#FDECEC] px-3.5 py-2.5 text-[12.5px] font-medium text-[#D2453F] ${styles.stepIn}`}>{error}</div>}

          <div className="mt-7 flex items-center gap-3">
            {step > (oauthMode ? 1 : 0) && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex cursor-pointer items-center gap-1.5 rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white px-4 py-3 text-[13.5px] font-semibold text-[#516155] transition-all hover:bg-[#F1F6EE] active:scale-95"
              >
                <ArrowLeft className="size-4" strokeWidth={2.2} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance() || busy}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14.5px] font-semibold text-[#0f2a17] shadow-[0_12px_26px_-10px_rgba(143,209,79,.7)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)" }}
            >
              {busy ? (
                <><Loader2 className={`size-4 ${styles.spin}`} strokeWidth={2.6} /> Creating your account…</>
              ) : step === steps.length - 1 ? (
                <>Finish and see my matches <ArrowRight className="size-4" strokeWidth={2.4} /></>
              ) : (
                <>Continue <ArrowRight className="size-4" strokeWidth={2.4} /></>
              )}
            </button>
          </div>

          {step === 0 && (
            <p className="mt-5 text-center text-[13px] text-[#69746A]">
              Already have an account? <a href="/login" className="font-semibold text-[#3DA35D] hover:text-[#23472D]">Sign in</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border-[1.5px] border-[#E2E8DE] bg-[#FBFDFA] px-[15px] py-[13px] text-[13.5px] font-medium text-[#202320] outline-none transition focus:border-[#8FD14F] focus:shadow-[0_0_0_4px_rgba(143,209,79,.16)]";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-[7px] flex items-center justify-between text-[12px] font-semibold text-[#3f4a43]">
        {label}
        {hint && <span className="text-[11px] font-medium text-[#9aa39c]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
