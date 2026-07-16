"use client";

import { useEffect, useState } from "react";

/**
 * Tiny client-only store that lets the volunteer and org pages share one
 * application for the demo. State lives in localStorage so it survives reloads
 * and syncs across tabs (open /volunteer/explore in one tab, /org in another).
 *
 * The wired application is Rina → opportunity #1 ("Maternal & Child Health
 * Drive"), which is org applicant id 1. Swap this for real API calls later:
 *   POST /api/applications, PATCH /api/applications/:id.
 */

export type AppStatus = "pending" | "accepted" | "rejected";

const KEY = "careyuk.demo.v1";
const EVENT = "careyuk-demo-change";

/** Volunteer opportunity id ⇄ org applicant id for the one linked demo application. */
export const DEMO_OPP_ID = 1;
export const DEMO_APPLICANT_ID = 1;

type State = Record<number, AppStatus>;

function read(): State {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : {};
  } catch {
    return {};
  }
}

function write(next: State) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  // notify listeners in this same tab (the native "storage" event only fires in other tabs)
  window.dispatchEvent(new Event(EVENT));
}

export function useDemoApplications() {
  // Start empty so server and first client render match; hydrate in the effect.
  const [apps, setApps] = useState<State>({});

  useEffect(() => {
    setApps(read());
    const sync = () => setApps(read());
    window.addEventListener(EVENT, sync); // same tab
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const apply = (oppId: number) => {
    const next = { ...read(), [oppId]: "pending" as AppStatus };
    setApps(next);
    write(next);
  };

  const withdraw = (oppId: number) => {
    const next = { ...read() };
    delete next[oppId];
    setApps(next);
    write(next);
  };

  const setStatus = (oppId: number, status: AppStatus) => {
    const next = { ...read(), [oppId]: status };
    setApps(next);
    write(next);
  };

  return { apps, apply, withdraw, setStatus };
}
