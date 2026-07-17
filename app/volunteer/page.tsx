"use client";

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useDemoApplications, type AppStatus } from "@/lib/demoStore";
import { useCheckins } from "@/lib/checkin";
import { useDemoProfile } from "@/lib/demoProfile";
import { ProfileCard } from "@/components/volunteer/profile-card";
import { CheckinScanner } from "@/components/volunteer/checkin-scanner";
import { PortfolioTimeline } from "@/components/volunteer/portfolio-timeline";
import { WelcomeTour } from "@/components/volunteer/welcome-tour";

function statusMeta(st?: AppStatus) {
  if (st === "accepted") return { t: "ACCEPTED", bg: "#E6F4E6", c: "#2C7A43" };
  if (st === "rejected") return { t: "NOT SELECTED", bg: "#F3E3E3", c: "#B0554F" };
  return { t: "PENDING", bg: "#FFF4D6", c: "#B7791F" };
}

/**
 * CareYuk — Volunteer Explore  ·  app/volunteer/page.tsx
 *
 * Real map: Leaflet + CARTO Positron (light_all) tiles — clean light basemap, no API key.
 *   npm i leaflet   (types: npm i -D @types/leaflet)
 *   Add to app/globals.css:  @import "leaflet/dist/leaflet.css";
 * Leaflet loads via dynamic import inside useEffect (never runs during SSR).
 *
 * Layout: full-board map; a curved (clip-path) sidebar floats over it on the left so the
 * cream background extends right up to the organic separator; overlays sit in .cyRightUI.
 * Data is placeholder shaped to the API contract (GET /api/opportunities?volunteerId=X).
 */

type Opp = {
  id: number; title: string; org: string; typeKey: "event" | "clinic" | "shadow"; zone: string;
  distance: number; when: string; soon: number; hours: number; slots: string; match: number;
  priority: boolean; emoji: string; lat: number; lng: number; reason: string;
  avatar: string; pinBg: string; tag: string; tagBg: string; tagColor: string;
};

const OPPS: Opp[] = [
  { id: 1, title: "Maternal & Child Health Drive", org: "Posyandu Melati", typeKey: "event", zone: "RW 04 Cipedak", distance: 2.3, when: "Sat 19 Jul", soon: 3, hours: 4, slots: "3 of 8 slots", match: 92, priority: true, emoji: "🤰", lat: -6.3252, lng: 106.8085, reason: "Great fit — matches your maternal & child interest, and this zone has the lowest community health score nearby.", avatar: "#F6C9D6", pinBg: "#EF5A5A", tag: "PRIORITY", tagBg: "#FDECEC", tagColor: "#D2453F" },
  { id: 2, title: "Clinic Assistance — Vitals & Intake", org: "Klinik Sehat Jagakarsa", typeKey: "clinic", zone: "RW 02 Jagakarsa", distance: 3.1, when: "Sun 20 Jul", soon: 4, hours: 5, slots: "5 of 10 slots", match: 85, priority: false, emoji: "🩺", lat: -6.3358, lng: 106.8262, reason: "Matches your clinic help preference and is close to home. Good for building hands-on hours.", avatar: "#C9F3B0", pinBg: "#8FD14F", tag: "CLINIC HELP", tagBg: "#EAF7E3", tagColor: "#3DA35D" },
  { id: 3, title: "Cardiology Ward Shadowing", org: "RS Fatmawati", typeKey: "shadow", zone: "Cilandak", distance: 5.6, when: "Tue 22 Jul", soon: 6, hours: 6, slots: "2 of 4 slots", match: 78, priority: false, emoji: "❤️", lat: -6.2935, lng: 106.7972, reason: "Shadowing role — recommended as you progress toward med-student eligibility.", avatar: "#BFE0FF", pinBg: "#EAF7E3", tag: "SHADOWING", tagBg: "#EAF2F7", tagColor: "#2f6d9e" },
  { id: 4, title: "Elderly Care & Blood Pressure Camp", org: "Posyandu Lansia Srengseng", typeKey: "event", zone: "RW 09 Srengseng", distance: 4.2, when: "Sat 26 Jul", soon: 10, hours: 4, slots: "6 of 12 slots", match: 88, priority: true, emoji: "🧓", lat: -6.3521, lng: 106.8331, reason: "Priority zone with high elderly need — 3 elderly sessions unlock your Elderly Care badge.", avatar: "#FFE3B0", pinBg: "#EF5A5A", tag: "PRIORITY", tagBg: "#FDECEC", tagColor: "#D2453F" },
  { id: 5, title: "Community Nutrition Screening", org: "Depok Community Clinic", typeKey: "clinic", zone: "Depok", distance: 6.0, when: "Wed 23 Jul", soon: 7, hours: 5, slots: "4 of 8 slots", match: 74, priority: false, emoji: "🥗", lat: -6.3835, lng: 106.8221, reason: "Nutrition screening near Depok — matches your nutrition interest.", avatar: "#D8F0C4", pinBg: "#8FD14F", tag: "CLINIC HELP", tagBg: "#EAF7E3", tagColor: "#3DA35D" },
];

const disp = "var(--font-display,'Geist','Inter',sans-serif)";
const CIRC = 2 * Math.PI * 27;
const TYPE_CHIPS = [{ key: "all", label: "All" }, { key: "event", label: "Events" }, { key: "clinic", label: "Clinic" }, { key: "shadow", label: "Shadowing" }] as const;
const SORT_CHIPS = [{ key: "match", label: "Best match" }, { key: "near", label: "Nearest" }, { key: "soon", label: "Soonest" }] as const;
const NAVS = [{ key: "explore", label: "Explore" }, { key: "applications", label: "Applications" }, { key: "portfolio", label: "Portfolio" }] as const;
type NavKey = (typeof NAVS)[number]["key"];

// Community-health education tracker shown in the left sidebar: each zone the
// volunteers educate climbs its Community Health Score toward "graduated".
const ZONES = [
  { zone: "RW 04 Cipedak", status: "IN PROGRESS", score: 42, sessions: 3, color: "#EF5A5A", pillBg: "#FDECEC", pillColor: "#D2453F" },
  { zone: "RW 09 Srengseng", status: "GRADUATING", score: 58, sessions: 5, color: "#E8A33C", pillBg: "#FBEFD8", pillColor: "#B7791F" },
  { zone: "RW 02 Jagakarsa", status: "GRADUATED", score: 74, sessions: 8, color: "#3DA35D", pillBg: "#E6F4E6", pillColor: "#2C7A43" },
];
const FUNNEL = [{ n: 24, l: "Flagged citizens" }, { n: 9, l: "In training" }, { n: 5, l: "Certified volunteers" }];
const RELAY = [
  { emoji: "🌱", t: "Gains verified hours" },
  { emoji: "🤝", t: "Becomes confident, mentors others" },
  { emoji: "💚", t: "Community grows healthier" },
];

// Shared enter/exit for popovers & panels so every click reveals content smoothly
// (soft rise + scale) instead of snapping in.
const EASE = [0.2, 0.8, 0.2, 1] as const;
const pop = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.96 },
  transition: { duration: 0.18, ease: EASE },
};

function pinHtml(o: Opp, sel: boolean) {
  const s = sel ? 58 : 46;
  return `<div style="transform:translateY(${sel ? -4 : 0}px);transition:transform .2s">
    <div style="position:relative;width:${s}px;height:${s}px;border-radius:50%;padding:2.5px;background:${o.pinBg};box-shadow:0 6px 18px rgba(0,0,0,.4)${sel ? ";outline:3px solid #8FD14F;outline-offset:2px" : ""}">
      <div style="width:100%;height:100%;border-radius:50%;background:${o.avatar};display:flex;align-items:center;justify-content:center;font-size:${sel ? 22 : 18}px">${o.emoji}</div>
    </div>
    <div style="position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);padding:3px 9px;border-radius:999px;background:#111d15;color:#8FD14F;font-size:10.5px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.35)">${o.hours}h</div>
  </div>`;
}

export default function VolunteerExplorePage() {
  const router = useRouter();
  const { apps, apply, withdraw } = useDemoApplications();
  const { verifiedHours: checkedInHours } = useCheckins();
  const { profile: demoProfile } = useDemoProfile();
  const displayName = demoProfile?.full_name?.trim() || "";
  const firstName = displayName ? displayName.split(/\s+/)[0] : "there";
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : "🙂";
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(1);
  const [view, setView] = useState<"map" | "list">("map");
  const [openMenu, setOpenMenu] = useState<null | "filter" | "bell" | "gear" | "profile">(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("match");
  const [query, setQuery] = useState("");
  const [nav, setNav] = useState<NavKey>("explore");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markers = useRef<Record<number, any>>({});
  const LRef = useRef<any>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trailDots = useRef<HTMLSpanElement[]>([]);

  const q = query.trim().toLowerCase();
  const included = (o: Opp) =>
    (filterType === "all" || o.typeKey === filterType) &&
    (!priorityOnly || o.priority) &&
    (q === "" || `${o.title} ${o.org} ${o.zone} ${o.tag}`.toLowerCase().includes(q));

  const sel = useMemo(() => OPPS.find((o) => o.id === selectedId) ?? OPPS[0], [selectedId]);
  const selStatus = apps[sel.id];
  const matchOffset = (CIRC * (1 - sel.match / 100)).toFixed(1);
  const applyLabel =
    selStatus === "accepted" ? "🎉 Accepted — you're in!" :
    selStatus === "pending" ? "✓ Applied — pending review" :
    selStatus === "rejected" ? "Not selected — tap to try again" :
    "Apply to this opportunity  →";
  const onApplyClick = () => {
    if (selStatus === "accepted") return;
    if (selStatus) withdraw(sel.id); else apply(sel.id);
  };
  const list = useMemo(() => {
    const arr = OPPS.filter(included);
    arr.sort((a, b) => (sortBy === "near" ? a.distance - b.distance : sortBy === "soon" ? a.soon - b.soon : b.match - a.match));
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, priorityOnly, sortBy, q]);
  const filterCount = (filterType !== "all" ? 1 : 0) + (priorityOnly ? 1 : 0);
  const appliedList = OPPS.filter((o) => apps[o.id]);
  const appliedCount = appliedList.length;
  const portfolioHours = appliedList.reduce((sum, o) => sum + o.hours, 0);

  // trailing cursor glow (transform transition gives the lag/follow feel)
  useEffect(() => {
    const el = sidebarRef.current, glow = glowRef.current;
    if (!el || !glow) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top + el.scrollTop;
      glow.style.transform = `translate(${x - 380}px, ${y - 380}px)`;
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  // tiny balls that trail the cursor across the map — each dot eases toward the
  // one ahead of it, so the chain lags a beat behind the pointer.
  useEffect(() => {
    const board = boardRef.current;
    const dots = trailDots.current;
    if (!board || !dots.length) return;
    const pos = dots.map(() => ({ x: -100, y: -100 }));
    const target = { x: -100, y: -100 };
    let inside = false;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = board.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      inside = true;
    };
    const onLeave = () => { inside = false; };
    const tick = () => {
      let leadX = target.x, leadY = target.y;
      for (let i = 0; i < dots.length; i++) {
        const p = pos[i];
        p.x += (leadX - p.x) * 0.18;
        p.y += (leadY - p.y) * 0.18;
        dots[i].style.transform = `translate(${p.x}px, ${p.y}px)`;
        dots[i].style.opacity = inside ? String(0.85 - (i / dots.length) * 0.7) : "0";
        leadX = p.x; leadY = p.y;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    board.addEventListener("mousemove", onMove);
    board.addEventListener("mouseleave", onLeave);
    return () => { cancelAnimationFrame(raf); board.removeEventListener("mousemove", onMove); board.removeEventListener("mouseleave", onLeave); };
  }, []);

  // init Leaflet map (client only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true }).setView([-6.335, 106.815], 13);
      // CARTO Positron — light, clean basemap; free, no API key. Colored opportunity
      // pins render on top as divIcon markers. If Positron looks too pale under the
      // pins, swap light_all → rastertiles/voyager for CARTO Voyager.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(map);
      mapRef.current = map;
      OPPS.filter((d) => d.priority).forEach((d) =>
        L.circle([d.lat, d.lng], { radius: 680, color: "#EF5A5A", weight: 1.5, dashArray: "5 7", fillColor: "#EF5A5A", fillOpacity: 0.12 }).addTo(map));
      L.circleMarker([-6.335, 106.818], { radius: 7, color: "#fff", weight: 3, fillColor: "#57b8ff", fillOpacity: 1 }).addTo(map);
      OPPS.forEach((o) => {
        const m = L.marker([o.lat, o.lng], { icon: L.divIcon({ html: pinHtml(o, o.id === selectedId), className: "cy-pin", iconSize: [46, 46], iconAnchor: [23, 23] }), riseOnHover: true });
        m.on("click", () => setSelectedId(o.id));
        markers.current[o.id] = m;
      });
      syncMarkers();
      // keep pins in the visible area to the right of the curved sidebar
      const bw = mapEl.current.clientWidth || 1200;
      const bounds = L.latLngBounds(OPPS.map((d) => [d.lat, d.lng] as [number, number]));
      setTimeout(() => { map.invalidateSize(); map.fitBounds(bounds, { paddingTopLeft: [Math.round(bw * 0.46), 140], paddingBottomRight: [60, 230] }); }, 260);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMarkers = () => {
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;
    OPPS.forEach((o) => {
      const m = markers.current[o.id]; if (!m) return;
      const s = o.id === selectedId ? 58 : 46;
      m.setIcon(L.divIcon({ html: pinHtml(o, o.id === selectedId), className: "cy-pin", iconSize: [s, s], iconAnchor: [s / 2, s / 2] }));
      if (included(o)) m.addTo(map); else map.removeLayer(m);
    });
  };

  useEffect(() => {
    syncMarkers();
    const o = OPPS.find((d) => d.id === selectedId);
    if (o && mapRef.current) mapRef.current.panInside([o.lat, o.lng], { padding: [70, 70] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, filterType, priorityOnly, q]);

  // close any open popover on a click/tap outside of it (or its trigger)
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".cy-menu") && !t.closest(".cy-menu-trigger")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  useEffect(() => { if (view === "map" && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 90); }, [view]);

  const isList = view === "list";
  // Light frosted glass for controls floating over the Positron map: airy and
  // translucent, but backdrop-blur keeps it legible. Text runs dark for contrast.
  const glass = "border border-white/50 bg-white/30 backdrop-blur-md";

  return (
    <div className="min-h-screen w-full" style={{ background: "radial-gradient(900px 500px at 15% 0%,#EAF7E3,transparent 60%),#E7EDE6" }}>
      {/* First-run walkthrough — shows on ?tour=1 after signup, once per browser. */}
      <Suspense fallback={null}>
        <WelcomeTour />
      </Suspense>

      {/* clip path for the organic sidebar edge (scales to element) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="cySideCurve" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L0.93,0 C0.965,0.16 0.97,0.36 0.97,0.52 C0.97,0.68 0.965,0.86 0.905,1 L0,1 Z">
              <animate attributeName="d" dur="9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                values="M0,0 L0.93,0 C0.965,0.16 0.97,0.36 0.97,0.52 C0.97,0.68 0.965,0.86 0.905,1 L0,1 Z;M0,0 L0.915,0 C0.975,0.15 0.985,0.35 0.985,0.5 C0.985,0.66 0.965,0.88 0.915,1 L0,1 Z;M0,0 L0.93,0 C0.965,0.16 0.97,0.36 0.97,0.52 C0.97,0.68 0.965,0.86 0.905,1 L0,1 Z" />
            </path>
          </clipPath>
        </defs>
      </svg>

      <div ref={boardRef} className="board relative h-screen min-h-[680px] overflow-hidden bg-[#132a1b]"
           style={{ boxShadow: "0 30px 70px -30px rgba(28,61,39,.45),0 4px 14px rgba(28,61,39,.08)", animation: "fadeIn .5s ease both" }}>

        {/* ===== MAP LAYER ===== */}
        <div ref={mapEl} className="absolute inset-0 z-[1]" />
        <div className="pointer-events-none absolute inset-0 z-[2]" style={{ background: "radial-gradient(700px 500px at 66% 45%,transparent,rgba(9,22,14,.45))" }} />

        {/* ===== CURSOR TRAIL (tiny balls that lag behind the pointer) ===== */}
        <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              ref={(el) => { if (el) trailDots.current[i] = el; }}
              className="absolute left-0 top-0 rounded-full will-change-transform"
              style={{
                width: 13 - i * 1.5,
                height: 13 - i * 1.5,
                marginLeft: -(6.5 - i * 0.75),
                marginTop: -(6.5 - i * 0.75),
                opacity: 0,
                background: "radial-gradient(circle, rgba(143,209,79,.95), rgba(61,163,93,.55))",
                boxShadow: "0 0 10px rgba(143,209,79,.55)",
                transition: "opacity .3s ease",
              }}
            />
          ))}
        </div>

        {/* ===== RIGHT UI ===== */}
        <div className="cyRightUI pointer-events-none absolute bottom-0 right-0 top-0 z-10" style={{ left: "calc(44% + 10px)" }}>
          {/* top controls */}
          <div className="pointer-events-auto absolute left-[14px] right-6 top-[22px] flex items-center gap-2.5" style={{ animation: "fadeUp .5s ease both .1s" }}>
            {/* search */}
            <div className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] px-4 py-[11px] transition-shadow focus-within:shadow-[0_0_0_3px_rgba(143,209,79,.35)] ${glass}`}>
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opportunities, orgs, skills…"
                className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-[#1c3d27] outline-none placeholder:text-[#1c3d27]/55"
              />
              <AnimatePresence>
                {query && (
                  <motion.button key="clr" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}
                    onClick={() => setQuery("")} aria-label="Clear search"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1c3d27]/10 text-[10px] font-bold text-[#1c3d27]/70 hover:bg-[#1c3d27]/20">✕</motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* notifications */}
            <div className="relative shrink-0">
              <button onClick={() => setOpenMenu((m) => (m === "bell" ? null : "bell"))} className={`cy-menu-trigger relative flex h-11 w-11 items-center justify-center rounded-[14px] text-[#23472D] transition-transform active:scale-95 ${glass}`}>
                <span style={{ animation: "bellShake 6s ease-in-out infinite", transformOrigin: "50% 20%" }}><BellIcon /></span>
                <span className="absolute right-[10px] top-[9px] h-[9px] w-[9px] rounded-full border-[1.5px] border-white bg-[#EF5A5A]" />
              </button>
              <AnimatePresence>
                {openMenu === "bell" && (
                  <motion.div {...pop} className="cy-menu absolute right-0 top-[52px] z-[30] w-[272px] origin-top-right rounded-[18px] border border-white/70 bg-white/85 p-3 backdrop-blur-xl" style={{ boxShadow: "0 20px 48px -18px rgba(28,61,39,.5)" }}>
                    <div className="mb-1.5 px-1 text-[11.5px] font-extrabold uppercase tracking-[.04em] text-[#69746A]">Notifications</div>
                    {[
                      { t: "Posyandu Melati accepted your application", s: "2h ago", c: "#8FD14F" },
                      { t: "New priority drive near RW 04 Cipedak", s: "5h ago", c: "#EF5A5A" },
                      { t: "You earned the Community Care badge", s: "1d ago", c: "#3DA35D" },
                    ].map((n, i) => (
                      <div key={i} className="flex cursor-pointer gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#EAF7E3]/70">
                        <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ background: n.c }} />
                        <div><div className="text-[12.5px] font-semibold leading-[1.3] text-[#23472D]">{n.t}</div><div className="text-[11px] text-[#69746A]">{n.s}</div></div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* filters */}
            <div className="relative shrink-0">
              <button onClick={() => setOpenMenu((m) => (m === "filter" ? null : "filter"))} className={`cy-menu-trigger relative flex h-11 items-center gap-2 rounded-[14px] px-[15px] text-[13px] font-bold text-[#23472D] transition-transform active:scale-95 ${glass}`}>
                <FilterIcon /> Filters
                {filterCount > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-[#8FD14F] px-[5px] text-[10.5px] font-extrabold text-[#183a22]">{filterCount}</span>}
              </button>
              <AnimatePresence>
                {openMenu === "filter" && (
                  <motion.div {...pop} className="cy-menu absolute right-0 top-[52px] z-[30] w-[264px] origin-top-right rounded-[20px] border border-white/[.12] bg-[rgba(20,42,27,.9)] p-[18px] backdrop-blur-xl" style={{ boxShadow: "0 20px 48px -18px rgba(0,0,0,.6)" }}>
                    <div className="mb-[9px] text-[11px] font-extrabold uppercase tracking-[.05em] text-[#EAF7E3]/50">Type</div>
                    <div className="mb-4 flex flex-wrap gap-[7px]">
                      {TYPE_CHIPS.map((c) => (
                        <span key={c.key} onClick={() => setFilterType(c.key)} className="cursor-pointer rounded-[10px] px-3 py-[7px] text-xs font-bold transition-all" style={{ background: filterType === c.key ? "#8FD14F" : "rgba(255,255,255,.08)", color: filterType === c.key ? "#183a22" : "#EAF7E3" }}>{c.label}</span>
                      ))}
                    </div>
                    <div className="mb-[9px] text-[11px] font-extrabold uppercase tracking-[.05em] text-[#EAF7E3]/50">Sort by</div>
                    <div className="mb-4 flex gap-[7px]">
                      {SORT_CHIPS.map((c) => (
                        <span key={c.key} onClick={() => setSortBy(c.key)} className="flex-1 cursor-pointer rounded-[10px] px-1.5 py-[7px] text-center text-[11.5px] font-bold transition-all" style={{ background: sortBy === c.key ? "#8FD14F" : "rgba(255,255,255,.08)", color: sortBy === c.key ? "#183a22" : "#EAF7E3" }}>{c.label}</span>
                      ))}
                    </div>
                    <div onClick={() => setPriorityOnly((v) => !v)} className="flex cursor-pointer items-center justify-between rounded-xl bg-white/[.06] px-[13px] py-[11px]">
                      <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#EAF7E3]"><TargetIcon color="#EF7A7A" /> Priority zones only</div>
                      <div className="w-[38px] rounded-full p-[2px] transition-colors" style={{ background: priorityOnly ? "#8FD14F" : "rgba(255,255,255,.18)" }}>
                        <div className="h-[18px] w-[18px] rounded-full bg-white transition-transform" style={{ transform: priorityOnly ? "translateX(16px)" : "translateX(0)" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* on-site check-in */}
            <button onClick={() => setScanOpen(true)} className={`flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-[15px] text-[13px] font-bold text-[#23472D] transition-transform active:scale-95 ${glass}`}>
              <QrIcon /> Check in
            </button>

            {/* settings */}
            <div className="relative shrink-0">
              <button onClick={() => setOpenMenu((m) => (m === "gear" ? null : "gear"))} className={`cy-menu-trigger flex h-11 w-11 items-center justify-center rounded-[14px] text-[#23472D] transition-transform active:scale-95 ${glass}`}><GearIcon /></button>
              <AnimatePresence>
                {openMenu === "gear" && (
                  <motion.div {...pop} className="cy-menu absolute right-0 top-[52px] z-[30] w-[214px] origin-top-right rounded-[18px] border border-white/70 bg-white/85 p-2 backdrop-blur-xl" style={{ boxShadow: "0 20px 48px -18px rgba(28,61,39,.5)" }}>
                    {["Account settings", "Notification preferences", "Availability", "Help & support"].map((it) => (
                      <div key={it} className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold text-[#23472D] transition-colors hover:bg-[#EAF7E3]/70">{it}</div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* profile */}
            <div className="relative shrink-0">
              <button onClick={() => setOpenMenu((m) => (m === "profile" ? null : "profile"))} className="cy-menu-trigger flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/50 text-[15px] font-extrabold text-white shadow-[0_3px_10px_-3px_rgba(0,0,0,.4)] transition-transform active:scale-95" style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}>{avatarInitial}</button>
              <AnimatePresence>
                {openMenu === "profile" && (
                  <motion.div {...pop} className="cy-menu absolute right-0 top-[52px] z-[30] w-[212px] origin-top-right rounded-[18px] border border-white/70 bg-white/90 p-2 backdrop-blur-xl" style={{ boxShadow: "0 20px 48px -18px rgba(28,61,39,.5)" }}>
                    <div className="mb-1 flex items-center gap-2.5 px-2 py-1.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}>{avatarInitial}</span>
                      <div><div className="text-[13px] font-bold text-[#23472D]">{displayName || "Your profile"}</div><div className="text-[11px] text-[#69746A]">Volunteer</div></div>
                    </div>
                    <div className="my-1 h-px bg-[#23472D]/10" />
                    <div className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold text-[#23472D] transition-colors hover:bg-[#EAF7E3]/70" onClick={() => { setOpenMenu(null); setNav("portfolio"); }}>View profile</div>
                    <div className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold text-[#23472D] transition-colors hover:bg-[#EAF7E3]/70" onClick={() => { setOpenMenu(null); setNav("applications"); }}>My applications</div>
                    <div className="cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold text-[#D2453F] transition-colors hover:bg-[#FDECEC]" onClick={() => router.push("/login")}>Sign out</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* map/list toggle */}
          <div className="pointer-events-auto absolute left-[14px] top-[78px] flex rounded-xl border border-white/50 bg-white/30 p-1 backdrop-blur-md" style={{ animation: "fadeUp .5s ease both .2s" }}>
            <span onClick={() => setView("map")} className="flex cursor-pointer items-center gap-1.5 rounded-[9px] px-[13px] py-1.5 text-xs font-extrabold transition-all" style={{ background: !isList ? "#8FD14F" : "transparent", color: !isList ? "#183a22" : "rgba(28,61,39,.7)" }}><MapIcon /> Map</span>
            <span onClick={() => setView("list")} className="flex cursor-pointer items-center gap-1.5 rounded-[9px] px-[13px] py-1.5 text-xs font-extrabold transition-all" style={{ background: isList ? "#8FD14F" : "transparent", color: isList ? "#183a22" : "rgba(28,61,39,.7)" }}><ListIcon /> List</span>
          </div>

          {!isList && (
            <>
              <div className="pointer-events-none absolute left-[14px] top-[132px] whitespace-nowrap rounded-full bg-[rgba(239,90,90,.92)] px-3 py-[5px] text-[10.5px] font-extrabold text-white shadow-[0_6px_16px_rgba(239,90,90,.4)]">◎ Priority zone · RW 04 Cipedak</div>
              <div className="pointer-events-auto absolute bottom-[210px] right-6 flex flex-col overflow-hidden rounded-xl border border-white/50 bg-white/30 backdrop-blur-md">
                <span onClick={() => mapRef.current?.zoomIn()} className="cursor-pointer border-b border-black/10 px-[13px] py-[9px] text-[18px] font-semibold text-[#23472D]">+</span>
                <span onClick={() => mapRef.current?.zoomOut()} className="cursor-pointer px-[13px] py-[9px] text-[18px] font-semibold text-[#23472D]">−</span>
              </div>
              {/* carousel */}
              <div className="pointer-events-auto absolute bottom-5 left-[14px] right-6">
                <div className="flex gap-[13px] overflow-x-auto pb-1.5" style={{ scrollSnapType: "x mandatory" }}>
                  {list.map((o) => (
                    <div key={o.id} onClick={() => setSelectedId(o.id)} className="shrink-0 basis-[236px] cursor-pointer rounded-[18px] border-2 bg-white/[.97] p-[15px] backdrop-blur transition-transform duration-200 hover:-translate-y-1"
                      style={{ scrollSnapAlign: "start", borderColor: o.id === selectedId ? "#8FD14F" : "transparent", boxShadow: "0 12px 26px -12px rgba(0,0,0,.5)" }}>
                      <div className="mb-[9px] flex items-center justify-between gap-2">
                        <span className="rounded-lg px-[9px] py-1 text-[10px] font-extrabold" style={{ background: o.tagBg, color: o.tagColor }}>{o.tag}</span>
                        <span className="text-[11px] font-extrabold text-[#3DA35D]">{o.match}% match</span>
                      </div>
                      <div className="mb-[5px] text-sm font-bold leading-[1.2] tracking-[-.01em]">{o.title}</div>
                      <div className="mb-[11px] text-[11.5px] font-semibold text-[#69746A]">{o.org}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#69746A]">📍 {o.distance} km · ⏱ {o.hours}h</span>
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#23472D] text-sm text-white">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* list view */}
          {isList && (
            <div className="pointer-events-auto absolute bottom-5 left-[14px] right-6 top-[134px] overflow-y-auto pr-1">
              {list.map((o) => (
                <div key={o.id} onClick={() => setSelectedId(o.id)} className="mb-[11px] flex cursor-pointer items-center gap-[14px] rounded-[18px] border-2 bg-white/[.97] px-4 py-[15px] transition-transform duration-200 hover:translate-x-[3px]"
                  style={{ borderColor: o.id === selectedId ? "#8FD14F" : "transparent", boxShadow: "0 10px 22px -14px rgba(0,0,0,.55)" }}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[22px]" style={{ background: o.avatar }}>{o.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-[3px] flex items-center gap-2">
                      <span className="rounded-[7px] px-2 py-[3px] text-[9.5px] font-extrabold" style={{ background: o.tagBg, color: o.tagColor }}>{o.tag}</span>
                      <span className="text-[11px] font-extrabold text-[#3DA35D]">{o.match}% match</span>
                    </div>
                    <div className="text-[14.5px] font-bold leading-[1.2] tracking-[-.01em]">{o.title}</div>
                    <div className="mt-0.5 text-[11.5px] font-semibold text-[#69746A]">{o.org} · {o.zone} · 📍 {o.distance} km · ⏱ {o.hours}h · {o.when}</div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#23472D] text-base text-white">→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== LEFT SIDEBAR (curved clip, over map) ===== */}
        <div ref={sidebarRef} className="cySidebar absolute bottom-0 left-0 top-0 z-20 w-[44%] overflow-y-auto overflow-x-hidden bg-[#EFF5EB]" style={{ clipPath: "url(#cySideCurve)", direction: "rtl" }}>
          <div ref={glowRef} className="pointer-events-none absolute left-0 top-0 z-0 h-[760px] w-[760px] rounded-full" style={{ background: "radial-gradient(circle,rgba(143,209,79,.5),rgba(143,209,79,.12) 42%,transparent 66%)", transition: "transform .42s cubic-bezier(.22,.61,.36,1)", transform: "translate(-260px,-260px)" }} />
          <div className="pointer-events-none absolute -left-10 -top-16 z-0 h-[300px] w-[300px] rounded-full opacity-40 blur-[24px]" style={{ background: "radial-gradient(circle,#8FD14F,transparent 68%)", animation: "blobMove 26s ease-in-out infinite" }} />
          <div className="pointer-events-none absolute -right-8 bottom-16 z-0 h-[320px] w-[320px] rounded-full opacity-[.32] blur-[28px]" style={{ background: "radial-gradient(circle,#3DA35D,transparent 68%)", animation: "blobMove 34s ease-in-out infinite reverse" }} />

          <div className="cyScroll relative z-[2] flex flex-col gap-[19px] py-6 pl-[30px] pr-[74px]" style={{ direction: "ltr" }}>

          {/* topbar (nav wraps below logo when tight) */}
          <div className="relative z-[2] flex flex-wrap items-center justify-between gap-3" style={{ animation: "fadeUp .5s ease both" }}>
            <Link href="/about" className="flex cursor-pointer items-center gap-[11px]" aria-label="About CareYuk">
              <Image src="/careyuk-logo.png" alt="CareYuk" width={46} height={46} className="object-contain" />
              <span className="text-[22px] font-bold tracking-[-.02em]" style={{ fontFamily: disp }}>CareYuk</span>
            </Link>
            <nav className="flex shrink-0 gap-[2px] rounded-[11px] border border-white/60 bg-white/50 p-[3px] backdrop-blur">
              {NAVS.map((nv) => (
                <button key={nv.key} onClick={() => setNav(nv.key)} className="relative rounded-lg px-[10px] py-1.5 text-[11.5px] font-bold transition-colors" style={{ color: nav === nv.key ? "#fff" : "#516155" }}>
                  {nav === nv.key && <motion.span layoutId="navPill" className="absolute inset-0 rounded-lg bg-[#23472D]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative z-[1]">{nv.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* greeting */}
          <div className="relative z-[2]">
            <div className="mb-[5px] flex items-center gap-1.5 text-[13px] font-semibold text-[#69746A]" style={{ animation: "greetUp .6s ease both .05s" }}>
              Good morning, {firstName} <span className="inline-block origin-[70%_80%]" style={{ animation: "wave 3s ease-in-out infinite .8s" }}>👋</span>
            </div>
            <h1 className="text-[29px] font-bold leading-[1.12] tracking-[-.03em] [text-wrap:balance]"
              style={{ fontFamily: disp, background: "linear-gradient(90deg,#1c3d27 0%,#3DA35D 35%,#8FD14F 55%,#1c3d27 90%)", backgroundSize: "220% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", animation: "sheen 7s linear infinite,greetUp .6s ease both .12s" }}>
              Let&apos;s find where you&apos;re needed today.
            </h1>
          </div>

          {/* content switches by nav tab, sliding between Explore / Applications / Portfolio */}
          <AnimatePresence mode="wait" initial={false}>
            {nav === "explore" && (
              <motion.div key="explore" className="relative z-[2] flex flex-col gap-[19px]"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.26, ease: EASE }}>

                {/* bento — each tile filters the map by type */}
                <div className="grid grid-cols-3 gap-[11px]">
                  {[
                    { type: "event", n: "12", label: "Events near you", iconBg: "rgba(143,209,79,.24)", iconColor: "#3f9e46", icon: <CalendarIcon /> },
                    { type: "clinic", n: "8", label: "Clinic help", iconBg: "rgba(35,71,45,.14)", iconColor: "#23472D", icon: <StethIcon /> },
                    { type: "shadow", n: "5", label: "Shadowing", iconBg: "rgba(47,109,158,.16)", iconColor: "#2f6d9e", icon: <EyeIcon /> },
                  ].map((t) => (
                    <BentoTile key={t.type} n={t.n} label={t.label} icon={t.icon} iconBg={t.iconBg} iconColor={t.iconColor}
                      active={filterType === t.type} onClick={() => setFilterType((ft) => (ft === t.type ? "all" : t.type))} />
                  ))}
                </div>

                {/* applied strip */}
                <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-[13px] backdrop-blur">
                  <div className="flex items-center">
                    {["#8FD14F", "#C9F3B0", "#3DA35D"].map((c, i) => <span key={i} className="h-[30px] w-[30px] rounded-full border-2 border-white" style={{ background: c, marginLeft: i ? -9 : 0 }} />)}
                  </div>
                  <div className="flex-1 leading-[1.3]">
                    <div className="text-[13.5px] font-bold">You&apos;ve applied to {appliedCount} {appliedCount === 1 ? "opportunity" : "opportunities"}</div>
                    <div className="text-[11.5px] text-[#69746A]">{appliedCount === 0 ? "Tap Apply on an opportunity to get started" : `${appliedCount} pending review`}</div>
                  </div>
                  <button onClick={() => setNav("applications")} className="cursor-pointer text-xs font-bold text-[#3DA35D] transition-colors hover:text-[#23472D]">View →</button>
                </div>

                {/* selected opportunity */}
                <div className="text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Selected opportunity</div>
                <div className="rounded-[22px] border border-white/80 bg-white/[.72] p-5 backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)" }}>
                  {sel.priority && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-[11px] py-[5px] text-[11px] font-extrabold text-[#D2453F]"><TargetIcon /> Needs volunteers most</div>
                  )}
                  <div className="flex justify-between gap-[14px]">
                    <div className="min-w-0">
                      <h3 className="text-[19px] font-bold leading-[1.15] tracking-[-.02em]" style={{ fontFamily: disp }}>{sel.title}</h3>
                      <div className="mt-[5px] flex items-center gap-[7px] text-[12.5px] font-semibold text-[#69746A]">
                        <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-[#E0F0D2] text-[#3f9e46]"><HospitalIcon /></span>
                        {sel.org} · {sel.zone}
                      </div>
                    </div>
                    <div className="relative h-16 w-16 shrink-0">
                      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="32" cy="32" r="27" fill="none" stroke="#E7EEE2" strokeWidth="7" />
                        <circle key={sel.id} cx="32" cy="32" r="27" fill="none" stroke="#8FD14F" strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={matchOffset} style={{ ["--circ" as string]: `${CIRC}`, animation: "ringGrow 1s cubic-bezier(.4,0,.2,1) both" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold leading-none" style={{ fontFamily: disp }}>{sel.match}%</span>
                        <span className="text-[8.5px] font-bold tracking-[.03em] text-[#69746A]">MATCH</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-1 mt-[14px] flex flex-wrap gap-[7px]">
                    <Chip icon={<PinIcon />}>{sel.distance} km</Chip>
                    <Chip icon={<CalendarIcon sm />}>{sel.when}</Chip>
                    <Chip icon={<ClockIcon />}>{sel.hours}h verified</Chip>
                    <Chip icon={<UsersIcon />}>{sel.slots}</Chip>
                  </div>
                  <p className="mb-4 mt-2.5 text-[12.5px] leading-[1.55] text-[#69746A]">{sel.reason}</p>
                  <motion.button whileTap={{ scale: selStatus === "accepted" ? 1 : 0.97 }} onClick={onApplyClick}
                    className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] py-[14px] text-[14.5px] font-bold transition-[background,box-shadow,transform] duration-200 hover:-translate-y-0.5"
                    style={{
                      color: selStatus === "rejected" ? "#B0554F" : selStatus ? "#23472D" : "#0f2a17",
                      background: selStatus === "rejected" ? "#F3E3E3" : selStatus === "accepted" ? "linear-gradient(120deg,#EAF7E3,#CDEBB6)" : selStatus ? "#EAF7E3" : "linear-gradient(120deg,#8FD14F,#3DA35D)",
                      boxShadow: selStatus ? "none" : "0 10px 24px -8px rgba(143,209,79,.7)",
                    }}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={selStatus ?? "apply"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        {applyLabel}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>

                {/* PROGRESS — community health education tracker */}
                <div className="mt-1 text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Progress</div>

                {ZONES.map((z) => (
                  <div key={z.zone} className="rounded-[18px] border border-white/70 bg-white/60 p-4 backdrop-blur" style={{ boxShadow: "0 12px 30px -20px rgba(28,61,39,.4)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14.5px] font-bold" style={{ fontFamily: disp }}>{z.zone}</div>
                      <span className="shrink-0 rounded-full px-[9px] py-[3px] text-[10px] font-extrabold tracking-[.02em]" style={{ background: z.pillBg, color: z.pillColor }}>{z.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7EEE2]">
                        <motion.div className="h-full rounded-full" style={{ background: z.color }} initial={{ width: 0 }} animate={{ width: `${z.score}%` }} transition={{ duration: 0.9, ease: EASE }} />
                      </div>
                      <span className="text-[15px] font-bold tabular-nums" style={{ fontFamily: disp, color: z.color }}>{z.score}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#69746A]">Community Health Score · {z.sessions} sessions run</div>
                  </div>
                ))}

                {/* citizen → certified funnel */}
                <div className="rounded-[20px] border border-white/70 bg-white/60 p-4 backdrop-blur" style={{ boxShadow: "0 12px 30px -20px rgba(28,61,39,.4)" }}>
                  <div className="text-[15px] font-bold" style={{ fontFamily: disp }}>Citizen → Certified volunteer</div>
                  <div className="mt-0.5 text-[11.5px] leading-[1.45] text-[#69746A]">Volunteers growing into certified community health workers</div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {FUNNEL.map((f, i) => (
                      <Fragment key={f.l}>
                        <div className="flex-1 rounded-[14px] px-2 py-3 text-center" style={{ background: i === 2 ? "linear-gradient(135deg,#8FD14F,#3DA35D)" : "rgba(255,255,255,.75)", border: i === 2 ? "none" : "1px solid rgba(35,71,45,.08)", boxShadow: i === 2 ? "0 10px 22px -10px rgba(143,209,79,.7)" : "none" }}>
                          <div className="text-[24px] font-bold leading-none" style={{ fontFamily: disp, color: i === 2 ? "#fff" : "#1c3d27" }}>{f.n}</div>
                          <div className="mt-1 text-[10px] font-semibold leading-[1.2]" style={{ color: i === 2 ? "rgba(255,255,255,.92)" : "#54604f" }}>{f.l}</div>
                        </div>
                        {i < 2 && <span className="shrink-0 text-[#9aa39c]">→</span>}
                      </Fragment>
                    ))}
                  </div>
                </div>

                {/* relay effect */}
                <div className="rounded-[20px] p-5" style={{ background: "linear-gradient(135deg,#245536,#173a24)" }}>
                  <div className="text-[15px] font-bold text-[#F8F9F7]" style={{ fontFamily: disp }}>The relay effect</div>
                  <div className="mt-0.5 text-[11.5px] text-[#EAF7E3]/60">Every verified volunteer strengthens the next</div>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {RELAY.map((r, i) => (
                      <motion.div key={r.t} className="flex items-center gap-2.5" style={{ marginLeft: i * 22 }}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE, delay: 0.1 + i * 0.12 }}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px]" style={{ background: "rgba(143,209,79,.22)" }}>{r.emoji}</span>
                        <span className="text-[12.5px] font-semibold text-[#EAF7E3]">{r.t}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {nav === "applications" && (
              <motion.div key="applications" className="relative z-[2] flex flex-col gap-[13px]"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.26, ease: EASE }}>
                <div className="text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Your applications</div>
                {appliedList.length === 0 ? (
                  <div className="rounded-[22px] border border-white/80 bg-white/[.72] p-7 text-center backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)" }}>
                    <div className="mb-2 text-[34px]">🌱</div>
                    <div className="text-[15px] font-bold text-[#23472D]">No applications yet</div>
                    <div className="mx-auto mt-1 max-w-[240px] text-[12.5px] leading-[1.5] text-[#69746A]">Apply to an opportunity from Explore and it&apos;ll show up here.</div>
                    <button onClick={() => setNav("explore")} className="mt-4 rounded-[12px] px-4 py-2.5 text-[13px] font-bold text-[#0f2a17] transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: "0 10px 24px -8px rgba(143,209,79,.7)" }}>Browse opportunities →</button>
                  </div>
                ) : (
                  appliedList.map((o) => {
                    const m = statusMeta(apps[o.id]);
                    return (
                      <motion.div key={o.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: EASE }}
                        className="rounded-[18px] border border-white/80 bg-white/[.78] p-4 backdrop-blur" style={{ boxShadow: "0 12px 30px -18px rgba(28,61,39,.5)" }}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[20px]" style={{ background: o.avatar }}>{o.emoji}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-bold leading-[1.2] tracking-[-.01em]">{o.title}</div>
                            <div className="mt-0.5 text-[11.5px] font-semibold text-[#69746A]">{o.org} · {o.when} · ⏱ {o.hours}h</div>
                          </div>
                          <span className="shrink-0 rounded-full px-[9px] py-[3px] text-[10px] font-extrabold" style={{ background: m.bg, color: m.c }}>{m.t}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setSelectedId(o.id); setNav("explore"); }} className="flex-1 rounded-[11px] bg-[#23472D] py-2 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5">View on map</button>
                          <button onClick={() => withdraw(o.id)} className="rounded-[11px] border border-[#E2E8DE] px-3 py-2 text-[12px] font-bold text-[#69746A] transition-colors hover:bg-[#FDECEC] hover:text-[#D2453F]">Withdraw</button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {nav === "portfolio" && (
              <motion.div key="portfolio" className="relative z-[2] flex flex-col gap-[15px]"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.26, ease: EASE }}>
                <div className="text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Your profile</div>
                <ProfileCard />
                <div className="mt-1 text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Care portfolio</div>
                <div className="rounded-[22px] border border-white/80 bg-white/[.72] p-5 backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)" }}>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { n: String(portfolioHours + checkedInHours), l: "Verified hours" },
                      { n: String(appliedCount), l: "Applications" },
                      { n: appliedCount >= 3 ? "3" : String(appliedCount), l: "Badges" },
                    ].map((st) => (
                      <div key={st.l}>
                        <div className="text-[26px] font-bold leading-none text-[#1c3d27]" style={{ fontFamily: disp }}>{st.n}</div>
                        <div className="mt-1 text-[11px] font-semibold text-[#54604f]">{st.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#E7EEE2]">
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#8FD14F,#3DA35D)" }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(100, portfolioHours * 8)}%` }} transition={{ duration: 0.8, ease: EASE }} />
                  </div>
                  <div className="mt-2 text-[11.5px] text-[#69746A]">{portfolioHours === 0 ? "Apply to opportunities to start logging verified hours." : `${Math.max(0, 25 - portfolioHours)}h to your next milestone.`}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["🩺 Clinic Helper", "🤰 Maternal Care", "🌱 First Steps"].map((b, i) => (
                    <span key={b} className="rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[11.5px] font-bold text-[#3f4a43] backdrop-blur" style={{ opacity: appliedCount > i ? 1 : 0.45 }}>{b}</span>
                  ))}
                </div>

                <PortfolioTimeline />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>

      {/* mobile-only floating check-in (the top controls are hidden on phones) */}
      <button onClick={() => setScanOpen(true)} aria-label="Check in"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_12px_28px_-8px_rgba(28,61,39,.6)] transition-transform active:scale-95 md:hidden"
        style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}>
        <QrIcon />
      </button>

      <CheckinScanner open={scanOpen} onClose={() => setScanOpen(false)} />

      <style jsx global>{`
        .leaflet-container{background:#eaeff0;font-family:inherit}
        .leaflet-div-icon{background:transparent;border:none}
        /* sidebar scrolls with its slider on the left (direction:rtl), kept slim so it never crowds the curved right edge */
        .cySidebar{scrollbar-width:thin;scrollbar-color:rgba(35,71,45,.28) transparent}
        .cySidebar::-webkit-scrollbar{width:8px}
        .cySidebar::-webkit-scrollbar-track{background:transparent}
        .cySidebar::-webkit-scrollbar-thumb{background:rgba(35,71,45,.24);border-radius:8px}
        .cySidebar::-webkit-scrollbar-thumb:hover{background:rgba(35,71,45,.4)}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
        @keyframes bellShake{0%,92%,100%{transform:rotate(0)}94%{transform:rotate(12deg)}96%{transform:rotate(-10deg)}98%{transform:rotate(7deg)}}
        @keyframes ringGrow{from{stroke-dashoffset:var(--circ)}}
        @keyframes blobMove{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.2)}66%{transform:translate(-40px,50px) scale(.9)}}
        @keyframes sheen{0%{background-position:0% 50%}100%{background-position:220% 50%}}
        @keyframes wave{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(16deg)}80%{transform:rotate(-8deg)}90%{transform:rotate(12deg)}}
        @keyframes greetUp{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
        @media (max-width:1100px){
          .cySidebar{clip-path:none !important;width:46% !important;border-right:1px solid #dfe8db}
          .cyScroll{padding-right:24px !important}
          .cyRightUI{left:46% !important}
        }
        /* phones: the curved sidebar becomes the full-width app; the map/overlays
           step aside and a floating button carries the on-site QR check-in. */
        @media (max-width:767px){
          .board{height:100dvh !important;min-height:100dvh !important}
          .cySidebar{width:100% !important;clip-path:none !important;direction:ltr !important;border-right:none}
          .cyScroll{padding-left:18px !important;padding-right:18px !important;direction:ltr !important}
          .cyRightUI{display:none !important}
        }
      `}</style>
    </div>
  );
}

/* ---------- presentational ---------- */
function BentoTile({ n, label, icon, iconBg, iconColor, active, onClick }: { n: string; label: string; icon: React.ReactNode; iconBg: string; iconColor: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="cursor-pointer rounded-[18px] border bg-white/40 p-[15px_13px] text-left backdrop-blur-md transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] active:scale-[.98]"
      style={{ borderColor: active ? "#8FD14F" : "rgba(255,255,255,.65)", boxShadow: active ? "0 10px 22px -10px rgba(143,209,79,.7)" : "0 8px 20px -12px rgba(28,61,39,.4)" }}>
      <div className="mb-[15px] flex h-[34px] w-[34px] items-center justify-center rounded-[11px]" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="text-2xl font-bold leading-none text-[#1c3d27]" style={{ fontFamily: disp }}>{n}</div>
      <div className="text-[11.5px] font-semibold text-[#54604f]">{label}</div>
    </button>
  );
}
function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-[5px] rounded-[9px] bg-[#EEF3EC] px-[11px] py-1.5 text-[11.5px] font-bold text-[#3f4a43]">{icon}{children}</span>;
}

/* ---------- icons ---------- */
const s = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const CalendarIcon = ({ sm }: { sm?: boolean }) => <svg width={sm ? 12 : 18} height={sm ? 12 : 18} viewBox="0 0 24 24" {...s}><rect x="3" y="4.5" width="18" height="17" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>;
const StethIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M6 3v6a5 5 0 0 0 10 0V3" /><path d="M6 3H4M16 3h2" /><path d="M11 14v2a5 5 0 0 0 10 0v-1" /><circle cx="21" cy="11" r="2" /></svg>;
const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
const HospitalIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" {...s}><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01" /></svg>;
const PinIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" {...s}><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const UsersIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" {...s}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c3d27" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 opacity-70"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
const BellIcon = () => <svg width="19" height="19" viewBox="0 0 24 24" {...s}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
const FilterIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" {...s}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
const GearIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const MapIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16" /></svg>;
const QrIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 17v4" /></svg>;
const ListIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
const TargetIcon = ({ color }: { color?: string }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></svg>;
