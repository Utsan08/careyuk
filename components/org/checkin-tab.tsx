import { useMemo } from "react";

import { displayFont, initials, qrCells, TOTAL_SLOTS, type VerifiedVolunteer } from "./data";
import styles from "./org-dashboard.module.css";

const cardClass = "rounded-[22px] border border-[#E9EFE6] bg-white p-6 shadow-[0_10px_30px_-22px_rgba(28,61,39,.4)]";

export function CheckinTab({
  checkedIn,
  verified,
  onScan,
}: {
  checkedIn: number;
  verified: VerifiedVolunteer[];
  onScan: () => void;
}) {
  const cells = useMemo(() => qrCells(), []);
  const pct = Math.min(100, Math.round((checkedIn / TOTAL_SLOTS) * 100));

  return (
    <div className={`grid gap-[22px] [grid-template-columns:360px_1fr] ${styles.tabIn}`}>
      <div className={`${cardClass} self-start text-center`}>
        <div className="mb-1 text-[12px] font-semibold text-[#3f4a43]">Scan to verify on-site</div>
        <div className="mb-[18px] text-[11.5px] text-[#69746A]">Maternal &amp; Child Health Drive</div>
        <div className="relative mx-auto h-[206px] w-[206px] rounded-[20px] border border-[#E9EFE6] bg-white p-4 shadow-[0_8px_22px_-12px_rgba(28,61,39,.35)]">
          <div
            className={`absolute right-4 left-4 z-[2] h-0.5 ${styles.scanline}`}
            style={{ background: "linear-gradient(90deg,transparent,#8FD14F,transparent)" }}
          />
          <svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges" aria-hidden="true">
            {cells.map((c) => (
              <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" rx="0.15" fill="#16311f" />
            ))}
          </svg>
        </div>
        <div className="mt-4 text-[11px] text-[#69746A]">Or enter code manually</div>
        <div className="mt-2 flex gap-2">
          <input
            defaultValue="CYK-4821"
            aria-label="Check-in code"
            className="flex-1 rounded-[11px] border-[1.5px] border-[#E2E8DE] bg-[#FBFDFA] p-[11px] text-center font-semibold tracking-[.14em] text-[#23472D] outline-none focus:border-[#8FD14F]"
          />
          <button
            type="button"
            onClick={onScan}
            className="cursor-pointer rounded-[11px] bg-[#23472D] px-4 text-[12.5px] font-semibold text-white"
          >
            Verify
          </button>
        </div>
      </div>

      <div className={`${cardClass} flex min-h-0 flex-col`}>
        <div className="mb-[18px] flex items-center justify-between">
          <div>
            <div className="text-[22px] font-semibold" style={{ fontFamily: displayFont }}>
              {checkedIn} <span className="text-base text-[#9aa39c]">/ {TOTAL_SLOTS} checked in</span>
            </div>
            <div className="text-[12px] text-[#69746A]">Verified stamps land on volunteer portfolios instantly</div>
          </div>
          <button
            type="button"
            onClick={onScan}
            className="flex shrink-0 cursor-pointer items-center gap-[7px] rounded-xl px-[15px] py-2.5 text-[12.5px] font-semibold text-[#0f2a17] hover:brightness-105"
            style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)" }}
          >
            <span className={`h-2 w-2 rounded-full bg-[#0f2a17] ${styles.pulseDot}`} />
            Simulate scan
          </button>
        </div>
        <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-[#EEF3EC]">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ background: "linear-gradient(90deg,#8FD14F,#3DA35D)", width: `${pct}%` }}
          />
        </div>
        <div className="mb-2.5 text-[11px] font-semibold tracking-[.04em] text-[#69746A] uppercase">
          Verified so far
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {verified.map((v) => (
            <div
              key={v.id}
              className={`flex items-center gap-3 rounded-[13px] border border-[#EEF3EC] bg-[#F7FAF5] px-3.5 py-[11px] ${styles.fadeUpFast}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold text-[#1c3d27]"
                style={{ background: v.avatar, fontFamily: displayFont }}
              >
                {initials(v.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{v.name}</div>
                <div className="text-[11px] text-[#69746A]">
                  {v.faculty} · {v.hours}h credited
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-semibold text-[#3DA35D]">✓ Verified</div>
                <div className="text-[11px] text-[#9aa39c]">{v.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
