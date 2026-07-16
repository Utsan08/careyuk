"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

/**
 * CareYuk — Volunteer Explore  ·  app/volunteer/explore/page.tsx
 *
 * Real map: Leaflet + CARTO dark tiles, green-tinted via CSS on .leaflet-tile-pane.
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

const disp = "var(--font-display,'Bricolage Grotesque',sans-serif)";
const CIRC = 2 * Math.PI * 27;
const TYPE_CHIPS = [{ key: "all", label: "All" }, { key: "event", label: "Events" }, { key: "clinic", label: "Clinic" }, { key: "shadow", label: "Shadowing" }] as const;
const SORT_CHIPS = [{ key: "match", label: "Best match" }, { key: "near", label: "Nearest" }, { key: "soon", label: "Soonest" }] as const;

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
  const [selectedId, setSelectedId] = useState(1);
  const [applied, setApplied] = useState<Record<number, boolean>>({});
  const [view, setView] = useState<"map" | "list">("map");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("match");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markers = useRef<Record<number, any>>({});
  const LRef = useRef<any>(null);

  const included = (o: Opp) => (filterType === "all" || o.typeKey === filterType) && (!priorityOnly || o.priority);

  const sel = useMemo(() => OPPS.find((o) => o.id === selectedId) ?? OPPS[0], [selectedId]);
  const isApplied = !!applied[sel.id];
  const matchOffset = (CIRC * (1 - sel.match / 100)).toFixed(1);
  const list = useMemo(() => {
    const arr = OPPS.filter(included);
    arr.sort((a, b) => (sortBy === "near" ? a.distance - b.distance : sortBy === "soon" ? a.soon - b.soon : b.match - a.match));
    return arr;
  }, [filterType, priorityOnly, sortBy]);
  const filterCount = (filterType !== "all" ? 1 : 0) + (priorityOnly ? 1 : 0);

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

  // init Leaflet map (client only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true }).setView([-6.335, 106.815], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(map);
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
  }, [selectedId, filterType, priorityOnly]);

  useEffect(() => { if (view === "map" && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 90); }, [view]);

  const isList = view === "list";
  const glass = "border border-white/[.16] bg-white/[.14] backdrop-blur-md";

  return (
    <div className="min-h-screen w-full p-5" style={{ background: "radial-gradient(900px 500px at 15% 0%,#EAF7E3,transparent 60%),#E7EDE6" }}>
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

      <div className="board relative h-[calc(100vh-40px)] min-h-[680px] overflow-hidden rounded-[30px] bg-[#132a1b]"
           style={{ boxShadow: "0 30px 70px -30px rgba(28,61,39,.45),0 4px 14px rgba(28,61,39,.08)", animation: "fadeIn .5s ease both" }}>

        {/* ===== MAP LAYER ===== */}
        <div ref={mapEl} className="absolute inset-0 z-[1]" />
        <div className="pointer-events-none absolute inset-0 z-[2]" style={{ background: "radial-gradient(700px 500px at 66% 45%,transparent,rgba(9,22,14,.45))" }} />

        {/* ===== RIGHT UI ===== */}
        <div className="cyRightUI pointer-events-none absolute bottom-0 right-0 top-0 z-10" style={{ left: "calc(44% + 10px)" }}>
          {/* top controls */}
          <div className="pointer-events-auto absolute left-[14px] right-6 top-[22px] flex items-center gap-2.5" style={{ animation: "fadeUp .5s ease both .1s" }}>
            <div className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] px-4 py-[11px] ${glass}`}>
              <SearchIcon />
              <span className="truncate text-[13.5px] font-medium text-[#EAF7E3]/55">Search opportunities, orgs, skills…</span>
            </div>
            <button className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[#EAF7E3] ${glass}`}>
              <span style={{ animation: "bellShake 6s ease-in-out infinite", transformOrigin: "50% 20%" }}><BellIcon /></span>
              <span className="absolute right-[10px] top-[9px] h-[9px] w-[9px] rounded-full border-[1.5px] border-[#1a3623] bg-[#EF5A5A]" />
            </button>
            <button onClick={() => setFilterOpen((v) => !v)} className={`relative flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-[15px] text-[13px] font-bold text-[#EAF7E3] ${glass}`}>
              <FilterIcon /> Filters
              {filterCount > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-[#8FD14F] px-[5px] text-[10.5px] font-extrabold text-[#183a22]">{filterCount}</span>}
            </button>
            <button className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[#EAF7E3] ${glass}`}><GearIcon /></button>
            <div className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-white/50 text-[15px] font-extrabold text-white shadow-[0_3px_10px_-3px_rgba(0,0,0,.4)]" style={{ background: "linear-gradient(135deg,#8FD14F,#3DA35D)" }}>R</div>
          </div>

          {/* filter panel */}
          {filterOpen && (
            <div className="pointer-events-auto absolute right-6 top-[74px] w-[264px] rounded-[20px] border border-white/[.12] bg-[rgba(20,42,27,.86)] p-[18px] backdrop-blur-xl" style={{ boxShadow: "0 20px 48px -18px rgba(0,0,0,.6)" }}>
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
            </div>
          )}

          {/* map/list toggle */}
          <div className="pointer-events-auto absolute left-[14px] top-[78px] flex rounded-xl border border-white/10 bg-[rgba(12,28,18,.6)] p-1 backdrop-blur" style={{ animation: "fadeUp .5s ease both .2s" }}>
            <span onClick={() => setView("map")} className="flex cursor-pointer items-center gap-1.5 rounded-[9px] px-[13px] py-1.5 text-xs font-extrabold transition-all" style={{ background: !isList ? "#8FD14F" : "transparent", color: !isList ? "#183a22" : "rgba(234,247,227,.7)" }}><MapIcon /> Map</span>
            <span onClick={() => setView("list")} className="flex cursor-pointer items-center gap-1.5 rounded-[9px] px-[13px] py-1.5 text-xs font-extrabold transition-all" style={{ background: isList ? "#8FD14F" : "transparent", color: isList ? "#183a22" : "rgba(234,247,227,.7)" }}><ListIcon /> List</span>
          </div>

          {!isList && (
            <>
              <div className="pointer-events-none absolute left-[14px] top-[132px] whitespace-nowrap rounded-full bg-[rgba(239,90,90,.92)] px-3 py-[5px] text-[10.5px] font-extrabold text-white shadow-[0_6px_16px_rgba(239,90,90,.4)]">◎ Priority zone · RW 04 Cipedak</div>
              <div className="pointer-events-auto absolute bottom-[210px] right-6 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[rgba(12,28,18,.6)] backdrop-blur">
                <span onClick={() => mapRef.current?.zoomIn()} className="cursor-pointer border-b border-white/10 px-[13px] py-[9px] text-[18px] font-semibold text-[#EAF7E3]">+</span>
                <span onClick={() => mapRef.current?.zoomOut()} className="cursor-pointer px-[13px] py-[9px] text-[18px] font-semibold text-[#EAF7E3]">−</span>
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
            <div className="flex items-center gap-[11px]">
              <Image src="/careyuk-logo.png" alt="CareYuk" width={34} height={34} className="object-contain" />
              <span className="text-[19px] font-bold tracking-[-.02em]" style={{ fontFamily: disp }}>CareYuk</span>
            </div>
            <nav className="flex shrink-0 gap-[2px] rounded-[11px] border border-white/60 bg-white/50 p-[3px] backdrop-blur">
              <span className="rounded-lg bg-[#23472D] px-[10px] py-1.5 text-[11.5px] font-bold text-white">Explore</span>
              <span className="cursor-pointer rounded-lg px-[10px] py-1.5 text-[11.5px] font-semibold text-[#516155]">Applications</span>
              <span className="cursor-pointer rounded-lg px-[10px] py-1.5 text-[11.5px] font-semibold text-[#516155]">Portfolio</span>
            </nav>
          </div>

          {/* greeting */}
          <div className="relative z-[2]">
            <div className="mb-[5px] flex items-center gap-1.5 text-[13px] font-semibold text-[#69746A]" style={{ animation: "greetUp .6s ease both .05s" }}>
              Good morning, Rina <span className="inline-block origin-[70%_80%]" style={{ animation: "wave 3s ease-in-out infinite .8s" }}>👋</span>
            </div>
            <h1 className="text-[29px] font-bold leading-[1.12] tracking-[-.03em] [text-wrap:balance]"
              style={{ fontFamily: disp, background: "linear-gradient(90deg,#1c3d27 0%,#3DA35D 35%,#8FD14F 55%,#1c3d27 90%)", backgroundSize: "220% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", animation: "sheen 7s linear infinite,greetUp .6s ease both .12s" }}>
              Let&apos;s find where you&apos;re needed today.
            </h1>
          </div>

          {/* bento */}
          <div className="relative z-[2] grid grid-cols-3 gap-[11px]" style={{ animation: "fadeUp .5s ease both .16s" }}>
            <BentoTile n="12" label="Events near you" iconBg="rgba(143,209,79,.24)" iconColor="#3f9e46" icon={<CalendarIcon />} />
            <BentoTile n="8" label="Clinic help" iconBg="rgba(35,71,45,.14)" iconColor="#23472D" icon={<StethIcon />} />
            <BentoTile n="5" label="Shadowing" iconBg="rgba(47,109,158,.16)" iconColor="#2f6d9e" icon={<EyeIcon />} />
          </div>

          {/* applied strip */}
          <div className="relative z-[2] flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-[13px] backdrop-blur" style={{ animation: "fadeUp .5s ease both .22s" }}>
            <div className="flex items-center">
              {["#8FD14F", "#C9F3B0", "#3DA35D"].map((c, i) => <span key={i} className="h-[30px] w-[30px] rounded-full border-2 border-white" style={{ background: c, marginLeft: i ? -9 : 0 }} />)}
            </div>
            <div className="flex-1 leading-[1.3]">
              <div className="text-[13.5px] font-bold">You&apos;ve applied to 3 opportunities</div>
              <div className="text-[11.5px] text-[#69746A]">1 accepted · 2 pending review</div>
            </div>
            <span className="cursor-pointer text-xs font-bold text-[#3DA35D]">View →</span>
          </div>

          {/* selected opportunity */}
          <div className="relative z-[2] text-xs font-bold uppercase tracking-[.02em] text-[#69746A]">Selected opportunity</div>
          <div className="relative z-[2] rounded-[22px] border border-white/80 bg-white/[.72] p-5 backdrop-blur" style={{ boxShadow: "0 16px 36px -20px rgba(28,61,39,.5)", animation: "fadeUp .5s ease both .28s" }}>
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
            <button onClick={() => setApplied((a) => ({ ...a, [sel.id]: !a[sel.id] }))}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] py-[14px] text-[14.5px] font-bold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ color: isApplied ? "#23472D" : "#0f2a17", background: isApplied ? "#EAF7E3" : "linear-gradient(120deg,#8FD14F,#3DA35D)", boxShadow: isApplied ? "none" : "0 10px 24px -8px rgba(143,209,79,.7)" }}>
              {isApplied ? "✓ Applied — pending review" : "Apply to this opportunity  →"}
            </button>
          </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container{background:#132a1b;font-family:inherit}
        .leaflet-tile-pane{filter:brightness(.72) contrast(1.02) sepia(.55) hue-rotate(78deg) saturate(2.5)}
        .leaflet-div-icon{background:transparent;border:none}
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
      `}</style>
    </div>
  );
}

/* ---------- presentational ---------- */
function BentoTile({ n, label, icon, iconBg, iconColor }: { n: string; label: string; icon: React.ReactNode; iconBg: string; iconColor: string }) {
  return (
    <div className="cursor-pointer rounded-[18px] border border-white/65 bg-white/40 p-[15px_13px] backdrop-blur-md transition-transform duration-200 hover:-translate-y-[3px]" style={{ boxShadow: "0 8px 20px -12px rgba(28,61,39,.4)" }}>
      <div className="mb-[15px] flex h-[34px] w-[34px] items-center justify-center rounded-[11px]" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="text-2xl font-bold leading-none text-[#1c3d27]" style={{ fontFamily: disp }}>{n}</div>
      <div className="text-[11.5px] font-semibold text-[#54604f]">{label}</div>
    </div>
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
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAF7E3" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 opacity-65"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
const BellIcon = () => <svg width="19" height="19" viewBox="0 0 24 24" {...s}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
const FilterIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" {...s}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
const GearIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const MapIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16" /></svg>;
const ListIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
const TargetIcon = ({ color }: { color?: string }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></svg>;
