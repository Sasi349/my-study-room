"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Flame, Trash2, Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";

interface StreakLog {
  id: string;
  date: string;
}

interface Streak {
  id: string;
  name: string;
  logs: StreakLog[];
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentStreak(logs: StreakLog[]): number {
  const dates = new Set(logs.map((l) => l.date));
  let count = 0;
  const d = new Date();
  // Check if today is logged; if not, start from yesterday
  const todayStr = d.toISOString().split("T")[0];
  if (!dates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (dates.has(dateStr)) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

function getWeekDays(weekOffset: number): { date: string; dayLabel: string; isToday: boolean }[] {
  const today = new Date();
  // Get Monday of current week
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff + weekOffset * 7);

  const days: { date: string; dayLabel: string; isToday: boolean }[] = [];
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      dayLabel: labels[i],
      isToday: dateStr === getToday(),
    });
  }
  return days;
}

function formatWeekLabel(weekOffset: number): string {
  const days = getWeekDays(weekOffset);
  const start = new Date(days[0].date);
  const end = new Date(days[6].date);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

export default function StreakTracker() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editStreak, setEditStreak] = useState<Streak | null>(null);
  const [deleteStreak, setDeleteStreak] = useState<Streak | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expanded, setExpanded] = useState(true);

  const fetchStreaks = useCallback(async () => {
    const res = await fetch("/api/streaks");
    if (res.ok) {
      const data = await res.json();
      setStreaks(data.streaks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/streaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowCreate(false);
    setSaving(false);
    fetchStreaks();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editStreak) return;
    setSaving(true);
    await fetch(`/api/streaks/${editStreak.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditStreak(null);
    setSaving(false);
    fetchStreaks();
  }

  async function handleDelete() {
    if (!deleteStreak) return;
    setSaving(true);
    await fetch(`/api/streaks/${deleteStreak.id}`, { method: "DELETE" });
    setDeleteStreak(null);
    setSaving(false);
    fetchStreaks();
  }

  async function toggleDay(streakId: string, date: string) {
    // Optimistic update
    setStreaks((prev) =>
      prev.map((s) => {
        if (s.id !== streakId) return s;
        const hasLog = s.logs.some((l) => l.date === date);
        return {
          ...s,
          logs: hasLog
            ? s.logs.filter((l) => l.date !== date)
            : [...s.logs, { id: `temp-${Date.now()}`, date }],
        };
      })
    );

    await fetch(`/api/streaks/${streakId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
  }

  const weekDays = getWeekDays(weekOffset);

  if (loading) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm shadow-orange-200 dark:shadow-orange-950/20">
            <Flame size={14} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
            Streaks
          </h2>
          <ChevronRight
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        {expanded && (
          <button
            onClick={() => { setShowCreate(true); setName(""); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {expanded && streaks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 overflow-hidden">
          {/* Week Navigation */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setWeekOffset((v) => v - 1)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {weekOffset === 0 ? "This Week" : formatWeekLabel(weekOffset)}
            </span>
            <button
              onClick={() => setWeekOffset((v) => Math.min(v + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid px-3 pt-2.5 pb-1 gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {weekDays.map((d) => (
              <div key={d.date} className="flex justify-center">
                <span className={`text-[10px] font-bold ${d.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {d.dayLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Streak Rows */}
          <div className="px-3 pb-3 space-y-2">
            {streaks.map((streak) => {
              const logDates = new Set(streak.logs.map((l) => l.date));
              const currentStreak = getCurrentStreak(streak.logs);

              return (
                <div key={streak.id}>
                  {/* Streak Name Row */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {streak.name}
                    </span>
                    {currentStreak > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 dark:text-orange-400 shrink-0">
                        <Flame size={10} />
                        {currentStreak}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                      <button
                        onClick={() => { setEditStreak(streak); setName(streak.name); }}
                        className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteStreak(streak)}
                        className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {/* Day Cells Row */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {weekDays.map((d) => {
                    const isChecked = logDates.has(d.date);
                    const isFuture = d.date > getToday();
                    return (
                      <button
                        key={d.date}
                        disabled={isFuture}
                        onClick={() => !isFuture && toggleDay(streak.id, d.date)}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                          isFuture
                            ? "bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed"
                            : isChecked
                              ? "bg-gradient-to-br from-orange-400 to-red-500 shadow-sm shadow-orange-200 dark:shadow-orange-950/20 active:scale-90"
                              : d.isToday
                                ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800 hover:ring-blue-300 dark:hover:ring-blue-700 active:scale-90"
                                : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-90"
                        }`}
                      >
                        {isChecked ? (
                          <Check size={14} className="text-white" strokeWidth={3} />
                        ) : d.isToday && !isFuture ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
                        ) : null}
                      </button>
                    );
                  })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expanded && streaks.length === 0 && (
        <button
          onClick={() => { setShowCreate(true); setName(""); }}
          className="w-full bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-dashed ring-slate-200 dark:ring-slate-700 p-6 flex flex-col items-center gap-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/20 flex items-center justify-center transition-colors">
            <Flame size={20} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Add a topic to track your streak</p>
        </button>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Streak">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., English Communication, DSA Practice" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Streak"}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editStreak} onClose={() => setEditStreak(null)} title="Edit Streak">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteStreak}
        onClose={() => setDeleteStreak(null)}
        onConfirm={handleDelete}
        title="Delete Streak"
        message={`Delete "${deleteStreak?.name}"? All streak history will be lost.`}
        loading={saving}
      />
    </div>
  );
}
