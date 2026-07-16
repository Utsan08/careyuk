"use client";

import { useEffect, useState } from "react";

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
    <div
      className="min-h-screen w-full text-[#202320]"
      style={{
        background: "radial-gradient(900px 500px at 85% 0%,#EAF7E3,transparent 60%),#E7EDE6",
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
      }}
    >
      <div
        className={`flex h-screen min-h-[700px] overflow-hidden bg-white ${styles.shell}`}
      >
        <OrgSidebar tab={tab} onTabChange={setTab} pendingCount={pendingCount} />

        <div className="flex min-w-0 flex-1 flex-col bg-[#F7FAF5]">
          <OrgHeader title={title} subtitle={subtitle} />

          <div className="min-h-0 flex-1 overflow-y-auto px-[30px] py-[26px]">
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
          </div>
        </div>
      </div>
    </div>
  );
}
