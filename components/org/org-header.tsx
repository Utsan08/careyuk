import { Bell, Search } from "lucide-react";

import { displayFont } from "./data";

export function OrgHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative z-[1] flex items-center gap-4 border-b border-[#E9EFE6] px-[30px] py-[22px]">
      <div className="min-w-0">
        <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: displayFont }}>
          {title}
        </h1>
        <p className="mt-1 text-[13px] font-medium text-[#8a938b]">{subtitle}</p>
      </div>
      <div className="flex-1" />
      <div className="flex min-w-[230px] items-center gap-2.5 rounded-[13px] border border-[#E9EFE6] bg-white px-[15px] py-2.5 text-[#9aa39c]">
        <Search className="size-4" strokeWidth={2.2} />
        <span className="text-[13px]">Search applicants, tickets…</span>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#E9EFE6] bg-white text-[#23472D]"
      >
        <Bell className="size-[19px]" strokeWidth={2} />
        <span className="absolute top-2.5 right-[11px] h-2 w-2 rounded-full border-[1.5px] border-white bg-[#EF5A5A]" />
      </button>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}
      >
        M
      </div>
    </div>
  );
}
