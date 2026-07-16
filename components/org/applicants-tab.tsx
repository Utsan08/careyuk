import { Check, X } from "lucide-react";

import {
  APPLICANTS,
  displayFont,
  initials,
  matchColor,
  TOTAL_APPLIED,
  TOTAL_SLOTS,
  type Decision,
} from "./data";
import styles from "./org-dashboard.module.css";

const rowClass = "grid gap-3 [grid-template-columns:2.4fr_1.3fr_1fr_1.3fr]";

export function ApplicantsTab({
  appStatus,
  onDecide,
}: {
  appStatus: Record<number, Decision>;
  onDecide: (id: number, decision: Decision) => void;
}) {
  const acceptedCount = Object.values(appStatus).filter((v) => v === "accepted").length;

  return (
    <div className={styles.tabIn}>
      <div className="mb-[22px] grid grid-cols-3 gap-4">
        <StatCard label="Total applied" value={`${TOTAL_APPLIED}`} />
        <StatCard
          label="Slots open"
          value={
            <>
              {Math.max(0, TOTAL_SLOTS - acceptedCount)}{" "}
              <span className="text-[15px] text-[#9aa39c]">/ {TOTAL_SLOTS}</span>
            </>
          }
        />
        <div
          className="rounded-[18px] px-5 py-[18px] text-[#183a22]"
          style={{ background: "linear-gradient(150deg,#8FD14F,#6cbf3f)" }}
        >
          <div className="text-[12px] font-bold opacity-80">Avg match score</div>
          <div className="text-[30px] font-bold" style={{ fontFamily: displayFont }}>
            84%
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#E9EFE6] bg-white shadow-[0_10px_30px_-22px_rgba(28,61,39,.4)]">
        <div
          className={`${rowClass} bg-[#F1F6EE] px-[22px] py-3.5 text-[11px] font-extrabold tracking-[.04em] text-[#69746A] uppercase`}
        >
          <span>Volunteer</span>
          <span>Match</span>
          <span>Distance</span>
          <span className="text-right">Decision</span>
        </div>
        {APPLICANTS.map((a) => {
          const decision = appStatus[a.id];
          const color = matchColor(a.match);
          return (
            <div
              key={a.id}
              className={`${rowClass} items-center border-t border-[#EEF3EC] px-[22px] py-4 transition-colors hover:bg-[#FAFCF8]`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-[#1c3d27]"
                  style={{ background: a.avatar, fontFamily: displayFont }}
                >
                  {initials(a.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{a.name}</div>
                  <div className="text-[11.5px] font-semibold text-[#69746A]">
                    {a.level} · {a.faculty}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#8a948b]">{a.reason}</div>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {a.match}%
                </span>
              </div>
              <div className="text-[12.5px] font-bold text-[#516155]">{a.distance} km</div>
              <div className="flex justify-end gap-2">
                {!decision ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onDecide(a.id, "rejected")}
                      aria-label={`Reject ${a.name}`}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[11px] border-[1.5px] border-[#F0D5D5] bg-white text-[#D2453F] hover:bg-[#FDECEC]"
                    >
                      <X className="size-4" strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecide(a.id, "accepted")}
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[11px] px-[15px] text-[12.5px] font-extrabold text-[#0f2a17] hover:brightness-105"
                      style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)" }}
                    >
                      <Check className="size-[15px]" strokeWidth={3} />
                      Accept
                    </button>
                  </>
                ) : (
                  <span
                    className="rounded-[11px] px-3.5 py-2 text-[12px] font-extrabold"
                    style={{
                      background: decision === "accepted" ? "#EAF7E3" : "#F3E3E3",
                      color: decision === "accepted" ? "#3DA35D" : "#B0554F",
                    }}
                  >
                    {decision === "accepted" ? "✓ Accepted" : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#E9EFE6] bg-white px-5 py-[18px]">
      <div className="text-[12px] font-semibold text-[#69746A]">{label}</div>
      <div className="text-[30px] font-bold text-[#1c3d27]" style={{ fontFamily: displayFont }}>
        {value}
      </div>
    </div>
  );
}
