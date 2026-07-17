"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import jsQR from "jsqr";

import {
  DEMO_CHECKIN_HOURS,
  DEMO_CHECKIN_TITLE,
  parseCheckinCode,
  useCheckins,
} from "@/lib/checkin";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";

/**
 * On-site check-in scanner for volunteers. Opens the camera and decodes the
 * org's QR (which encodes CAREYUK-CHECKIN:<code>) with jsQR — fully offline, no
 * API. Falls back to typing the code when there's no camera or permission is
 * denied, so it always works in a demo. On a valid code it records the session
 * (lib/checkin.ts) and the volunteer's verified hours update instantly.
 */
export function CheckinScanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { record } = useCheckins();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [mode, setMode] = useState<"scanning" | "manual" | "success">("scanning");
  const [manual, setManual] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const succeed = (code: string) => {
    stopCamera();
    record({ code, title: DEMO_CHECKIN_TITLE, hours: DEMO_CHECKIN_HOURS, at: Date.now() });
    setMode("success");
  };

  const tryCode = (raw: string) => {
    const code = parseCheckinCode(raw);
    if (code) succeed(code);
    else setNote("That code doesn’t match an active opportunity.");
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!open) return;
    setMode("scanning");
    setManual("");
    setNote(null);

    let cancelled = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const scan = () => {
      const video = videoRef.current;
      if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(img.data, img.width, img.height);
        if (result?.data) {
          const code = parseCheckinCode(result.data);
          if (code) { succeed(code); return; }
        }
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        rafRef.current = requestAnimationFrame(scan);
      })
      .catch(() => {
        if (!cancelled) { setMode("manual"); setNote("No camera available — enter the code shown on the organiser’s screen."); }
      });

    return () => { cancelled = true; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => { stopCamera(); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-5"
          style={{ background: "linear-gradient(135deg,#1a3b27 0%,#14301e 60%,#0f2417 100%)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}>

          <button onClick={close} aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[18px] text-white backdrop-blur transition hover:bg-white/20">✕</button>

          {mode === "success" ? (
            <motion.div className="flex flex-col items-center text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
              <motion.div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full text-[44px]"
                style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)", boxShadow: "0 0 40px rgba(143,209,79,.5)" }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}>✓</motion.div>
              <div className="text-[24px] font-bold text-[#F8F9F7]" style={{ fontFamily: disp }}>You’re checked in!</div>
              <div className="mt-1 max-w-[280px] text-[14px] leading-[1.5] text-[#EAF7E3]/75">
                <span className="font-semibold text-[#8FD14F]">+{DEMO_CHECKIN_HOURS} verified hours</span> added for {DEMO_CHECKIN_TITLE}.
              </div>
              <button onClick={close}
                className="mt-7 rounded-[14px] px-6 py-3 text-[14.5px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 10px 24px -8px rgba(143,209,79,.7)" }}>Done</button>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="text-[22px] font-bold text-[#F8F9F7]" style={{ fontFamily: disp }}>Check in on-site</div>
                <div className="mt-1 text-[13.5px] text-[#EAF7E3]/70">Point your camera at the organiser’s QR code.</div>
              </div>

              {mode === "scanning" && (
                <div className="relative h-[280px] w-[280px] overflow-hidden rounded-[28px] border border-white/15 bg-black/40">
                  <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                  {/* framing corners + scanline */}
                  <div className="pointer-events-none absolute inset-5 rounded-[18px] border-2 border-[#8FD14F]/70" />
                  <motion.div className="pointer-events-none absolute left-6 right-6 h-[2px] rounded"
                    style={{ background: "linear-gradient(90deg,transparent,#8FD14F,transparent)" }}
                    initial={{ top: "12%" }} animate={{ top: ["12%", "88%", "12%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
                </div>
              )}

              {note && <div className="mt-4 max-w-[300px] text-center text-[12.5px] text-[#EAF7E3]/70">{note}</div>}

              {/* manual fallback — always available */}
              <div className="mt-6 flex w-full max-w-[300px] items-center gap-2">
                <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Enter code (e.g. CYK-4821)"
                  onKeyDown={(e) => e.key === "Enter" && tryCode(manual)}
                  className="min-w-0 flex-1 rounded-[12px] border border-white/15 bg-white/10 px-3.5 py-2.5 text-[13.5px] font-medium text-white outline-none placeholder:text-white/45 focus:border-[#8FD14F]" />
                <button onClick={() => tryCode(manual)}
                  className="shrink-0 rounded-[12px] px-4 py-2.5 text-[13px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)" }}>Check in</button>
              </div>
              {mode === "scanning" && (
                <button onClick={() => setMode("manual")} className="mt-3 text-[12.5px] font-semibold text-[#EAF7E3]/60 underline underline-offset-2">No camera? Enter the code instead</button>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
