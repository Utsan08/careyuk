import { displayFont, initials, PIPELINE } from "./data";
import styles from "./org-dashboard.module.css";

export function ProgressTab({ search }: { search: string }) {
  const query = search.trim().toLowerCase();
  const columns = PIPELINE.map((col) => ({
    ...col,
    people: query
      ? col.people.filter((p) => [p.name, p.meta, p.note ?? ""].some((f) => f.toLowerCase().includes(query)))
      : col.people,
  }));
  const noResults = query && columns.every((c) => c.people.length === 0);

  return (
    <div className={styles.tabIn}>
      <div className="mb-3.5 text-[11px] font-semibold tracking-[.08em] text-[#B08207] uppercase">
        Citizen → Certified volunteer pipeline
      </div>
      {noResults && (
        <div className="rounded-[18px] border border-[#E9EFE6] bg-white/60 px-6 py-10 text-center text-[13px] text-[#8a938b]">
          Nobody in the pipeline matches “{search}”.
        </div>
      )}
      <div className="grid grid-cols-3 gap-[18px]">
        {columns.map((col) => (
          <div key={col.title} className="rounded-[22px] border border-white/55 bg-white/[.34] p-[18px] backdrop-blur">
            <div className="mb-3.5 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold tracking-[.04em] text-[#3f4a43] uppercase">{col.title}</span>
              <span className="text-[13px] font-semibold text-[#9aa39c]">{col.count}</span>
            </div>
            <div className="flex flex-col gap-3">
              {col.people.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-[16px] border border-[#EDEFE9] bg-white px-4 py-[15px] shadow-[0_6px_18px_-14px_rgba(28,61,39,.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-14px_rgba(28,61,39,.5)] ${styles.fadeUpFast}`}
                >
                  <div className="flex items-center gap-[11px]">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[12.5px] font-semibold text-[#1c3d27]"
                      style={{ background: p.avatar, fontFamily: displayFont }}
                    >
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold">{p.name}</div>
                      <div className="mt-px text-[11.5px] font-medium text-[#69746A]">{p.meta}</div>
                    </div>
                  </div>
                  {p.barPct && (
                    <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-[#EFEFEA]">
                      <div
                        className={`h-full rounded-full ${styles.barGrow}`}
                        style={{ background: "linear-gradient(90deg,#E0A32E,#C7841A)", width: p.barPct }}
                      />
                    </div>
                  )}
                  {p.note && <div className="mt-[11px] text-[12px] leading-[1.45] text-[#8a938b] italic">{p.note}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
