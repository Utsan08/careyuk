"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Sparkles } from "lucide-react";

import { createClient, isProviderEnabled } from "@/lib/supabase/client";
import { EDUCATION_OPTIONS, FACULTY_LABELS, FACULTY_OPTIONS, INTEREST_OPTIONS, JAKARTA_REGIONS, toJakartaRegions } from "@/lib/profile-options";
import { saveDemoProfile } from "@/lib/demoProfile";
import styles from "./signup.module.css";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";
type Role = "volunteer" | "org";
type Zone = { id: string; name: string };

/**
 * Volunteers: account -> faculty -> interests -> home region.
 * Orgs: account -> the region they serve + a short description.
 */
const VOLUNTEER_STEPS = ["Account", "Study", "Interests", "Region"];
const ORG_STEPS = ["Account", "Organisation"];

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
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState<string>("");
  const [bio, setBio] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = role === "org" ? ORG_STEPS : VOLUNTEER_STEPS;

  // The 5 Jakarta regions always render. If the zones API can't serve real rows
  // (e.g. the backend service key isn't set yet), fall back to placeholder region
  // options so signup is never blocked — placeholder ids are stripped on save.
  const FALLBACK_ZONES: Zone[] = JAKARTA_REGIONS.map((name) => ({ id: `fallback:${name}`, name }));

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => (r.ok ? r.json() : []))
      .then((z) => {
        const real = Array.isArray(z) ? toJakartaRegions(z.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }))) : [];
        setZones(real.length ? real : FALLBACK_ZONES);
      })
      .catch(() => setZones(FALLBACK_ZONES));
  }, []);

  // Prefill the name Google gave us.
  useEffect(() => {
    if (!oauthMode) return;
    fetch("/api/profile/complete")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.email) setEmail(d.email);
        if (d && !d.needsOnboarding && d.profile) {
          router.replace(d.profile.role === "org" ? "/org" : "/volunteer");
        }
      })
      .catch(() => {});
  }, [oauthMode, router]);

  const toggleInterest = (value: string) =>
    setInterests((list) => (list.includes(value) ? list.filter((i) => i !== value) : [...list, value]));

  const canAdvance = () => {
    if (step === 0) return fullName.trim() && email.trim() && password.length >= 6;
    if (role === "org") return !!zoneId; // org step 1: region is the only required field
    if (step === 1) return !!faculty && !!educationLevel;
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
      faculty: role === "volunteer" ? faculty || undefined : undefined,
      education_level: role === "volunteer" ? educationLevel || undefined : undefined,
      interests: role === "volunteer" ? interests : undefined,
      zone_id: zoneId && !zoneId.startsWith("fallback:") ? zoneId : undefined,
      bio: bio.trim() || undefined,
    };

    // Remember who they are for the dashboard greeting + profile card, so the
    // demo works with or without a live session.
    saveDemoProfile({
      full_name: fullName.trim(),
      role,
      faculty: (role === "volunteer" && faculty) || null,
      education_level: (role === "volunteer" && educationLevel) || null,
      interests: role === "volunteer" ? interests : [],
      avatar_url: null,
    });

    const toDashboard = () => router.push(role === "org" ? "/org" : "/volunteer?tour=1");

    // OAuth users already have a session — they only need the profile rows.
    const res = await (oauthMode
      ? fetch("/api/profile/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, email: email.trim(), password }),
        })
    ).catch(() => null);

    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      const msg: string = data.error ?? "";
      // When the backend itself isn't reachable/configured (empty Supabase keys,
      // missing tables), don't dead-end the demo — carry on into the dashboard.
      const backendDown = !res || res.status >= 500 || /supabase|service|key|PGRST|relation|schema|column|fetch failed/i.test(msg);
      if (backendDown) {
        toDashboard();
        return;
      }
      setError(msg || "Could not create your account.");
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

    toDashboard();
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
        <Link href="/about" className="relative flex items-center gap-2.5" aria-label="About CareYuk">
          <Image src="/careyuk-logo.png" alt="" width={30} height={30} className="object-contain [filter:brightness(1.4)]" />
          <span className="text-[18px] font-semibold text-[#F8F9F7]" style={{ fontFamily: disp }}>CareYuk</span>
        </Link>
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

            {step === 1 && role === "org" && (
              <>
                <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: disp }}>
                  Which region do you serve?
                </h1>
                <p className="mt-1 mb-5 flex items-center gap-1.5 text-[13px] font-medium text-[#8a938b]">
                  <MapPin className="size-3.5 text-[#8FD14F]" strokeWidth={2.4} />
                  Volunteers in your region see your opportunities first.
                </p>
                <div className="mb-5 grid grid-cols-2 gap-2">
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
                  {zones.length === 0 && <div className="col-span-2 text-[12.5px] text-[#8a938b]">Couldn&apos;t load regions.</div>}
                </div>
                <label className="mb-[7px] flex items-center justify-between text-[12px] font-semibold text-[#3f4a43]">
                  About your organisation
                  <span className="text-[11px] font-medium text-[#9aa39c]">Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. A community Posyandu running monthly weighing days and maternal health drives."
                  className={`${inputCls} resize-none leading-[1.5]`}
                />
              </>
            )}

            {step === 1 && role === "volunteer" && (
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

                <h2 className="mt-7 text-[15px] font-semibold tracking-[-.01em] text-[#23472D]" style={{ fontFamily: disp }}>
                  Where are you in your studies?
                </h2>
                <p className="mt-1 mb-3 text-[13px] font-medium text-[#8a938b]">
                  This decides which roles you can take — some clinics need med students.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {EDUCATION_OPTIONS.map((o) => {
                    const on = educationLevel === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setEducationLevel(o.value)}
                        className="flex cursor-pointer items-start gap-2.5 rounded-[14px] border-[1.5px] p-3 text-left transition-all active:scale-[.98]"
                        style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff", boxShadow: on ? "0 8px 20px -12px rgba(143,209,79,.7)" : "none" }}
                      >
                        <span className="text-[20px] leading-none">{o.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold" style={{ color: on ? "#23472D" : "#3f4a43" }}>{o.label}</span>
                          <span className="block text-[11.5px] leading-[1.35] text-[#8a938b]">{o.blurb}</span>
                        </span>
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
