"use client";

import { useEffect, useState } from "react";

/**
 * Demo check-in store. When a volunteer scans an org's on-site QR (or types the
 * code), we record the session here so their verified hours update immediately —
 * no backend needed for the demo. Persists in localStorage and syncs across tabs,
 * same pattern as lib/demoStore.ts.
 *
 * The QR the org shows encodes `CAREYUK-CHECKIN:<code>`; the code that matches the
 * demo event is CYK-4821 (components/org/data.ts → CHECKIN_CODE).
 */

export const CHECKIN_PREFIX = "CAREYUK-CHECKIN:";
export const DEMO_CHECKIN_CODE = "CYK-4821";
export const DEMO_CHECKIN_TITLE = "Maternal & Child Health Drive";
export const DEMO_CHECKIN_HOURS = 4;

const KEY = "careyuk.checkin.v1";
const EVENT = "careyuk-checkin-change";

export type CheckinSession = { code: string; title: string; hours: number; at: number };
type State = { sessions: CheckinSession[] };

function read(): State {
  if (typeof window === "undefined") return { sessions: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

function write(next: State) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

/** Pull the check-in code out of a scanned QR payload, or null if it isn't ours. */
export function parseCheckinCode(raw: string): string | null {
  const text = raw.trim();
  if (text.toUpperCase().startsWith(CHECKIN_PREFIX)) return text.slice(CHECKIN_PREFIX.length).trim().toUpperCase();
  // also accept a bare code typed by hand
  if (/^CYK-\d{3,6}$/i.test(text)) return text.toUpperCase();
  return null;
}

export function useCheckins() {
  const [state, setState] = useState<State>({ sessions: [] });

  useEffect(() => {
    setState(read());
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const verifiedHours = state.sessions.reduce((sum, s) => sum + s.hours, 0);

  const record = (session: CheckinSession) => {
    const next = { sessions: [session, ...read().sessions] };
    setState(next);
    write(next);
  };

  return { sessions: state.sessions, verifiedHours, record };
}
