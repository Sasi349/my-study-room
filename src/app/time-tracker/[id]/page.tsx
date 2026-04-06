"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus, Trash2, Pencil, Clock, Users, UserPlus, X,
  ChevronLeft, ChevronRight, CalendarDays, CalendarRange,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TimePicker from "@/components/ui/TimePicker";
import TimeTrackerChart from "@/components/TimeTrackerChart";

interface TimeEntry {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  minutes: number;
  note: string | null;
  memberId: string;
  createdAt: string;
}

interface TimeTrackerMember {
  id: string;
  name: string;
  entries: TimeEntry[];
}

interface TimeTrackerDetail {
  id: string;
  name: string;
  members: TimeTrackerMember[];
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calculateMinutesFromTimes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  let diff = endTotalMin - startTotalMin;
  if (diff < 0) diff += 24 * 60; // Handle overnight times
  return diff;
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

function getWeekDays(monday: Date) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
  const days: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function TimeTrackerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tracker, setTracker] = useState<TimeTrackerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  // Month navigation
  const [monthYear, setMonthYear] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

  // Modal states
  const [showLogTime, setShowLogTime] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editMember, setEditMember] = useState<TimeTrackerMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TimeTrackerMember | null>(null);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [entryDate, setEntryDate] = useState(toDateStr(new Date()));
  const [entryStartTime, setEntryStartTime] = useState("");
  const [entryEndTime, setEntryEndTime] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTracker = useCallback(async () => {
    const res = await fetch(`/api/time-tracker/${id}`);
    if (res.ok) {
      const data: TimeTrackerDetail = await res.json();
      setTracker(data);
      if (data.members.length > 0) {
        setSelectedMemberId((prev) => {
          if (prev && data.members.some((m) => m.id === prev)) return prev;
          return data.members[0].id;
        });
      } else {
        setSelectedMemberId("");
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTracker();
  }, [fetchTracker]);

  const selectedMember = tracker?.members.find((m) => m.id === selectedMemberId);

  // Build a map of date -> total minutes for selected member
  const dateMinutesMap: Record<string, number> = {};
  const dateEntriesMap: Record<string, TimeEntry[]> = {};
  if (selectedMember) {
    for (const entry of selectedMember.entries) {
      dateMinutesMap[entry.date] = (dateMinutesMap[entry.date] || 0) + entry.minutes;
      if (!dateEntriesMap[entry.date]) dateEntriesMap[entry.date] = [];
      dateEntriesMap[entry.date].push(entry);
    }
  }

  // Stats
  const todayStr = toDateStr(new Date());
  const todayMinutes = dateMinutesMap[todayStr] || 0;

  const weekDays = getWeekDays(weekStart);
  const weekTotal = weekDays.reduce((sum, d) => sum + (dateMinutesMap[toDateStr(d)] || 0), 0);

  const monthDays = getMonthDays(monthYear.year, monthYear.month);
  const monthTotal = monthDays.reduce((sum, d) => {
    if (!d) return sum;
    return sum + (dateMinutesMap[toDateStr(d)] || 0);
  }, 0);

  function resetLogForm() {
    setEntryDate(toDateStr(new Date()));
    setEntryStartTime("");
    setEntryEndTime("");
    setEntryNote("");
  }

  async function handleLogTime(e: React.FormEvent) {
    e.preventDefault();
    const totalMinutes = calculateMinutesFromTimes(entryStartTime, entryEndTime);
    if (totalMinutes <= 0 || !selectedMemberId) return;
    setSaving(true);
    await fetch("/api/time-tracker/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: selectedMemberId,
        date: entryDate,
        startTime: entryStartTime,
        endTime: entryEndTime,
        minutes: totalMinutes,
        note: entryNote.trim() || null,
      }),
    });
    resetLogForm();
    setShowLogTime(false);
    setSaving(false);
    fetchTracker();
  }

  async function handleEditEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!editEntry) return;
    const totalMinutes = calculateMinutesFromTimes(entryStartTime, entryEndTime);
    if (totalMinutes <= 0) return;
    setSaving(true);
    await fetch(`/api/time-tracker/entries/${editEntry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: entryDate,
        startTime: entryStartTime,
        endTime: entryEndTime,
        minutes: totalMinutes,
        note: entryNote.trim() || null,
      }),
    });
    resetLogForm();
    setEditEntry(null);
    setSaving(false);
    fetchTracker();
  }

  async function handleDeleteEntry() {
    if (!deleteEntry) return;
    setSaving(true);
    await fetch(`/api/time-tracker/entries/${deleteEntry.id}`, { method: "DELETE" });
    setDeleteEntry(null);
    setSaving(false);
    fetchTracker();
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/time-tracker/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowAddMember(false);
    setSaving(false);
    fetchTracker();
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editMember) return;
    setSaving(true);
    await fetch(`/api/time-tracker/members/${editMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditMember(null);
    setSaving(false);
    fetchTracker();
  }

  async function handleDeleteMember() {
    if (!deleteMember) return;
    setSaving(true);
    await fetch(`/api/time-tracker/members/${deleteMember.id}`, { method: "DELETE" });
    setDeleteMember(null);
    setSaving(false);
    fetchTracker();
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header title="Loading..." showBack />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header title="Not Found" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500 dark:text-slate-400">Tracker not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title={tracker.name} showBack />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Member Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tracker.members.map((member) => {
              const isActive = member.id === selectedMemberId;
              return (
                <div key={member.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-950/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                  >
                    {member.name}
                  </button>
                  <button
                    onClick={() => { setEditMember(member); setName(member.name); }}
                    className="p-0.5 ml-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => setDeleteMember(member)}
                    className="p-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => { setShowAddMember(true); setName(""); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors shrink-0 ring-1 ring-dashed ring-slate-200 dark:ring-slate-700"
            >
              <UserPlus size={12} />
              Add
            </button>
          </div>
        </div>

        {/* No members prompt */}
        {tracker.members.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mx-auto mb-2">
              <UserPlus size={20} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Add members to start tracking time
            </p>
            <button
              onClick={() => { setShowAddMember(true); setName(""); }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Add First Member
            </button>
          </div>
        )}

        {selectedMemberId && (
          <>
            {/* Today's Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {todayMinutes > 0 ? formatMinutes(todayMinutes) : "0m"}
                  </p>
                </div>
                <button
                  onClick={() => { resetLogForm(); setShowLogTime(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]"
                >
                  <Plus size={16} />
                  Log Time
                </button>
              </div>

              {/* Today's entries */}
              {dateEntriesMap[todayStr] && dateEntriesMap[todayStr].length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  {dateEntriesMap[todayStr].map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-sm">
                      <Clock size={12} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatMinutes(entry.minutes)}</span>
                      {entry.note && <span className="text-slate-400 dark:text-slate-500 truncate">{entry.note}</span>}
                      <div className="flex items-center gap-0.5 ml-auto shrink-0">
                        <button
                          onClick={() => {
                            setEditEntry(entry);
                            setEntryDate(entry.date);
                            if (entry.startTime && entry.endTime) {
                              setEntryStartTime(entry.startTime);
                              setEntryEndTime(entry.endTime);
                            } else {
                              // Legacy entry: no stored start/end. Fall back to
                              // 09:00-based reconstruction so old rows stay editable.
                              const startHour = 9;
                              const startMin = 0;
                              const startStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
                              const endTotalMin = (startHour * 60 + startMin) + entry.minutes;
                              const endHour = Math.floor(endTotalMin / 60) % 24;
                              const endMin = endTotalMin % 60;
                              const endStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
                              setEntryStartTime(startStr);
                              setEntryEndTime(endStr);
                            }
                            setEntryNote(entry.note || "");
                          }}
                          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setDeleteEntry(entry)}
                          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("week")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "week"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700"
                  }`}
              >
                <CalendarDays size={13} />
                Weekly
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "month"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700"
                  }`}
              >
                <CalendarRange size={13} />
                Monthly
              </button>
            </div>

            {/* Chart */}
            {selectedMember && (
              <TimeTrackerChart
                entries={selectedMember.entries}
                viewMode={viewMode}
                weekStart={weekStart}
              />
            )}

            {/* Weekly View */}
            {viewMode === "week" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4">
                {/* Week navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMinutes(weekTotal)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Week grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map((day, i) => {
                    const dateStr = toDateStr(day);
                    const mins = dateMinutesMap[dateStr] || 0;
                    const isToday = dateStr === todayStr;
                    const entries = dateEntriesMap[dateStr] || [];

                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-2 text-center transition-colors ${isToday
                            ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800"
                            : "bg-slate-50 dark:bg-slate-800/50"
                          }`}
                      >
                        <p className={`text-[10px] font-semibold ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {DAY_LABELS[i]}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isToday ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {day.getDate()}
                        </p>
                        <p className={`text-xs font-bold mt-1 ${mins > 0
                            ? isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                            : "text-slate-300 dark:text-slate-600"
                          }`}>
                          {mins > 0 ? formatMinutes(mins) : "–"}
                        </p>
                        {/* Intensity dot */}
                        {mins > 0 && (
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${mins >= 120 ? "bg-emerald-500" : mins >= 60 ? "bg-blue-500" : "bg-slate-400"
                            }`} title={entries.map(e => `${formatMinutes(e.minutes)}${e.note ? ` - ${e.note}` : ""}`).join(", ")} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Week daily breakdown */}
                <div className="mt-4 space-y-1.5">
                  {weekDays.map((day, i) => {
                    const dateStr = toDateStr(day);
                    const entries = dateEntriesMap[dateStr] || [];
                    if (entries.length === 0) return null;
                    const isToday = dateStr === todayStr;

                    return (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`text-xs font-semibold w-8 shrink-0 pt-0.5 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {DAY_LABELS[i]}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          {entries.map((entry) => (
                            <div key={entry.id} className="flex items-center gap-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{formatMinutes(entry.minutes)}</span>
                              {entry.note && <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{entry.note}</span>}
                              <div className="flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                  onClick={() => {
                                    setEditEntry(entry);
                                    setEntryDate(entry.date);
                                    if (entry.startTime && entry.endTime) {
                                      setEntryStartTime(entry.startTime);
                                      setEntryEndTime(entry.endTime);
                                    } else {
                                      // Legacy entry: no stored start/end. Fall back to
                                      // 09:00-based reconstruction so old rows stay editable.
                                      const startHour = 9;
                                      const startMin = 0;
                                      const startStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
                                      const endTotalMin = (startHour * 60 + startMin) + entry.minutes;
                                      const endHour = Math.floor(endTotalMin / 60) % 24;
                                      const endMin = endTotalMin % 60;
                                      const endStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
                                      setEntryStartTime(startStr);
                                      setEntryEndTime(endStr);
                                    }
                                    setEntryNote(entry.note || "");
                                  }}
                                  className="p-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  onClick={() => setDeleteEntry(entry)}
                                  className="p-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly View */}
            {viewMode === "month" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setMonthYear((prev) => {
                      const m = prev.month - 1;
                      return m < 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: m };
                    })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {MONTH_NAMES[monthYear.month]} {monthYear.year}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Total: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMinutes(monthTotal)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setMonthYear((prev) => {
                      const m = prev.month + 1;
                      return m > 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: m };
                    })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />;
                    const dateStr = toDateStr(day);
                    const mins = dateMinutesMap[dateStr] || 0;
                    const isToday = dateStr === todayStr;

                    return (
                      <div
                        key={i}
                        className={`rounded-lg p-1 text-center min-h-[44px] flex flex-col items-center justify-center transition-colors ${isToday
                            ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800"
                            : mins > 0
                              ? "bg-slate-50 dark:bg-slate-800/50"
                              : ""
                          }`}
                      >
                        <p className={`text-[10px] ${isToday ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {day.getDate()}
                        </p>
                        {mins > 0 && (
                          <p className={`text-[10px] font-bold mt-0.5 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                            }`}>
                            {formatMinutes(mins)}
                          </p>
                        )}
                        {mins > 0 && (
                          <div className={`w-1 h-1 rounded-full mt-0.5 ${mins >= 120 ? "bg-emerald-500" : mins >= 60 ? "bg-blue-500" : "bg-slate-400"
                            }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Month daily average */}
                {monthTotal > 0 && (() => {
                  const daysWithEntries = monthDays.filter((d) => d && dateMinutesMap[toDateStr(d)] > 0).length;
                  const totalDays = monthDays.filter((d) => d != null).length;
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Days active: <span className="font-semibold text-slate-700 dark:text-slate-300">{daysWithEntries}/{totalDays}</span></span>
                      <span>Daily avg: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMinutes(Math.round(monthTotal / (daysWithEntries || 1)))}</span></span>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </main>

      {/* --- Modals --- */}

      {/* Log Time */}
      <Modal open={showLogTime} onClose={() => setShowLogTime(false)} title="Log Time">
        <form onSubmit={handleLogTime} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker value={entryStartTime} onChange={setEntryStartTime} label="Start Time" />
            <TimePicker value={entryEndTime} onChange={setEntryEndTime} label="End Time" />
          </div>
          {entryStartTime && entryEndTime && (
            <div className="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              Duration: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(calculateMinutesFromTimes(entryStartTime, entryEndTime))}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="e.g., Morning study, NextJS routing" className={INPUT_CLASS} />
          </div>
          <button type="submit" disabled={saving || calculateMinutesFromTimes(entryStartTime, entryEndTime) <= 0} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Log Time"}
          </button>
        </form>
      </Modal>

      {/* Edit Entry */}
      <Modal open={!!editEntry} onClose={() => setEditEntry(null)} title="Edit Entry">
        <form onSubmit={handleEditEntry} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker value={entryStartTime} onChange={setEntryStartTime} label="Start Time" />
            <TimePicker value={entryEndTime} onChange={setEntryEndTime} label="End Time" />
          </div>
          {entryStartTime && entryEndTime && (
            <div className="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              Duration: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(calculateMinutesFromTimes(entryStartTime, entryEndTime))}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="e.g., Morning study, NextJS routing" className={INPUT_CLASS} />
          </div>
          <button type="submit" disabled={saving || calculateMinutesFromTimes(entryStartTime, entryEndTime) <= 0} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Add Member */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sasi, Friend" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Adding..." : "Add Member"}
          </button>
        </form>
      </Modal>

      {/* Edit Member */}
      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Edit Member">
        <form onSubmit={handleEditMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Delete Confirms */}
      <ConfirmDialog
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry"
        message={deleteEntry ? `Delete ${formatMinutes(deleteEntry.minutes)} entry${deleteEntry.note ? ` "${deleteEntry.note}"` : ""}?` : ""}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        message={`Remove "${deleteMember?.name}"? Their time entries will be lost.`}
        confirmLabel="Remove"
        loading={saving}
      />
    </div>
  );
}
