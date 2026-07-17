"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { EDUCATION_OPTIONS, FACULTY_LABELS, FACULTY_OPTIONS, INTEREST_OPTIONS } from "@/lib/profile-options";
import { readDemoProfile, saveDemoProfile } from "@/lib/demoProfile";

const disp = "var(--font-display,'Geist','Inter',sans-serif)";

type Profile = {
  id: string;
  full_name: string;
  role: "volunteer" | "org";
  faculty: string | null;
  interests: string[];
  education_level: string | null;
  avatar_url: string | null;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "🙂";
}

/**
 * Editable volunteer profile shown in the Portfolio tab: profile picture,
 * education level, faculty and interests. Saves to PATCH /api/profile; avatar
 * uploads go straight to the public `avatars` bucket under avatars/{uid}/…
 * (owner-only per the bucket RLS). Falls back to a friendly note when the
 * viewer isn't signed in (the demo map is browsable without auth).
 */
export function ProfileCard() {
  const [state, setState] = useState<"loading" | "ready" | "anon">("loading");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [education, setEducation] = useState<string | null>(null);
  const [faculty, setFaculty] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uid = useRef<string>("");
  const demoMode = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then(async (r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((p: Profile) => {
        if (cancelled) return;
        uid.current = p.id;
        setName(p.full_name ?? "");
        setAvatarUrl(p.avatar_url ?? null);
        setEducation(p.education_level ?? null);
        setFaculty(p.faculty ?? null);
        setInterests(p.interests ?? []);
        setState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        // No live session — fall back to the profile captured at signup.
        const dp = readDemoProfile();
        if (dp) {
          demoMode.current = true;
          setName(dp.full_name ?? "");
          setAvatarUrl(dp.avatar_url ?? null);
          setEducation(dp.education_level ?? null);
          setFaculty(dp.faculty ?? null);
          setInterests(dp.interests ?? []);
          setState("ready");
        } else {
          setState("anon");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const toggleInterest = (value: string) =>
    setInterests((list) => (list.includes(value) ? list.filter((i) => i !== value) : [...list, value]));

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    // Demo mode (no session/bucket): just show a local preview.
    if (demoMode.current || !uid.current) {
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(file);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${uid.current}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch {
      setError("Couldn’t upload that image. Make sure the avatars bucket exists.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    // Demo mode: persist locally so the greeting + card stay in sync.
    if (demoMode.current || !uid.current) {
      saveDemoProfile({ full_name: name, role: "volunteer", faculty, education_level: education, interests, avatar_url: avatarUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faculty, interests, education_level: education, avatar_url: avatarUrl }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("Couldn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return <div className="h-[120px] animate-pulse rounded-[22px] border border-white/70 bg-white/50" />;
  }

  if (state === "anon") {
    return (
      <div className="rounded-[22px] border border-white/80 bg-white/[.72] p-6 text-center backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)" }}>
        <div className="mb-2 text-[30px]">👤</div>
        <div className="text-[15px] font-bold text-[#23472D]" style={{ fontFamily: disp }}>Sign in to edit your profile</div>
        <div className="mx-auto mt-1 max-w-[240px] text-[12.5px] leading-[1.5] text-[#69746A]">Your picture, interests and education level live here once you&apos;re signed in.</div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/80 bg-white/[.72] p-5 backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)" }}>
      {/* avatar + name */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-white text-[20px] font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(28,61,39,.5)]"
            style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#23472D] text-[12px] text-white transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
            {uploading ? "…" : "📷"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-transparent text-[18px] font-bold leading-tight tracking-[-.01em] text-[#1c3d27] outline-none placeholder:text-[#9aa39c]"
            style={{ fontFamily: disp }}
          />
          <div className="text-[12px] font-semibold text-[#69746A]">Volunteer · tap the camera to add a photo</div>
        </div>
      </div>

      {/* education level */}
      <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[.05em] text-[#69746A]">Education level</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {EDUCATION_OPTIONS.map((o) => {
          const on = education === o.value;
          return (
            <button key={o.value} onClick={() => setEducation(o.value)}
              className="flex items-center gap-2 rounded-[12px] border-[1.5px] px-3 py-2 text-left transition-all active:scale-[.98]"
              style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff" }}>
              <span className="text-[16px] leading-none">{o.icon}</span>
              <span className="text-[12.5px] font-semibold" style={{ color: on ? "#23472D" : "#516155" }}>{o.label}</span>
            </button>
          );
        })}
      </div>

      {/* faculty */}
      <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[.05em] text-[#69746A]">Field of study</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FACULTY_OPTIONS.map((f) => {
          const on = faculty === f;
          return (
            <button key={f} onClick={() => setFaculty(f)}
              className="rounded-[10px] border-[1.5px] px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
              style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff", color: on ? "#23472D" : "#516155" }}>
              {FACULTY_LABELS[f]}
            </button>
          );
        })}
      </div>

      {/* interests */}
      <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[.05em] text-[#69746A]">Interests</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {INTEREST_OPTIONS.map((o) => {
          const on = interests.includes(o.value);
          return (
            <button key={o.value} onClick={() => toggleInterest(o.value)}
              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
              style={{ borderColor: on ? "#8FD14F" : "#E2E8DE", background: on ? "#EAF7E3" : "#fff", color: on ? "#23472D" : "#516155" }}>
              <span>{o.icon}</span> {o.label}
            </button>
          );
        })}
      </div>

      {error && <div className="mt-3 rounded-xl border border-[#EF5A5A]/30 bg-[#FDECEC] px-3 py-2 text-[12px] font-medium text-[#D2453F]">{error}</div>}

      <button onClick={save} disabled={saving}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] py-[13px] text-[14px] font-bold text-[#0f2a17] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
        style={{ background: saved ? "linear-gradient(120deg,#EAF7E3,#CDEBB6)" : "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: saved ? "none" : "0 10px 24px -8px rgba(143,209,79,.7)", color: saved ? "#23472D" : "#0f2a17" }}>
        {saved ? "✓ Saved" : saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
