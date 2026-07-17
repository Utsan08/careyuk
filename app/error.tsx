"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";
const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Themed error boundary — replaces Next's default crash screen with CareYuk's
 * green cinematic look. `reset()` retries the failed render.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center text-[#F1F7EF]"
      style={{ background: "linear-gradient(160deg,#14301e 0%,#1a3b27 45%,#0f2417 100%)" }}>
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[440px] w-[440px] rounded-full opacity-30 blur-[70px]" style={{ background: "radial-gradient(circle,#3DA35D,transparent 68%)" }} />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-[460px] w-[460px] rounded-full opacity-25 blur-[80px]" style={{ background: "radial-gradient(circle,#8FD14F,transparent 66%)" }} />

      <motion.div initial={{ opacity: 0, y: 24, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, ease }}
        className="relative z-10 flex flex-col items-center">
        <Image src="/careyuk-logo.png" alt="CareYuk" width={64} height={64} className="object-contain [filter:brightness(1.3)_drop-shadow(0_8px_30px_rgba(143,209,79,.5))]" />
        <h1 className="mt-6 text-[38px] font-bold leading-[1.05] tracking-[-.02em] sm:text-[48px]" style={{ fontFamily: disp }}>Something went sideways.</h1>
        <p className="mt-4 max-w-[440px] text-[15px] leading-[1.6] text-[#CFE6BF]/75">
          A hiccup on our end — nothing you did. Give it another try, or head back to safety.
        </p>
        {error?.digest && <p className="mt-2 text-[11.5px] text-[#CFE6BF]/40">Ref: {error.digest}</p>}

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <button onClick={reset} className="flex h-12 w-[200px] items-center justify-center rounded-[14px] text-[15px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 12px 30px -8px rgba(143,209,79,.6)" }}>
            Try again
          </button>
          <Link href="/about" className="flex h-12 w-[200px] items-center justify-center rounded-[14px] border border-white/25 bg-white/[.08] text-[15px] font-semibold text-[#F1F7EF] backdrop-blur transition-colors hover:bg-white/15">
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
