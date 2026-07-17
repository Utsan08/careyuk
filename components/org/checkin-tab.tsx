import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { CHECKIN_PREFIX } from "@/lib/checkin";
import { CHECKIN_CODE, displayFont, initials, type VerifiedVolunteer } from "./data";
import styles from "./org-dashboard.module.css";

const cardClass = "rounded-[22px] border border-[#E9EFE6] bg-white p-6 shadow-[0_10px_30px_-22px_rgba(28,61,39,.4)]";

export function CheckinTab({
  checkedIn,
  verified,
  onScan,
  totalSlots,
  search,
}: {
  checkedIn: number;
  verified: VerifiedVolunteer[];
  /** Returns false when the roster is already full. */
  onScan: () => boolean;
  totalSlots: number;
  search: string;
}) {
  // Real, scannable QR encoding the on-site check-in payload — a volunteer's
  // scanner (components/volunteer/checkin-scanner.tsx) reads this and checks in.
  const [qrUrl, setQrUrl] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(`${CHECKIN_PREFIX}${CHECKIN_CODE}`, { margin: 1, width: 360, color: { dark: "#16311f", light: "#ffffff" } })
      .then(setQrUrl)
      .catch(() => {});
  }, []);
  const [code, setCode] = useState(CHECKIN_CODE);
  const [error, setError] = useState<string | null>(null);

  const full = checkedIn >= totalSlots;
  const pct = Math.min(100, Math.round((checkedIn / totalSlots) * 100));

  const query = search.trim().toLowerCase();
  const rows = query
    ? verified.filter((v) => [v.name, v.faculty].some((f) => f.toLowerCase().includes(query)))
    : verified;

  const verify = () => {
    if (code.trim().toUpperCase() !== CHECKIN_CODE) {
      setError("That code doesn’t match this opportunity.");
      return;
    }
    setError(null);
    onScan();
  };

  return (
    <div className={`grid gap-[22px] [grid-template-columns:360px_1fr] max-md:grid-cols-1 ${styles.tabIn}`}>
      <div className={`${cardClass} self-start text-center`}>
        <div className="mb-1 text-[12px] font-semibold text-[#3f4a43]">Scan to verify on-site</div>
        <div className="mb-[18px] text-[11.5px] text-[#69746A]">Maternal &amp; Child Health Drive</div>
        <div className="relative mx-auto h-[206px] w-[206px] rounded-[20px] border border-[#E9EFE6] bg-white p-4 shadow-[0_8px_22px_-12px_rgba(28,61,39,.35)]">
          {!full && (
            <div
              className={`absolute right-4 left-4 z-[2] h-0.5 ${styles.scanline}`}
              style={{ background: "linear-gradient(90deg,transparent,#8FD14F,transparent)" }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qrUrl && <img src={qrUrl} alt="Check-in QR code" width="100%" height="100%" className="h-full w-full object-contain" />}
        </div>
        <div className="mt-4 text-[11px] text-[#69746A]">Or enter code manually</div>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") verify();
            }}
            aria-label="Check-in code"
            aria-invalid={!!error}
            className="flex-1 rounded-[11px] border-[1.5px] bg-[#FBFDFA] p-[11px] text-center font-semibold tracking-[.14em] text-[#23472D] outline-none transition-colors focus:border-[#8FD14F]"
            style={{ borderColor: error ? "#EF5A5A" : "#E2E8DE" }}
          />
          <button
            type="button"
            onClick={verify}
            disabled={full}
            className="cursor-pointer rounded-[11px] bg-[#23472D] px-4 text-[12.5px] font-semibold text-white transition-all hover:bg-[#1a3a26] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Verify
          </button>
        </div>
        {error && <div className={`mt-2 text-[11.5px] font-medium text-[#D2453F] ${styles.fadeUpFast}`}>{error}</div>}
      </div>

      <div className={`${cardClass} flex min-h-0 flex-col`}>
        <div className="mb-[18px] flex items-center justify-between">
          <div>
            <div className="text-[22px] font-semibold" style={{ fontFamily: displayFont }}>
              {checkedIn} <span className="text-base text-[#9aa39c]">/ {totalSlots} checked in</span>
            </div>
            <div className="text-[12px] text-[#69746A]">Verified stamps land on volunteer portfolios instantly</div>
          </div>
          <button
            type="button"
            onClick={onScan}
            disabled={full}
            className="flex shrink-0 cursor-pointer items-center gap-[7px] rounded-xl px-[15px] py-2.5 text-[12.5px] font-semibold text-[#0f2a17] transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)" }}
          >
            {!full && <span className={`h-2 w-2 rounded-full bg-[#0f2a17] ${styles.pulseDot}`} />}
            {full ? "All slots verified" : "Simulate scan"}
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
          {rows.length === 0 && (
            <div className="px-1 py-6 text-center text-[12px] text-[#8a938b]">
              {query ? `No verified volunteer matches “${search}”.` : "No one has checked in yet."}
            </div>
          )}
          {rows.map((v) => (
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
