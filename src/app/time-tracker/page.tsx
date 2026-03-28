"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, Trash2, Pencil, ChevronRight, Users } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SortableList from "@/components/ui/SortableList";
import BottomNav from "@/components/ui/BottomNav";

interface TimeEntry {
  id: string;
  date: string;
  minutes: number;
}

interface TimeTrackerMember {
  id: string;
  name: string;
  entries: TimeEntry[];
}

interface TimeTrackerSummary {
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

function getTrackerStats(t: TimeTrackerSummary) {
  const memberCount = t.members.length;
  const today = new Date().toISOString().split("T")[0];

  // Total minutes today across all members
  let todayMinutes = 0;
  let totalMinutes = 0;
  for (const m of t.members) {
    for (const e of m.entries) {
      totalMinutes += e.minutes;
      if (e.date === today) todayMinutes += e.minutes;
    }
  }

  // This week total
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const mondayStr = monday.toISOString().split("T")[0];

  let weekMinutes = 0;
  for (const m of t.members) {
    for (const e of m.entries) {
      if (e.date >= mondayStr) weekMinutes += e.minutes;
    }
  }

  return { memberCount, todayMinutes, weekMinutes, totalMinutes };
}

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

const shadows = [
  "shadow-blue-200 dark:shadow-blue-950/20",
  "shadow-emerald-200 dark:shadow-emerald-950/20",
  "shadow-violet-200 dark:shadow-violet-950/20",
  "shadow-amber-200 dark:shadow-amber-950/20",
  "shadow-rose-200 dark:shadow-rose-950/20",
  "shadow-cyan-200 dark:shadow-cyan-950/20",
];

export default function TimeTrackerListPage() {
  const [trackers, setTrackers] = useState<TimeTrackerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTracker, setEditTracker] = useState<TimeTrackerSummary | null>(null);
  const [deleteTracker, setDeleteTracker] = useState<TimeTrackerSummary | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const router = useRouter();

  const fetchTrackers = useCallback(async () => {
    try {
      const res = await fetch("/api/time-tracker");
      if (!res.ok) {
        console.error("Failed to fetch trackers:", res.status);
        setTrackers([]);
      } else {
        const data = await res.json();
        setTrackers(data);
      }
    } catch (error) {
      console.error("Error fetching trackers:", error);
      setTrackers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/time-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        console.error("Failed to create tracker:", res.status);
        return;
      }
      setName("");
      setShowCreate(false);
      fetchTrackers();
    } catch (error) {
      console.error("Error creating tracker:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editTracker) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/time-tracker/${editTracker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        console.error("Failed to update tracker:", res.status);
        return;
      }
      setName("");
      setEditTracker(null);
      fetchTrackers();
    } catch (error) {
      console.error("Error updating tracker:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTracker) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/time-tracker/${deleteTracker.id}`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Failed to delete tracker:", res.status);
        return;
      }
      setDeleteTracker(null);
      fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(reordered: TimeTrackerSummary[]) {
    setTrackers(reordered);
    try {
      const res = await fetch("/api/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "timeTracker",
          items: reordered.map((t, i) => ({ id: t.id, order: i })),
        }),
      });
      if (!res.ok) {
        console.error("Failed to reorder trackers:", res.status);
      }
    } catch (error) {
      console.error("Error reordering trackers:", error);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title="Time Tracker" reorderMode={reorderMode} onToggleReorder={() => setReorderMode((v) => !v)} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trackers.length === 0 ? (
          <EmptyState
            title="No time trackers yet"
            description="Create your first tracker to start logging study time"
            icon={<Clock size={28} />}
          />
        ) : (
          <SortableList
            items={trackers}
            enabled={reorderMode}
            onReorder={handleReorder}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            renderItem={(t, i) => {
              const stats = getTrackerStats(t);
              return (
                <div
                  className={`rounded-2xl bg-white dark:bg-slate-900 p-4 ${reorderMode ? "" : "cursor-pointer hover:shadow-lg dark:hover:shadow-slate-950/30 active:scale-[0.98]"} transition-all duration-200 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => !reorderMode && router.push(`/time-tracker/${t.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} shadow-md ${shadows[i % shadows.length]} flex items-center justify-center text-white shrink-0`}>
                      <Clock size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <Users size={11} />
                          {stats.memberCount}
                        </span>
                        {stats.todayMinutes > 0 && (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Today: {formatMinutes(stats.todayMinutes)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!reorderMode && (
                      <>
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditTracker(t); setName(t.name); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTracker(t)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      </>
                    )}
                  </div>

                  {/* Week summary */}
                  {stats.weekMinutes > 0 && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>This week: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMinutes(stats.weekMinutes)}</span></span>
                      <span>Total: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMinutes(stats.totalMinutes)}</span></span>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      </main>

      {!reorderMode && (
        <button
          onClick={() => { setShowCreate(true); setName(""); }}
          className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-300 dark:shadow-blue-950/30 flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-30"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <BottomNav />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Time Tracker">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Study Time, Coding Practice" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Tracker"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editTracker} onClose={() => setEditTracker(null)} title="Edit Tracker">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTracker}
        onClose={() => setDeleteTracker(null)}
        onConfirm={handleDelete}
        title="Delete Tracker"
        message={`Delete "${deleteTracker?.name}"? All members and time entries will be lost.`}
        loading={saving}
      />
    </div>
  );
}
