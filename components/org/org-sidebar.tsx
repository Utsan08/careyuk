import Image from "next/image";
import { Building2, LineChart, Plus, QrCode, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { displayFont, SIDEBAR_STATS, type Tab } from "./data";
import styles from "./org-dashboard.module.css";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "post", label: "Post opportunity", icon: Plus },
  { key: "appl", label: "Applicants", icon: Users },
  { key: "chk", label: "Check-in", icon: QrCode },
  { key: "prog", label: "Progress", icon: LineChart },
];

export function OrgSidebar({
  tab,
  onTabChange,
  pendingCount,
  orgName,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  pendingCount: number;
  /** From /api/auth/session when signed in, otherwise the placeholder org. */
  orgName: string;
}) {
  return (
    <div
      className="relative flex w-[264px] shrink-0 flex-col overflow-hidden border-r border-[#EAF7E3]/10 px-5 py-6 text-[#EAF7E3]"
      style={{ background: "linear-gradient(180deg,#2c5e3c 0%,#245030 60%,#1e4429 100%)" }}
    >
      <div
        className={`pointer-events-none absolute -top-14 -right-16 h-[260px] w-[260px] rounded-full opacity-[.22] blur-[20px] ${styles.blob}`}
        style={{ background: "radial-gradient(circle,#8FD14F,transparent 70%)" }}
      />

      <div className={`relative mb-[26px] flex items-center gap-[10px] ${styles.fadeUp}`}>
        <Image
          src="/careyuk-logo.png"
          alt=""
          width={30}
          height={30}
          className="object-contain [filter:brightness(1.4)]"
        />
        <span className="text-[18px] font-semibold text-[#F8F9F7]" style={{ fontFamily: displayFont }}>
          CareYuk
        </span>
        <span className="ml-auto rounded-md border border-[#EAF7E3]/20 px-[7px] py-[3px] text-[9.5px] font-semibold tracking-[.08em] text-[#EAF7E3]/40">
          ORG
        </span>
      </div>

      <div
        className={`relative mb-6 rounded-[18px] border border-[#EAF7E3]/[.12] bg-[#EAF7E3]/[.08] p-4 ${styles.fadeUpDelayed}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] text-[#0f3d1e] shadow-[0_4px_12px_-4px_rgba(0,0,0,.4)]"
            style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}
          >
            <Building2 className="size-[22px]" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14.5px] leading-[1.2] font-semibold text-[#F8F9F7]">{orgName}</div>
            <div className="text-[11px] font-semibold text-[#EAF7E3]/55">RW 04 Cipedak</div>
          </div>
        </div>
        <div className="mt-[13px] inline-flex items-center gap-1.5 rounded-full border border-[#8FD14F]/30 bg-[#8FD14F]/[.16] px-2.5 py-[5px] text-[11px] font-semibold text-[#C9F3B0]">
          <ShieldCheck className="size-[13px]" strokeWidth={2.6} />
          Verified partner
        </div>
      </div>

      <div className="mx-1.5 mb-2.5 text-[10.5px] font-semibold tracking-[.09em] text-[#EAF7E3]/40">MANAGE</div>
      <nav className="flex flex-col gap-[5px]">
        {TABS.map((t) => {
          const active = tab === t.key;
          const badge = t.key === "appl" ? pendingCount : 0;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              aria-current={active ? "page" : undefined}
              className="flex cursor-pointer items-center gap-3 rounded-[13px] px-[14px] py-3 text-left text-[13.5px] font-semibold transition-colors"
              style={{
                background: active ? "rgba(143,209,79,.9)" : "transparent",
                color: active ? "#123" : "rgba(234,247,227,.72)",
              }}
            >
              <Icon className="size-5" strokeWidth={2} />
              {t.label}
              {badge > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-[7px] px-1.5 text-[11px] font-semibold"
                  style={{
                    background: active ? "#183a22" : "rgba(143,209,79,.25)",
                    color: active ? "#8FD14F" : "#C9F3B0",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="relative mt-auto flex flex-col gap-2.5">
        {SIDEBAR_STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#EAF7E3]/10 bg-[#EAF7E3]/[.06] px-[15px] py-[14px]">
            <div className="mb-1 text-[11px] font-medium text-[#EAF7E3]/55">{s.label}</div>
            <div className="text-2xl font-semibold text-[#8FD14F]" style={{ fontFamily: displayFont }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
