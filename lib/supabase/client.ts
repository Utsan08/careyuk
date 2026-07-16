"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Only used for OAuth redirects (signInWithOAuth) —
 * email/password auth goes through /api/auth/* so the session cookie is set
 * server-side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Is this OAuth provider actually switched on for the project?
 *
 * Worth the extra request: signInWithOAuth doesn't return an error for a
 * disabled provider — it redirects the browser straight to Supabase, which
 * renders a raw JSON error page. Checking first lets us keep the user on our
 * own page with a readable message.
 */
export async function isProviderEnabled(provider: string): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.external?.[provider]);
  } catch {
    return false;
  }
}
