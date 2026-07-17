"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DEMO_APPLICANT_ID, useDemoApplications } from "@/lib/demoStore";
import { createOpportunity, decideApplication, getSession, logout, toApiType } from "@/lib/org-api";
import { ApplicantsTab } from "./applicants-tab";
import { CheckinTab } from "./checkin-tab";
import {
  APPLICANTS,
  DEFAULT_FORM,
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
import { PostTab, type OpportunityForm } from "./post-tab";
import { ProgressTab } from "./progress-tab";
import styles from "./org-dashboard.module.css";

const PLACEHOLDER_ORG = "Posyandu Melati";
const SEARCH_PLACEHOLDER: Record<Tab, string> = {
  post: "Search applicants, tickets…",
  appl: "Search applicants…",
  chk: "Search verified volunteers…",
  prog: "Search the pipeline…",
};

/**
 * Org dashboard shell. State lives here because it crosses tabs: the sidebar
 * badge counts undecided applicants, and check-in credits the hours set on the
 * post form.
 *
 * Backend: the org identity comes from /api/auth/session when signed in, and
 * publishing calls POST /api/opportunities. Both degrade to placeholders — see
 * lib/org-api.ts for why (the data routes need SUPABASE_SERVICE_ROLE_KEY).
 */
export function OrgDashboard() {
  const [tab, setTab] = useState<Tab>("post");
  const [search, setSearch] = useState("");

  // Post form
  const [postType, setPostType] = useState("event");
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [slots, setSlots] = useState(TOTAL_SLOTS);
  const [hours, setHours] = useState(4);
  const [faculties, setFaculties] = useState<Record<string, boolean>>(INITIAL_FACULTIES);
  const [form, setForm] = useState<OpportunityForm>(DEFAULT_FORM);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);

  // Session — null until /api/auth/session answers, and stays null when signed out.
  const [orgName, setOrgName] = useState(PLACEHOLDER_ORG);
  const [liveSession, setLiveSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((profile) => {
      if (cancelled || !profile || profile.role !== "org") return;
      setOrgName(profile.full_name || PLACEHOLDER_ORG);
      setLiveSession(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Applicants — Rina (id 1) is the live demo application shared with the volunteer app.
  const [appStatus, setAppStatus] = useState<Record<number, Decision>>({});
  const demo = useDemoApplications();

  // A decision made here wins; otherwise fall back to whatever the shared store holds
  // (a decision from a previous session, or one made in another tab). Derived rather
  // than synced through an effect, which would cascade renders.
  const demoDecision = demo.apps[DEMO_APPLICANT_ID];
  const effectiveStatus = useMemo(() => {
    if ((demoDecision === "accepted" || demoDecision === "rejected") && !appStatus[DEMO_APPLICANT_ID]) {
      return { ...appStatus, [DEMO_APPLICANT_ID]: demoDecision };
    }
    return appStatus;
  }, [appStatus, demoDecision]);

  const decide = (id: number, decision: Decision) => {
    setAppStatus((s) => ({ ...s, [id]: decision }));
    // push the decision back to the volunteer app, but only if Rina actually applied there
    if (id === DEMO_APPLICANT_ID && demo.apps[DEMO_APPLICANT_ID]) demo.setStatus(DEMO_APPLICANT_ID, decision);

    const person = APPLICANTS.find((a) => a.id === id);
    toast.success(`${person?.name ?? "Applicant"} ${decision}`, {
      description:
        decision === "accepted"
          ? "They'll get a notification and a slot on the roster."
          : "They'll be told the slot went to someone else.",
      action: { label: "Undo", onClick: () => undo(id) },
    });

    // Placeholder ids aren't backend application UUIDs, so this only fires for real rows.
    void decideApplication(String(id), decision);
  };

  const undo = (id: number) => {
    setAppStatus((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    if (id === DEMO_APPLICANT_ID && demo.apps[DEMO_APPLICANT_ID]) demo.setStatus(DEMO_APPLICANT_ID, "pending");
  };

  // Check-in
  const [checkedIn, setCheckedIn] = useState(INITIAL_VERIFIED.length);
  const [verified, setVerified] = useState<VerifiedVolunteer[]>(INITIAL_VERIFIED);

  const pendingCount = APPLICANTS.filter((a) => !effectiveStatus[a.id]).length;
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
    if (checkedIn >= slots) {
      toast.info("Every slot is already verified.");
      return false;
    }
    const next = SCAN_POOL[(checkedIn - INITIAL_VERIFIED.length) % SCAN_POOL.length];
    const time = "08:" + String(11 + (checkedIn - 1) * 4).padStart(2, "0");
    setVerified((v) => [
      { id: 1000 + checkedIn, name: next.name, faculty: next.faculty, hours, time, avatar: next.avatar },
      ...v,
    ]);
    setCheckedIn((c) => c + 1);
    toast.success(`${next.name} verified on-site`, { description: `${hours}h credited to their portfolio.` });
    return true;
  };

  const publish = async () => {
    if (!form.title.trim()) {
      toast.error("Give the opportunity a title before publishing.");
      return;
    }
    const openTo = Object.keys(faculties).filter((f) => faculties[f]);
    if (openTo.length === 0) {
      toast.error("Pick at least one role under “Open to”.");
      return;
    }

    setBusy(true);
    const created = await createOpportunity({
      title: form.title.trim(),
      type: toApiType(postType),
      slots_total: slots,
      starts_at: form.when.trim(),
      duration_hours: hours,
      description: form.notes.trim(),
      faculties_wanted: openTo,
      venue_name: form.where.trim(),
    });
    setBusy(false);
    setPublished(true);

    toast.success("Opportunity published", {
      description: created
        ? `Live for volunteers — ${slots} slots, ${hours}h each.`
        : `${slots} slots · ${hours}h · open to ${openTo.length} role${openTo.length > 1 ? "s" : ""}. (Saved locally — backend not connected yet.)`,
    });
  };

  const saveDraft = () => {
    if (!form.title.trim()) {
      toast.error("Give the opportunity a title before saving.");
      return;
    }
    toast.success("Draft saved", {
      description: `“${form.title.trim()}” is stored locally. It won't be visible to volunteers.`,
    });
  };

  const signOut = async () => {
    await logout();
    toast.success("Signed out", { description: "Redirecting to the login screen…" });
    setTimeout(() => {
      window.location.href = "/login";
    }, 700);
  };

  return (
    <div className={`flex h-screen min-h-[700px] overflow-hidden max-md:h-auto max-md:min-h-screen max-md:flex-col max-md:overflow-visible ${styles.shell}`}>
      <OrgSidebar tab={tab} onTabChange={setTab} pendingCount={pendingCount} orgName={orgName} />

      <div ref={mainRef} className="relative flex min-w-0 flex-1 flex-col bg-[#F7FAF5] text-[#202320]">
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(560px circle at 70% 10%,rgba(143,209,79,.2),rgba(143,209,79,.06) 42%,transparent 66%)",
          }}
        />

        <OrgHeader
          title={title}
          subtitle={subtitle}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={SEARCH_PLACEHOLDER[tab]}
          orgName={orgName}
          onSignOut={signOut}
          live={liveSession}
        />

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
              form={form}
              onFormChange={(patch) => {
                setForm((f) => ({ ...f, ...patch }));
                setPublished(false);
              }}
              published={published}
              busy={busy}
              onPublish={publish}
              onSaveDraft={saveDraft}
            />
          )}

          {tab === "appl" && (
            <ApplicantsTab
              appStatus={effectiveStatus}
              onDecide={decide}
              onUndo={undo}
              liveApplied={demo.apps[DEMO_APPLICANT_ID] === "pending"}
              search={search}
              totalSlots={slots}
            />
          )}

          {tab === "chk" && (
            <CheckinTab checkedIn={checkedIn} verified={verified} onScan={scan} totalSlots={slots} search={search} />
          )}

          {tab === "prog" && <ProgressTab search={search} />}
        </div>
      </div>
    </div>
  );
}
