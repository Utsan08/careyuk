"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { createClient, isProviderEnabled } from "@/lib/supabase/client";

/**
 * CareYuk — Login  ·  app/login/page.tsx
 * Owns role → route handoff: volunteer → /volunteer/explore, org → /org
 * npm i framer-motion. Fonts via next/font: --font-display and --font-body both resolve to Geist.
 */

type Role = "volunteer" | "org";
const ease = [0.2, 0.8, 0.2, 1] as const;
const disp = "var(--font-display,'Geist','Inter',sans-serif)";
const PHRASES = ["Care that comes full circle.", "Verified hours, real impact.", "Help where it\u2019s needed most.", "Grow while you give back."];

function useCountUp(target: number, duration = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function useTypewriter() {
  const [typed, setTyped] = useState("");
  const st = useRef({ i: 0, del: false });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const s = st.current;
      const p = PHRASES[s.i];
      setTyped((cur) => {
        if (!s.del) {
          const next = p.slice(0, cur.length + 1);
          if (next === p) { s.del = true; timer = setTimeout(step, 2400); } else timer = setTimeout(step, 115);
          return next;
        } else {
          const next = p.slice(0, cur.length - 1);
          if (next === "") { s.del = false; s.i = (s.i + 1) % PHRASES.length; timer = setTimeout(step, 520); } else timer = setTimeout(step, 60);
          return next;
        }
      });
    };
    timer = setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, []);
  return typed;
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("volunteer");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVol = role === "volunteer";
  const count = useCountUp(12480);
  const typed = useTypewriter();

  const accent = isVol
    ? "linear-gradient(120deg,#A6E36A 0%,#8FD14F 45%,#3DA35D 100%)"
    : "linear-gradient(120deg,#3DA35D 0%,#2c6e42 55%,#23472D 100%)";
  const accentShadow = isVol ? "0 10px 26px rgba(143,209,79,.4)" : "0 10px 26px rgba(35,71,45,.35)";

  /**
   * Real sign-in. The role toggle only picks which dashboard we'd prefer — the
   * profile returned by the API is what actually decides, so signing in with an
   * org account while the toggle says "volunteer" still lands on /org.
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => null);
    setBusy(false);

    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(
        res?.status === 404
          ? "That account has no profile yet — finish signing up first."
          : (data.error ?? "Couldn't sign in. Check your email and password.")
      );
      return;
    }

    const profile = await res.json();
    router.push(profile.role === "org" ? "/org" : "/volunteer/explore");
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);

    // Check first — signInWithOAuth would redirect to a raw JSON error page.
    if (!(await isProviderEnabled("google"))) {
      setBusy(false);
      setError("Google sign-in isn't switched on for this project yet. Use your email, or create an account below.");
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

  const chips = [
    { icon: "✓", label: "Verified hours", delay: "0s" },
    { icon: "◎", label: "Priority zones", delay: ".8s" },
    { icon: "★", label: "Care portfolio", delay: "1.6s" },
  ];

  return (
    <div className="loginWrap flex min-h-screen w-full overflow-hidden bg-[#F8F9F7] text-[#202320]">
      {/* ---------- LEFT BRAND PANEL ---------- */}
      <div className="brandPanel relative flex basis-[46%] shrink-0 flex-col justify-between overflow-hidden px-12 py-[52px] text-[#EAF7E3]"
           style={{ background: "linear-gradient(125deg,#2a5b39 0%,#204630 30%,#1a3b27 60%,#14301e 100%)", backgroundSize: "220% 220%", animation: "gradientDrift 24s ease-in-out infinite" }}>
        <div className="pointer-events-none absolute -left-[110px] -top-[140px] h-[460px] w-[460px] rounded-full opacity-[.28] blur-[18px]"
             style={{ background: "radial-gradient(circle,#8FD14F 0%,transparent 70%)", animation: "blobMove 30s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute -bottom-[160px] -right-[130px] h-[500px] w-[500px] rounded-full opacity-[.32] blur-[22px]"
             style={{ background: "radial-gradient(circle,#3DA35D 0%,transparent 70%)", animation: "blobMove 38s ease-in-out infinite reverse" }} />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(1000px 600px at 30% 20%,rgba(201,243,176,.10),transparent 60%)" }} />

        {/* brand row */}
        <motion.div className="relative flex items-center gap-[13px]"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[#EAF7E3]/20 bg-[#EAF7E3]/[.14] backdrop-blur">
            <Image src="/careyuk-logo.png" alt="CareYuk" width={36} height={36}
              className="object-contain [filter:brightness(1.35)_saturate(1.1)_drop-shadow(0_2px_6px_rgba(143,209,79,.5))]" />
          </div>
          <span className="text-2xl font-bold tracking-[-.02em] text-[#F8F9F7]" style={{ fontFamily: disp }}>CareYuk</span>
        </motion.div>

        {/* hero */}
        <div className="heroBlock relative">
          <div className="logoHover relative mx-auto mb-[30px] h-[250px] w-[250px]">
            <div className="absolute -inset-[30px] rounded-full" style={{ background: "radial-gradient(circle,rgba(143,209,79,.26),transparent 62%)" }} />
            <Image src="/careyuk-logo.png" alt="" width={250} height={250}
              className="logoImg relative h-full w-full cursor-pointer object-contain transition-[filter] duration-300 [filter:brightness(1.28)_drop-shadow(0_8px_30px_rgba(143,209,79,.35))]" />
          </div>
          <h1 className="mb-[14px] min-h-[2.2em] text-[36px] font-bold leading-[1.1] tracking-[-.03em] text-[#F8F9F7] [text-wrap:balance]" style={{ fontFamily: disp }}>
            <span>{typed}</span>
            <span className="ml-[3px] inline-block h-[.92em] w-[3px] translate-y-[2px] rounded-[2px] bg-[#8FD14F]" style={{ animation: "caretBlink 1s step-end infinite" }} />
          </h1>
          <motion.p className="max-w-[360px] text-[15.5px] leading-[1.6] text-[#EAF7E3]/70"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.28 }}>
            Connect volunteers with the clinics, Posyandu and communities that need them most — and turn every hour into verified healthcare experience.
          </motion.p>
          <motion.div className="mt-6 flex flex-wrap gap-[10px]"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.4 }}>
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-[7px] rounded-full border border-[#EAF7E3]/[.16] bg-[#EAF7E3]/10 px-[14px] py-2 text-[12.5px] font-semibold text-[#EAF7E3]"
                style={{ animation: "floatB 6s ease-in-out infinite", animationDelay: c.delay }}>
                {c.icon} {c.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* impact stat */}
        <motion.div className="relative flex items-center gap-4"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.55 }}>
          <div className="flex items-center">
            {["#8FD14F", "#C9F3B0", "#3DA35D"].map((c, i) => (
              <span key={i} className="h-8 w-8 rounded-full border-2 border-[#1c3d27]" style={{ background: c, marginLeft: i ? -10 : 0 }} />
            ))}
            <span className="-ml-[10px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1c3d27] bg-[#EAF7E3]/[.18] text-[11px] font-bold text-[#EAF7E3]">+</span>
          </div>
          <div className="leading-[1.3]">
            <div className="text-[19px] font-bold text-[#F8F9F7]" style={{ fontFamily: disp }}>{count.toLocaleString("en-US")} verified hours</div>
            <div className="text-[12.5px] text-[#EAF7E3]/60">given across Jakarta &amp; Depok this year</div>
          </div>
        </motion.div>
      </div>

      {/* ---------- RIGHT FORM PANEL ---------- */}
      <div className="relative flex flex-1 basis-[54%] items-center justify-center px-8 py-10">
        <motion.div className="w-full max-w-[412px]"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.12 }}>

          <div className="mobileBrand mb-[34px] hidden items-center gap-[10px]">
            <Image src="/careyuk-logo.png" alt="CareYuk" width={40} height={40} className="object-contain" />
            <span className="text-xl font-bold tracking-[-.02em]" style={{ fontFamily: disp }}>CareYuk</span>
          </div>

          <h2 className="mb-2 text-[30px] font-bold tracking-[-.02em]" style={{ fontFamily: disp }}>Welcome back</h2>
          <p className="mb-[26px] text-[14.5px] text-[#69746A]">Sign in to continue your care journey.</p>

          {/* role toggle */}
          <div className="relative mb-6 flex select-none rounded-2xl bg-[#EAF7E3] p-[5px]">
            <div className="absolute bottom-[5px] left-[5px] top-[5px] w-[calc(50%-5px)] rounded-xl bg-white shadow-[0_4px_14px_rgba(35,71,45,.14)] transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(.6,.05,.1,1)]"
                 style={{ transform: isVol ? "translateX(0)" : "translateX(100%)" }} />
            <button type="button" onClick={() => setRole("volunteer")} className="relative z-[1] flex flex-1 items-center justify-center gap-2 rounded-xl py-[11px] text-sm font-bold transition-colors" style={{ color: isVol ? "#23472D" : "#7c887f" }}>
              <span className="text-base">🩺</span> Volunteer
            </button>
            <button type="button" onClick={() => setRole("org")} className="relative z-[1] flex flex-1 items-center justify-center gap-2 rounded-xl py-[11px] text-sm font-bold transition-colors" style={{ color: isVol ? "#7c887f" : "#23472D" }}>
              <span className="text-base">🏥</span> Organization
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <label className="mb-[7px] block text-[12.5px] font-semibold text-[#3f4a43]">Email</label>
            <div className="relative mb-[18px]">
              <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-base opacity-50">✉️</span>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                className="w-full rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white py-[14px] pl-[44px] pr-4 text-[15px] outline-none transition focus:border-[#8FD14F] focus:shadow-[0_0_0_4px_rgba(143,209,79,.18)]" />
            </div>

            <div className="mb-[7px] flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-[#3f4a43]">Password</label>
              <a href="#" className="text-[12.5px] font-semibold text-[#3DA35D] hover:text-[#23472D]">Forgot password?</a>
            </div>
            <div className="relative mb-[18px]">
              <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-base opacity-50">🔒</span>
              <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                className="w-full rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white py-[14px] pl-[44px] pr-[46px] text-[15px] outline-none transition focus:border-[#8FD14F] focus:shadow-[0_0_0_4px_rgba(143,209,79,.18)]" />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label="Show password" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-base opacity-55">
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>

            <label className="mb-[22px] flex cursor-pointer select-none items-center gap-[9px] text-[13.5px] text-[#3f4a43]">
              <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer accent-[#3DA35D]" /> Keep me signed in
            </label>

            {error && (
              <div className="mb-[14px] rounded-[12px] border border-[#EF5A5A]/30 bg-[#FDECEC] px-3.5 py-2.5 text-[12.5px] font-medium text-[#D2453F]">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy}
              className="relative flex w-full items-center justify-center gap-[9px] overflow-hidden rounded-[14px] py-[15px] text-[15.5px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
              style={{ background: accent, boxShadow: accentShadow }}>
              <span className="absolute left-0 top-0 h-full w-[45%]" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)", animation: "shine 3.6s ease-in-out infinite" }} />
              <span className="relative">{busy ? "Signing in…" : isVol ? "Sign in as Volunteer" : "Sign in as Organization"}</span>
              {!busy && <span className="relative text-[17px]">→</span>}
            </button>
          </form>

          <div className="my-[22px] flex items-center gap-[14px]">
            <span className="h-px flex-1 bg-[#E2E8DE]" /><span className="text-xs font-medium text-[#9aa39c]">or continue with</span><span className="h-px flex-1 bg-[#E2E8DE]" />
          </div>

          <button type="button" onClick={onGoogle} className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white py-[13px] text-[14.5px] font-semibold text-[#202320] transition hover:-translate-y-px hover:border-[#8FD14F] hover:bg-[#F8FBF4] active:translate-y-0">
            <GoogleIcon /> Sign in with Google
          </button>

          <p className="mt-[26px] text-center text-[13.5px] text-[#69746A]">
            New to CareYuk? <a href="/signup" className="font-bold text-[#3DA35D] hover:text-[#23472D]">Create an account</a>
          </p>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(12px)} }
        @keyframes blobMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(46px,-34px) scale(1.14)} 66%{transform:translate(-34px,28px) scale(.92)} }
        @keyframes shine { 0%{transform:translateX(-120%) skewX(-18deg)} 60%,100%{transform:translateX(320%) skewX(-18deg)} }
        @keyframes gradientDrift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes logoWiggle { 0%{transform:rotate(0) scale(1)} 30%{transform:rotate(9deg) scale(1.09)} 60%{transform:rotate(-7deg) scale(1.05)} 100%{transform:rotate(0) scale(1)} }
        .logoHover:hover .logoImg { animation: logoWiggle 1.2s cubic-bezier(.34,1.56,.64,1); filter: brightness(1.42) drop-shadow(0 10px 40px rgba(143,209,79,.6)); }
        @media (max-width:900px){
          .loginWrap{flex-direction:column}
          .brandPanel{flex-basis:auto;padding:34px 26px}
          .brandPanel .heroBlock{display:none}
          .mobileBrand{display:flex !important}
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.8-6.1C1 16.8 0 20.3 0 24s1 7.2 2.6 10.4l7.8-5.7z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.4 0-11.8-3.7-13.7-9.8l-7.8 5.7C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
