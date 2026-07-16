"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, LogOut, Search, Settings, User, X } from "lucide-react";

import { displayFont, NOTIFICATIONS } from "./data";
import styles from "./org-dashboard.module.css";

export function OrgHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder,
  orgName,
  onSignOut,
  live,
}: {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  orgName: string;
  onSignOut: () => void;
  /** True when a real session is backing the org identity. */
  live: boolean;
}) {
  const [openMenu, setOpenMenu] = useState<"none" | "bell" | "account">("none");
  const [readIds, setReadIds] = useState<number[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close either dropdown on outside click or Escape.
  useEffect(() => {
    if (openMenu === "none") return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenMenu("none");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu("none");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const unread = NOTIFICATIONS.filter((n) => !readIds.includes(n.id)).length;
  const initial = (orgName.trim()[0] ?? "M").toUpperCase();

  return (
    <div ref={wrapRef} className="relative z-[2] flex items-center gap-4 border-b border-[#E9EFE6] px-[30px] py-[22px]">
      <div className="min-w-0">
        <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-.028em]" style={{ fontFamily: displayFont }}>
          {title}
        </h1>
        <p className="mt-1 text-[13px] font-medium text-[#8a938b]">{subtitle}</p>
      </div>
      <div className="flex-1" />

      <label className="group flex min-w-[230px] items-center gap-2.5 rounded-[13px] border border-[#E9EFE6] bg-white px-[15px] py-2.5 text-[#9aa39c] transition-all focus-within:border-[#8FD14F] focus-within:shadow-[0_0_0_4px_rgba(143,209,79,.16)]">
        <Search className="size-4 shrink-0 transition-colors group-focus-within:text-[#3DA35D]" strokeWidth={2.2} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full bg-transparent text-[13px] text-[#202320] outline-none placeholder:text-[#9aa39c]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="shrink-0 cursor-pointer rounded-full p-0.5 text-[#9aa39c] transition-colors hover:bg-[#EEF3EC] hover:text-[#23472D]"
          >
            <X className="size-3.5" strokeWidth={2.6} />
          </button>
        )}
      </label>

      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={openMenu === "bell"}
        onClick={() => setOpenMenu((m) => (m === "bell" ? "none" : "bell"))}
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-[13px] border border-[#E9EFE6] bg-white text-[#23472D] transition-all hover:border-[#C4D3BC] hover:bg-[#F7FAF5] active:scale-95"
      >
        <Bell className="size-[19px]" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute top-2.5 right-[11px] h-2 w-2 rounded-full border-[1.5px] border-white bg-[#EF5A5A]" />
        )}
      </button>

      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={openMenu === "account"}
        onClick={() => setOpenMenu((m) => (m === "account" ? "none" : "account"))}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-semibold text-white transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}
      >
        {initial}
      </button>

      {openMenu === "bell" && (
        <div
          className={`absolute top-[76px] right-[74px] z-10 w-[320px] overflow-hidden rounded-[18px] border border-[#E9EFE6] bg-white shadow-[0_24px_48px_-20px_rgba(28,61,39,.45)] ${styles.dropIn}`}
        >
          <div className="flex items-center justify-between border-b border-[#EEF3EC] px-4 py-3">
            <span className="text-[13px] font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => setReadIds(NOTIFICATIONS.map((n) => n.id))}
                className="cursor-pointer text-[11.5px] font-semibold text-[#3DA35D] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {NOTIFICATIONS.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setReadIds((ids) => (ids.includes(n.id) ? ids : [...ids, n.id]))}
                  className="flex w-full cursor-pointer items-start gap-3 border-b border-[#F3F6F1] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#FAFCF8]"
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full transition-colors"
                    style={{ background: isRead ? "#DDE5DA" : "#8FD14F" }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-[#202320]">{n.title}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-[#69746A]">{n.body}</span>
                    <span className="mt-1 block text-[10.5px] font-medium text-[#9aa39c]">{n.time}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openMenu === "account" && (
        <div
          className={`absolute top-[76px] right-[30px] z-10 w-[240px] overflow-hidden rounded-[18px] border border-[#E9EFE6] bg-white shadow-[0_24px_48px_-20px_rgba(28,61,39,.45)] ${styles.dropIn}`}
        >
          <div className="flex items-center gap-3 border-b border-[#EEF3EC] px-4 py-3.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{orgName}</div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#69746A]">
                {live ? (
                  <>
                    <Check className="size-3 text-[#3DA35D]" strokeWidth={3} />
                    Signed in
                  </>
                ) : (
                  "Demo session"
                )}
              </div>
            </div>
          </div>
          <MenuItem icon={User} label="Organisation profile" />
          <MenuItem icon={Settings} label="Settings" />
          <button
            type="button"
            onClick={() => {
              setOpenMenu("none");
              onSignOut();
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 border-t border-[#EEF3EC] px-4 py-3 text-left text-[12.5px] font-semibold text-[#D2453F] transition-colors hover:bg-[#FDECEC]"
          >
            <LogOut className="size-4" strokeWidth={2.2} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-[12.5px] font-semibold text-[#3f4a43] transition-colors hover:bg-[#FAFCF8]"
    >
      <Icon className="size-4 text-[#69746A]" strokeWidth={2.2} />
      {label}
    </button>
  );
}
