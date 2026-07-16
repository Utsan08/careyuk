"use client";

import { useEffect, useRef, useState } from "react";

import { DEMO_APPLICANT_ID, useDemoApplications } from "@/lib/demoStore";
import { ApplicantsTab } from "./applicants-tab";
import { CheckinTab } from "./checkin-tab";
import {
  APPLICANTS,
  HEADERS,
  INITIAL_FACULTIES,
  INITIAL_VERIFIED,
  SCAN_POOL,
  TOTAL_SLOTS,
  type Decision,
  type Tab,
  type VerifiedVolunteer,
} from "./data";
import { OrgHeader } from "./org-header";
import { OrgSidebar } from "./org-sidebar";
import { PostTab } from "./post-tab";
import { ProgressTab } from "./progress-tab";
import styles from "./org-dashboard.module.css";

/**
 * Org dashboard shell. State lives here because it crosses tabs: the sidebar
 * badge counts undecided applicants, and check-in credits the hours set on the
 * post form.
 */
export function OrgDashboard() {
  const [tab, setTab] = useState<Tab>("post");

  // Post form
  const [postType, setPostType] = useState("event");
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [slots, setSlots] = useState(TOTAL_SLOTS);
  const [hours, setHours] = useState(4);
  const [faculties, setFaculties] = useState<Record<string, boolean>>(INITIAL_FACULTIES);
  const [published, setPublished] = useState(false);

  // Applicants — Rina (id 1) is the live demo application shared with the volunteer app.
  const [appStatus, setAppStatus] = useState<Record<number, Decision>>({});
  const demo = useDemoApplications();

  // Restore/sync the org's decision on Rina from the shared store (survives reloads,
  // and reflects a decision made in another tab).
  useEffect(() => {
    const st = demo.apps[DEMO_APPLICANT_ID];
    if (st === "accepted" || st === "rejected") {
      setAppStatus((s) => (s[DEMO_APPLICANT_ID] ? s : { ...s, [DEMO_APPLICANT_ID]: st }));
    }
  }, [demo.apps]);

  const decide = (id: number, decision: Decision) => {
    setAppStatus((s) => ({ ...s, [id]: decision }));
    // push the decision back to the volunteer app, but only if Rina actually applied there
    if (id === DEMO_APPLICANT_ID && demo.apps[DEMO_APPLICANT_ID]) demo.setStatus(DEMO_APPLICANT_ID, decision);
  };

  // Check-in
  const [checkedIn, setCheckedIn] = useState(INITIAL_VERIFIED.length);
  const [verified, setVerified] = useState<VerifiedVolunteer[]>(INITIAL_VERIFIED);

  const pendingCount = APPLICANTS.filter((a) => !appStatus[a.id]).length;
  const [title, subtitle] = HEADERS[tab];

  // Green glow that trails the cursor across the main pane. Driven straight through
  // the DOM node on an rAF lerp — putting the position in state would re-render the
  // whole dashboard on every mousemove.
  const mainRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    const glow = glowRef.current;
    if (!el || !glow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = el.getBoundingClientRect();
    let gx = start.width * 0.7;
    let gy = start.height * 0.1;
    let tx = gx;
    let ty = gy;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const tick = () => {
      gx += (tx - gx) * 0.045;
      gy += (ty - gy) * 0.045;
      glow.style.background = `radial-gradient(560px circle at ${gx}px ${gy}px, rgba(143,209,79,.24), rgba(143,209,79,.07) 42%, transparent 66%)`;
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const addCustomType = (type: string) => {
    setCustomTypes((types) => (types.includes(type) ? types : [...types, type]));
    setPostType(type);
  };

  const scan = () => {
    if (checkedIn >= TOTAL_SLOTS) return;
    const next = SCAN_POOL[(checkedIn - INITIAL_VERIFIED.length) % SCAN_POOL.length];
    const time = "08:" + String(11 + (checkedIn - 1) * 4).padStart(2, "0");
    setVerified((v) => [
      { id: 1000 + checkedIn, name: next.name, faculty: next.faculty, hours, time, avatar: next.avatar },
      ...v,
    ]);
    setCheckedIn((c) => c + 1);
  };

  return (
    <div className={`flex h-screen min-h-[700px] overflow-hidden ${styles.shell}`}>
      <OrgSidebar tab={tab} onTabChange={setTab} pendingCount={pendingCount} />

      <div ref={mainRef} className="relative flex min-w-0 flex-1 flex-col bg-[#F7FAF5] text-[#202320]">
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(560px circle at 70% 10%,rgba(143,209,79,.2),rgba(143,209,79,.06) 42%,transparent 66%)",
          }}
        />

        <OrgHeader title={title} subtitle={subtitle} />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-[30px] py-[26px]">
          {tab === "post" && (
            <PostTab
              postType={postType}
              onPostTypeChange={setPostType}
              customTypes={customTypes}
              onAddCustomType={addCustomType}
              slots={slots}
              onSlotsChange={setSlots}
              hours={hours}
              onHoursChange={setHours}
              faculties={faculties}
              onToggleFaculty={(f) => setFaculties((s) => ({ ...s, [f]: !s[f] }))}
              onAddFaculty={(f) => setFaculties((s) => ({ ...s, [f]: true }))}
              published={published}
              onPublish={() => setPublished(true)}
            />
          )}

          {tab === "appl" && (
            <ApplicantsTab
              appStatus={appStatus}
              onDecide={decide}
              liveApplied={demo.apps[DEMO_APPLICANT_ID] === "pending"}
            />
          )}

          {tab === "chk" && <CheckinTab checkedIn={checkedIn} verified={verified} onScan={scan} />}

          {tab === "prog" && <ProgressTab />}
        </div>
      </div>
    </div>
  );
}
