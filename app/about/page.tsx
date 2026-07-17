"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from "framer-motion";

/**
 * CareYuk — About. A cinematic, scroll-driven story: text rises from blurry to
 * sharp, the green gradients brighten as you descend, and layers parallax for a
 * subtle 3D feel. Ends with sign in / sign up / back. Reached by clicking the
 * logo on any screen.
 */

const disp = "var(--font-display,'Geist','Inter',sans-serif)";
const ease = [0.16, 1, 0.3, 1] as const;

// blurry -> sharp reveal, with a touch of 3D lift
const reveal: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.96, filter: "blur(16px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 1.05, ease } },
};

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-6" style={{ perspective: 1200 }}>
      <motion.div
        className="max-w-[760px] text-center [transform-style:preserve-3d]"
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.55, margin: "-10% 0px -10% 0px" }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();

  // Intro: the logo spins in, blooms big, then shrinks and settles into the
  // landing. Plays once per session so re-clicking the logo isn't slow.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("cy_intro_seen")) {
      setIntro(false);
      return;
    }
    sessionStorage.setItem("cy_intro_seen", "1");
    const t = setTimeout(() => setIntro(false), 2100);
    return () => clearTimeout(t);
  }, []);

  // gradients brighten as you scroll down
  const darkVeil = useTransform(scrollYProgress, [0, 1], [0.86, 0.28]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.12, 0.5, 0.95]);
  const hueLift = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -240]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const barScaleX = scrollYProgress;
  const skipOpacity = useTransform(scrollYProgress, [0, 0.82, 0.94], [1, 1, 0]);

  const skipToEnd = () => {
    setIntro(false);
    requestAnimationFrame(() => document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="relative min-h-screen w-full text-[#F1F7EF]" style={{ background: "#0c1f14" }}>
      {/* ===== intro: spin → bloom → shrink into the landing ===== */}
      <AnimatePresence>
        {intro && (
          <motion.div key="intro" className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "radial-gradient(900px 620px at 50% 45%,#1c3d27,#0b1c11)" }}
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.75, ease }}>
            <motion.div
              initial={{ rotate: -40, scale: 0.22, opacity: 0 }}
              animate={{ rotate: [-40, 320, 560], scale: [0.22, 1.95, 0.72], opacity: [0, 1, 1] }}
              transition={{ duration: 1.7, ease, times: [0, 0.62, 1] }}>
              <Image src="/careyuk-logo.png" alt="CareYuk" width={150} height={150}
                className="object-contain [filter:brightness(1.3)_drop-shadow(0_12px_60px_rgba(143,209,79,.6))]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* quick sign-in from the landing */}
      <Link href="/login" className="fixed right-6 top-5 z-30 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-bold text-[#F1F7EF] backdrop-blur transition-colors hover:bg-white/20">Sign in →</Link>

      {/* skip the cinematic scroll straight to the sign-in CTA (fades out near the end) */}
      <motion.button onClick={skipToEnd} style={{ opacity: skipOpacity }}
        className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/20 bg-black/30 px-5 py-2.5 text-[12.5px] font-bold text-[#F1F7EF] backdrop-blur transition-colors hover:bg-black/50">
        Skip to the end ↓
      </motion.button>

      {/* ===== fixed cinematic background ===== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#14301e 0%,#1a3b27 40%,#0f2417 100%)" }} />
        {/* brightening glow */}
        <motion.div className="absolute inset-0" style={{ opacity: glow, background: "radial-gradient(1100px 720px at 50% 30%, rgba(143,209,79,.55), transparent 60%)" }} />
        <motion.div className="absolute -left-40 top-1/4 h-[520px] w-[520px] rounded-full blur-[60px]" style={{ y: orbY, opacity: glow, background: "radial-gradient(circle,#3DA35D,transparent 68%)" }} />
        <motion.div className="absolute -right-40 top-2/3 h-[560px] w-[560px] rounded-full blur-[70px]" style={{ y: orbY2, opacity: glow, background: "radial-gradient(circle,#8FD14F,transparent 66%)", filter: hueLift ? undefined : undefined }} />
        {/* dark veil that lifts as you scroll */}
        <motion.div className="absolute inset-0" style={{ opacity: darkVeil, background: "linear-gradient(180deg,rgba(6,15,10,.6),rgba(6,15,10,.2))" }} />
      </div>

      {/* scroll progress bar */}
      <motion.div className="fixed left-0 top-0 z-30 h-[3px] w-full origin-left" style={{ scaleX: barScaleX, background: "linear-gradient(90deg,#8FD14F,#3DA35D)" }} />

      {/* home logo (also here so it's always reachable) */}
      <Link href="/login" className="fixed left-6 top-5 z-30 flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
        <Image src="/careyuk-logo.png" alt="CareYuk" width={34} height={34} className="object-contain [filter:brightness(1.3)_drop-shadow(0_2px_10px_rgba(143,209,79,.5))]" />
        <span className="text-[17px] font-bold tracking-[-.02em]" style={{ fontFamily: disp }}>CareYuk</span>
      </Link>

      {/* ===== content ===== */}
      <div className="relative z-10">
        {/* hero */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease }}>
            <Image src="/careyuk-logo.png" alt="CareYuk" width={92} height={92} className="mx-auto object-contain [filter:brightness(1.3)_drop-shadow(0_10px_40px_rgba(143,209,79,.5))]" />
          </motion.div>
          <motion.h1 className="mt-6 text-[54px] font-bold leading-[1.02] tracking-[-.03em] sm:text-[72px]" style={{ fontFamily: disp }}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, ease, delay: 0.15 }}>
            Care that comes<br />full circle.
          </motion.h1>
          <motion.p className="mt-5 max-w-[520px] text-[16px] leading-[1.6] text-[#CFE6BF]/80"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.4 }}>
            CareYuk connects volunteers with the clinics, Posyandu and communities that need them most — turning every hour into verified healthcare experience.
          </motion.p>
          <motion.div className="mt-14 flex flex-col items-center gap-1 text-[12px] font-semibold uppercase tracking-[.25em] text-[#8FD14F]/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            Scroll to explore
            <motion.span animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>↓</motion.span>
          </motion.div>
        </section>

        <Section>
          <div className="text-[13px] font-bold uppercase tracking-[.3em] text-[#8FD14F]">The problem we tackle</div>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.1] tracking-[-.02em] sm:text-[56px]" style={{ fontFamily: disp }}>Healthcare that reaches everyone.</h2>
          <p className="mx-auto mt-5 max-w-[580px] text-[17px] leading-[1.65] text-[#CFE6BF]/80">
            Across Jakarta&apos;s neighbourhoods, Posyandu posts and community clinics are stretched thin — maternal check-ups, elderly screenings and health education go undone for want of hands. CareYuk closes that gap by routing willing volunteers to the doorsteps that need them.
          </p>
        </Section>

        <Section>
          <div className="text-[13px] font-bold uppercase tracking-[.3em] text-[#8FD14F]">Access, both ways</div>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.1] tracking-[-.02em] sm:text-[56px]" style={{ fontFamily: disp }}>Opportunities that open doors.</h2>
          <p className="mx-auto mt-5 max-w-[580px] text-[17px] leading-[1.65] text-[#CFE6BF]/80">
            Communities gain access to care they&apos;d otherwise miss. Volunteers — from high schoolers to med students — gain access to real clinical experience: maternal &amp; child drives, clinic vitals and intake, ward shadowing, blood drives and nutrition screenings. Every opportunity is a rung on the ladder from citizen to certified health worker.
          </p>
        </Section>

        {/* impact strip */}
        <Section>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { n: "12,480+", l: "Verified care hours given across Jakarta & Depok" },
              { n: "5", l: "Jakarta regions where opportunities are matched" },
              { n: "3", l: "Paths — community drives, clinic help, shadowing" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-[46px] font-bold leading-none text-[#8FD14F] sm:text-[58px]" style={{ fontFamily: disp }}>{s.n}</div>
                <div className="mx-auto mt-3 max-w-[220px] text-[13.5px] leading-[1.5] text-[#CFE6BF]/70">{s.l}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <div className="text-[13px] font-bold uppercase tracking-[.3em] text-[#8FD14F]">Verified impact</div>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.1] tracking-[-.02em] sm:text-[56px]" style={{ fontFamily: disp }}>Every hour, verified.</h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.65] text-[#CFE6BF]/80">
            Volunteers check in on-site with a QR scan. Each session is stamped, credited, and added to a care portfolio that hospitals and universities can trust.
          </p>
        </Section>

        <Section>
          <div className="text-[13px] font-bold uppercase tracking-[.3em] text-[#8FD14F]">Where it matters</div>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.1] tracking-[-.02em] sm:text-[56px]" style={{ fontFamily: disp }}>Help where it&apos;s needed most.</h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.65] text-[#CFE6BF]/80">
            Smart matching steers volunteers toward priority zones with the lowest community health scores — so effort lands where it changes the most lives.
          </p>
        </Section>

        <Section>
          <div className="text-[13px] font-bold uppercase tracking-[.3em] text-[#8FD14F]">Grow with it</div>
          <h2 className="mt-4 text-[40px] font-bold leading-[1.1] tracking-[-.02em] sm:text-[56px]" style={{ fontFamily: disp }}>Grow while you give back.</h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.65] text-[#CFE6BF]/80">
            Earn badges, build verified hours, and climb from citizen to certified community health worker — the relay effect where every volunteer strengthens the next.
          </p>
        </Section>

        {/* ===== final CTA ===== */}
        <section id="get-started" className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-24 text-center">
          <motion.h2 className="text-[42px] font-bold leading-[1.05] tracking-[-.02em] sm:text-[64px]" style={{ fontFamily: disp }}
            variants={reveal} initial="hidden" whileInView="show" viewport={{ amount: 0.6 }}>
            Ready to make<br />it count?
          </motion.h2>
          <motion.div className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.6 }} transition={{ duration: 0.8, ease, delay: 0.15 }}>
            <Link href="/login" className="flex h-12 w-[220px] items-center justify-center rounded-[14px] text-[15px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 12px 30px -8px rgba(143,209,79,.6)" }}>
              Sign in
            </Link>
            <Link href="/signup" className="flex h-12 w-[220px] items-center justify-center rounded-[14px] border border-white/25 bg-white/[.08] text-[15px] font-bold text-[#F1F7EF] backdrop-blur transition-colors hover:bg-white/15">
              Create an account
            </Link>
            <button onClick={() => router.back()} className="flex h-12 w-[220px] items-center justify-center rounded-[14px] text-[15px] font-semibold text-[#CFE6BF]/80 transition-colors hover:text-white">
              ← Go back
            </button>
          </motion.div>
          <div className="mt-16 text-[12.5px] text-[#CFE6BF]/45">CareYuk · care that comes full circle</div>
        </section>
      </div>
    </div>
  );
}
