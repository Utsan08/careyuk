"use client";

import { useEffect, useState } from "react";

/**
 * Demo profile. Signup saves the name / faculty / education / interests here so
 * the dashboard can greet the user by their real name and the Portfolio profile
 * card has something to show — even when the backend keys aren't set and there's
 * no real session. Real profiles (once auth works) take precedence over this.
 */

export type DemoProfile = {
  full_name: string;
  role: "volunteer" | "org";
  faculty: string | null;
  education_level: string | null;
  interests: string[];
  avatar_url: string | null;
};

const KEY = "careyuk.demoProfile.v1";
const EVENT = "careyuk-demoprofile-change";

export function readDemoProfile(): DemoProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoProfile) : null;
  } catch {
    return null;
  }
}

export function saveDemoProfile(p: DemoProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(EVENT));
}

export function useDemoProfile() {
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  useEffect(() => {
    setProfile(readDemoProfile());
    const sync = () => setProfile(readDemoProfile());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return {
    profile,
    save: (p: DemoProfile) => {
      saveDemoProfile(p);
      setProfile(p);
    },
  };
}
