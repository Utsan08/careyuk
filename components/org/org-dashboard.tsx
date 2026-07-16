"use client";

import { useState } from "react";

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

  // Applicants
  const [appStatus, setAppStatus] = useState<Record<number, Decision>>({});

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
      className="min-h-screen w-full p-5 text-[#202320]"
      style={{
        background: "radial-gradient(900px 500px at 85% 0%,#EAF7E3,transparent 60%),#E7EDE6",
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
      }}
    >
      <div
        className={`flex h-[calc(100vh-40px)] min-h-[700px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_70px_-30px_rgba(28,61,39,.45),0_4px_14px_rgba(28,61,39,.08)] ${styles.shell}`}
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
                onDecide={(id, decision) => setAppStatus((s) => ({ ...s, [id]: decision }))}
              />
            )}

            {tab === "chk" && <CheckinTab checkedIn={checkedIn} verified={verified} onScan={scan} />}
          </div>
        </div>
      </div>
    </div>
  );
}
