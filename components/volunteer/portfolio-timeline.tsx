"use client";

import { motion } from "framer-motion";

import { useCheckins } from "@/lib/checkin";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";

type Tone = "start" | "hours" | "badge" | "live";
type Item = { icon: string; title: string; meta: string; date: string; tone: Tone };

// A seeded care journey so the timeline reads well in the demo; live check-ins
// (lib/checkin.ts) are prepended as they happen.
const SEED: Item[] = [
  { icon: "🧓", title: "Elderly Care & BP Camp", meta: "+4h verified", date: "14 Jul", tone: "hours" },
  { icon: "🏅", title: "Blood Drive Volunteer badge", meta: "3 sessions unlocked it", date: "9 Jul", tone: "badge" },
  { icon: "🤱", title: "Maternal & Child Health Drive", meta: "+4h verified", date: "6 Jul", tone: "hours" },
  { icon: "🎉", title: "Joined CareYuk", meta: "Started your care portfolio", date: "2 Jul", tone: "start" },
];

const TONE: Record<Tone, { dot: string; ring: string; chip: string; chipText: string }> = {
  start: { dot: "#3DA35D", ring: "rgba(61,163,93,.25)", chip: "#EAF7E3", chipText: "#3DA35D" },
  hours: { dot: "#8FD14F", ring: "rgba(143,209,79,.28)", chip: "#EAF7E3", chipText: "#3f9e46" },
  badge: { dot: "#E8A33C", ring: "rgba(232,163,60,.25)", chip: "#FBEFD8", chipText: "#B7791F" },
  live: { dot: "#EF5A5A", ring: "rgba(239,90,90,.25)", chip: "#FDECEC", chipText: "#D2453F" },
};

export function PortfolioTimeline() {
  const { sessions } = useCheckins();

  const live: Item[] = sessions.map((s) => ({
    icon: "✅",
    title: s.title,
    meta: `+${s.hours}h · checked in on-site`,
    date: "Today",
    tone: "live",
  }));

  const items = [...live, ...SEED];

  return (
    <div>
      <div className="mb-3 mt-1 text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Your journey</div>

      <motion.div
        className="relative pl-[26px]"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
      >
        {/* the rail draws itself in */}
        <motion.div
          className="absolute left-[9px] top-1 w-[2px] rounded-full"
          style={{ background: "linear-gradient(180deg,#8FD14F,#3DA35D 55%,#E7EEE2)", transformOrigin: "top", bottom: 8 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        />

        <div className="flex flex-col gap-[14px]">
          {items.map((it, i) => {
            const t = TONE[it.tone];
            return (
              <motion.div
                key={`${it.title}-${i}`}
                className="relative"
                variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } } }}
              >
                {/* dot */}
                <motion.span
                  className="absolute -left-[26px] top-[14px] flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-white"
                  style={{ background: t.dot, boxShadow: `0 0 0 4px ${t.ring}` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.09, type: "spring", stiffness: 320, damping: 16 }}
                />
                <div className="rounded-[16px] border border-white/70 bg-white/60 p-3.5 backdrop-blur transition-transform hover:-translate-y-0.5" style={{ boxShadow: "0 10px 24px -18px rgba(28,61,39,.5)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EEF3EC] text-[16px]">{it.icon}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-bold leading-tight text-[#1c3d27]" style={{ fontFamily: disp }}>{it.title}</div>
                        <div className="text-[11.5px] font-semibold text-[#69746A]">{it.meta}</div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-[9px] py-[3px] text-[10px] font-extrabold" style={{ background: t.chip, color: t.chipText }}>{it.date}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
