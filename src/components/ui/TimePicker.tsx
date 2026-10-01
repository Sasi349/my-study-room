"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import clsx from "clsx";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-lg font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"] as const;

type Period = (typeof PERIODS)[number];

const pad = (n: number) => String(n).padStart(2, "0");

/** "13:05" -> { hour: 1, minute: 5, period: "PM" }; invalid/empty -> null */
function parse(value: string): { hour: number; minute: number; period: Period } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) return null;
  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute,
    period: hour24 < 12 ? "AM" : "PM",
  };
}

/** { hour: 1, minute: 5, period: "PM" } -> "13:05" */
function serialize(hour: number, minute: number, period: Period): string {
  const hour24 = period === "AM" ? hour % 12 : (hour % 12) + 12;
  return `${pad(hour24)}:${pad(minute)}`;
}

interface ColumnProps<T> {
  options: readonly T[];
  selected: T | null;
  onSelect: (option: T) => void;
  format: (option: T) => string;
  ariaLabel: string;
}

function Column<T extends string | number>({ options, selected, onSelect, format, ariaLabel }: ColumnProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeIndex = selected === null ? 0 : Math.max(0, options.indexOf(selected));

  // Bring the selected option into view whenever the popover mounts it.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (active) list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
    let next: number | null = null;

    if (e.key in moves) next = activeIndex + moves[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next === null) return;

    e.preventDefault();
    const clamped = Math.min(options.length - 1, Math.max(0, next));
    onSelect(options[clamped]);
    const list = listRef.current;
    list?.children[clamped]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="h-48 overflow-y-auto scroll-smooth rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <div
            key={option}
            role="option"
            aria-selected={isSelected}
            data-active={isSelected || undefined}
            onClick={() => onSelect(option)}
            className={clsx(
              "cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium tabular-nums transition-colors",
              isSelected
                ? "bg-blue-600 text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {format(option)}
          </div>
        );
      })}
    </div>
  );
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();

  const parsed = parse(value);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Keep Escape from closing the surrounding <dialog> too.
      e.preventDefault();
      e.stopPropagation();
      close();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, close]);

  // A part can be picked before the others: fall back to 12:00 AM for the rest.
  function update(part: { hour?: number; minute?: number; period?: Period }) {
    const base = parsed ?? { hour: 12, minute: 0, period: "AM" as Period };
    onChange(serialize(part.hour ?? base.hour, part.minute ?? base.minute, part.period ?? base.period));
  }

  function setNow() {
    const now = new Date();
    onChange(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }

  const display = parsed ? `${pad(parsed.hour)}:${pad(parsed.minute)} ${parsed.period}` : "--:-- --";

  return (
    <div className="space-y-2">
      {label && (
        <label
          id={labelId}
          htmlFor={`${labelId}-native`}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Mobile: the native control, which gives the OS wheel picker. */}
      <input
        id={`${labelId}-native`}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(INPUT_CLASS, "md:hidden")}
      />

      {/* Desktop: popover with hour / minute / period columns. */}
      <div ref={containerRef} className="relative hidden md:block">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={label ? labelId : undefined}
          className={clsx(INPUT_CLASS, "flex items-center justify-between gap-2 text-left")}
        >
          <span className={clsx(!parsed && "text-slate-400 dark:text-slate-500")}>{display}</span>
          <Clock size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={label ? `${label} picker` : "Time picker"}
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl dark:shadow-slate-950/40"
          >
            <div className="grid grid-cols-3 gap-1">
              <Column
                options={HOURS}
                selected={parsed?.hour ?? null}
                onSelect={(hour) => update({ hour })}
                format={pad}
                ariaLabel="Hour"
              />
              <Column
                options={MINUTES}
                selected={parsed?.minute ?? null}
                onSelect={(minute) => update({ minute })}
                format={pad}
                ariaLabel="Minute"
              />
              <Column
                options={PERIODS}
                selected={parsed?.period ?? null}
                onSelect={(period) => update({ period })}
                format={(p) => p}
                ariaLabel="AM or PM"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              <button
                type="button"
                onClick={setNow}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Now
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
