import Image from "next/image";
import Link from "next/link";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";

/** Themed 404 to match the CareYuk green look. */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-center text-[#F1F7EF]"
      style={{ background: "linear-gradient(160deg,#14301e 0%,#1a3b27 45%,#0f2417 100%)" }}>
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[440px] w-[440px] rounded-full opacity-30 blur-[70px]" style={{ background: "radial-gradient(circle,#3DA35D,transparent 68%)" }} />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-[460px] w-[460px] rounded-full opacity-25 blur-[80px]" style={{ background: "radial-gradient(circle,#8FD14F,transparent 66%)" }} />

      <div className="relative z-10 flex flex-col items-center">
        <Image src="/careyuk-logo.png" alt="CareYuk" width={64} height={64} className="object-contain [filter:brightness(1.3)_drop-shadow(0_8px_30px_rgba(143,209,79,.5))]" />
        <div className="mt-6 text-[80px] font-bold leading-none sm:text-[104px]" style={{ fontFamily: disp, background: "linear-gradient(120deg,#8FD14F,#3DA35D)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>404</div>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-.02em] sm:text-[32px]" style={{ fontFamily: disp }}>This page wandered off.</h1>
        <p className="mt-3 max-w-[420px] text-[15px] leading-[1.6] text-[#CFE6BF]/75">
          The link may be broken or the page moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/about" className="flex h-12 w-[200px] items-center justify-center rounded-[14px] text-[15px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 12px 30px -8px rgba(143,209,79,.6)" }}>
            Back to home
          </Link>
          <Link href="/login" className="flex h-12 w-[200px] items-center justify-center rounded-[14px] border border-white/25 bg-white/[.08] text-[15px] font-semibold text-[#F1F7EF] backdrop-blur transition-colors hover:bg-white/15">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
