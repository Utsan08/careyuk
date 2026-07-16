import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import {
  BASE_TYPES,
  CUSTOM_TYPE_ICON,
  displayFont,
  FALLBACK_REWARD,
  REWARDS,
  XP_PER_HOUR,
} from "./data";
import styles from "./org-dashboard.module.css";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#E2E8DE] bg-[#FBFDFA] px-[15px] py-[13px] font-semibold text-[#202320] outline-none transition focus:border-[#8FD14F] focus:shadow-[0_0_0_4px_rgba(143,209,79,.16)]";
const cardClass = "rounded-[22px] border border-[#E9EFE6] bg-white p-6 shadow-[0_10px_30px_-22px_rgba(28,61,39,.4)]";

export type OpportunityForm = {
  title: string;
  when: string;
  where: string;
  notes: string;
};

export type PostTabProps = {
  postType: string;
  onPostTypeChange: (type: string) => void;
  customTypes: string[];
  onAddCustomType: (type: string) => void;
  slots: number;
  /** Takes an updater, not a value — two clicks in one tick would otherwise both read a stale count. */
  onSlotsChange: (update: (current: number) => number) => void;
  hours: number;
  onHoursChange: (update: (current: number) => number) => void;
  faculties: Record<string, boolean>;
  onToggleFaculty: (faculty: string) => void;
  onAddFaculty: (faculty: string) => void;
  form: OpportunityForm;
  onFormChange: (patch: Partial<OpportunityForm>) => void;
  published: boolean;
  busy: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
};

export function PostTab({
  postType,
  onPostTypeChange,
  customTypes,
  onAddCustomType,
  slots,
  onSlotsChange,
  hours,
  onHoursChange,
  faculties,
  onToggleFaculty,
  onAddFaculty,
  form,
  onFormChange,
  published,
  busy,
  onPublish,
  onSaveDraft,
}: PostTabProps) {
  const [addingType, setAddingType] = useState(false);
  const [newType, setNewType] = useState("");
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState("");

  const allTypes = [
    ...BASE_TYPES,
    ...customTypes.map((t) => ({ key: t, label: t, icon: CUSTOM_TYPE_ICON })),
  ];
  const reward = REWARDS[postType] ?? FALLBACK_REWARD;
  const RewardIcon = reward.icon;

  const commitType = () => {
    const value = newType.trim();
    if (value) onAddCustomType(value);
    setAddingType(false);
    setNewType("");
  };

  const commitFaculty = () => {
    const value = newFaculty.trim();
    if (value) onAddFaculty(value);
    setAddingFaculty(false);
    setNewFaculty("");
  };

  return (
    <div className={`${styles.postGrid} ${styles.tabIn} my-auto items-center`}>
      <div className="flex flex-col gap-[18px]">
        <div className={cardClass}>
          <FieldLabel htmlFor="opp-title">Opportunity title</FieldLabel>
          <input
            id="opp-title"
            value={form.title}
            onChange={(e) => onFormChange({ title: e.target.value })}
            placeholder="e.g. Maternal & Child Health Drive"
            className={`${inputClass} mb-[18px] text-[14.5px]`}
          />

          <FieldLabel>Type</FieldLabel>
          <div className="mb-[18px] flex flex-wrap gap-2">
            {allTypes.map((c) => {
              const on = postType === c.key;
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onPostTypeChange(c.key)}
                  aria-pressed={on}
                  className="flex cursor-pointer items-center gap-[7px] rounded-xl border-[1.5px] px-[14px] py-2.5 text-[13px] font-medium transition-all"
                  style={{
                    borderColor: on ? "#8FD14F" : "#E2E8DE",
                    background: on ? "#EAF7E3" : "#fff",
                    color: on ? "#23472D" : "#516155",
                  }}
                >
                  <Icon className="size-4" strokeWidth={2.2} />
                  {c.label}
                </button>
              );
            })}
            {addingType && (
              <input
                autoFocus
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitType();
                  } else if (e.key === "Escape") {
                    setAddingType(false);
                    setNewType("");
                  }
                }}
                onBlur={commitType}
                placeholder="New type…"
                aria-label="New opportunity type"
                className="w-[132px] rounded-xl border-[1.5px] border-[#8FD14F] bg-white px-[13px] py-2.5 text-[13px] font-medium text-[#23472D] outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => setAddingType(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[#C4D3BC] px-[13px] py-2.5 text-[13px] font-medium text-[#516155] transition-all hover:border-[#8FD14F] hover:text-[#23472D]"
            >
              <Plus className="size-[15px]" strokeWidth={2.4} />
              Add
            </button>
          </div>

          <div className="mb-[18px] grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Slots needed</FieldLabel>
              <Stepper
                value={`${slots}`}
                label="slots"
                onDec={() => onSlotsChange((s) => Math.max(1, s - 1))}
                onInc={() => onSlotsChange((s) => s + 1)}
              />
            </div>
            <div>
              <FieldLabel>Duration (verified hours)</FieldLabel>
              <Stepper
                value={`${hours}h`}
                label="hours"
                onDec={() => onHoursChange((h) => Math.max(1, h - 1))}
                onInc={() => onHoursChange((h) => h + 1)}
              />
            </div>
          </div>

          <div className="mb-[18px] grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="opp-when">Date &amp; time</FieldLabel>
              <input
                id="opp-when"
                value={form.when}
                onChange={(e) => onFormChange({ when: e.target.value })}
                placeholder="Sat 19 Jul · 08:00"
                className={`${inputClass} text-[13.5px]`}
              />
            </div>
            <div>
              <FieldLabel htmlFor="opp-where">Location</FieldLabel>
              <input
                id="opp-where"
                value={form.where}
                onChange={(e) => onFormChange({ where: e.target.value })}
                placeholder="RW 04 Cipedak, Jakarta"
                className={`${inputClass} text-[13.5px]`}
              />
            </div>
          </div>

          <FieldLabel>Open to</FieldLabel>
          <div className="flex flex-wrap gap-[7px]">
            {Object.keys(faculties).map((f) => {
              const on = faculties[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onToggleFaculty(f)}
                  aria-pressed={on}
                  className="cursor-pointer rounded-[10px] border-[1.5px] px-3 py-2 text-[12.5px] font-medium transition-all"
                  style={{
                    borderColor: on ? "#8FD14F" : "#E2E8DE",
                    background: on ? "#EAF7E3" : "#fff",
                    color: on ? "#23472D" : "#516155",
                  }}
                >
                  {f}
                </button>
              );
            })}
            {addingFaculty && (
              <input
                autoFocus
                value={newFaculty}
                onChange={(e) => setNewFaculty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitFaculty();
                  } else if (e.key === "Escape") {
                    setAddingFaculty(false);
                    setNewFaculty("");
                  }
                }}
                onBlur={commitFaculty}
                placeholder="Add role…"
                aria-label="New role"
                className="w-[120px] rounded-[10px] border-[1.5px] border-[#8FD14F] bg-white px-[11px] py-2 text-[12.5px] font-medium text-[#23472D] outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => setAddingFaculty(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[#C4D3BC] px-3 py-2 text-[12.5px] font-medium text-[#516155] transition-all hover:border-[#8FD14F] hover:text-[#23472D]"
            >
              <Plus className="size-[13px]" strokeWidth={2.6} />
              Add role
            </button>
          </div>
        </div>

        <div className={cardClass}>
          <FieldLabel htmlFor="opp-bring">What volunteers should bring</FieldLabel>
          <textarea
            id="opp-bring"
            rows={3}
            value={form.notes}
            onChange={(e) => onFormChange({ notes: e.target.value })}
            className={`${inputClass} resize-none text-[13.5px] leading-[1.5] font-normal`}
          />
        </div>
      </div>

      <div className={`${styles.reward} flex flex-col gap-4`}>
        <div
          className="relative flex flex-col items-center overflow-hidden rounded-[22px] p-6 text-[#EAF7E3] shadow-[0_20px_44px_-22px_rgba(28,61,39,.7)]"
          style={{ background: "linear-gradient(180deg,#2c5e3c 0%,#245030 60%,#1e4429 100%)" }}
        >
          <div
            className={`pointer-events-none absolute top-0 left-0 h-full w-[40%] ${styles.shine}`}
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)" }}
          />
          <div className="mb-4 text-center text-[11px] font-semibold tracking-[.06em] text-[#EAF7E3]/50 uppercase">
            Volunteers will earn
          </div>
          <div className="mb-4 flex justify-center">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-[26px] text-[#0f3d1e] shadow-[0_12px_28px_-8px_rgba(143,209,79,.6)] ${styles.floaty}`}
              style={{ background: "linear-gradient(145deg,#8FD14F,#3DA35D)" }}
            >
              <RewardIcon className="size-[46px]" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mb-[3px] text-center text-[18px] font-semibold text-white" style={{ fontFamily: displayFont }}>
            {reward.badge}
          </div>
          <div className="mb-[18px] text-center text-[12px] text-[#EAF7E3]/60">Badge unlocked on verified check-in</div>
          <div className="flex w-full gap-2.5">
            <div className="flex-1 rounded-[14px] bg-[#EAF7E3]/[.08] py-[13px] text-center">
              <div className="text-[22px] font-semibold text-[#8FD14F]" style={{ fontFamily: displayFont }}>
                {hours}h
              </div>
              <div className="text-[10.5px] font-semibold text-[#EAF7E3]/55">verified hours</div>
            </div>
            <div className="flex-1 rounded-[14px] bg-[#EAF7E3]/[.08] py-[13px] text-center">
              <div className="text-[22px] font-semibold text-[#8FD14F]" style={{ fontFamily: displayFont }}>
                +{hours * XP_PER_HOUR}
              </div>
              <div className="text-[10.5px] font-semibold text-[#EAF7E3]/55">XP toward portfolio</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] py-[15px] text-[15px] font-semibold text-[#0f2a17] shadow-[0_12px_26px_-10px_rgba(143,209,79,.7)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
          style={{ background: published ? "linear-gradient(120deg,#6cbf3f,#2e8c4c)" : "linear-gradient(120deg,#8FD14F,#3DA35D)" }}
        >
          {busy ? (
            <>
              <Loader2 className={`size-4 ${styles.spin}`} strokeWidth={2.6} />
              Publishing…
            </>
          ) : published ? (
            <>
              <Check className="size-4" strokeWidth={3} />
              Published — live for volunteers
            </>
          ) : (
            "Publish opportunity"
          )}
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={busy}
          className="w-full cursor-pointer rounded-[14px] border-[1.5px] border-[#E2E8DE] bg-white py-[13px] text-[14px] font-semibold text-[#516155] transition-all hover:bg-[#F1F6EE] active:scale-[.99] disabled:opacity-60"
        >
          Save as draft
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-[7px] block text-[12px] font-semibold text-[#3f4a43]">
      {children}
    </label>
  );
}

function Stepper({
  value,
  label,
  onDec,
  onInc,
}: {
  value: string;
  label: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#E2E8DE] bg-[#FBFDFA] px-3 py-2">
      <button
        type="button"
        onClick={onDec}
        aria-label={`Decrease ${label}`}
        className="h-[30px] w-[30px] cursor-pointer rounded-[9px] bg-[#EEF3EC] text-[18px] font-semibold text-[#23472D]"
      >
        −
      </button>
      <span className="flex-1 text-center text-[19px] font-semibold" style={{ fontFamily: displayFont }}>
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label={`Increase ${label}`}
        className="h-[30px] w-[30px] cursor-pointer rounded-[9px] bg-[#8FD14F] text-[18px] font-semibold text-[#183a22]"
      >
        +
      </button>
    </div>
  );
}
