"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardCheck, Trash2, Pencil, ChevronRight, Users, BookOpen } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SortableList from "@/components/ui/SortableList";
import BottomNav from "@/components/ui/BottomNav";

interface SyllabusSummary {
  id: string;
  name: string;
  members: { id: string; name: string; progress: { itemId: string }[] }[];
  topics: { id: string; _count: { items: number } }[];
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

function getSyllabusStats(s: SyllabusSummary) {
  const totalItems = s.topics.reduce((sum, t) => sum + t._count.items, 0);
  const topicCount = s.topics.length;
  const memberCount = s.members.length;

  // Average progress across all members
  let avgPercent = 0;
  if (totalItems > 0 && memberCount > 0) {
    const totalChecked = s.members.reduce((sum, m) => sum + m.progress.length, 0);
    avgPercent = Math.round((totalChecked / (totalItems * memberCount)) * 100);
  }

  return { totalItems, topicCount, memberCount, avgPercent };
}

const gradients = [
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-blue-600",
];

const shadows = [
  "shadow-emerald-200 dark:shadow-emerald-950/20",
  "shadow-violet-200 dark:shadow-violet-950/20",
  "shadow-amber-200 dark:shadow-amber-950/20",
  "shadow-rose-200 dark:shadow-rose-950/20",
  "shadow-cyan-200 dark:shadow-cyan-950/20",
  "shadow-indigo-200 dark:shadow-indigo-950/20",
];

export default function TrackerPage() {
  const [syllabi, setSyllabi] = useState<SyllabusSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSyllabus, setEditSyllabus] = useState<SyllabusSummary | null>(null);
  const [deleteSyllabus, setDeleteSyllabus] = useState<SyllabusSummary | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const router = useRouter();

  const fetchSyllabi = useCallback(async () => {
    const res = await fetch("/api/tracker");
    if (res.ok) {
      const data = await res.json();
      setSyllabi(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSyllabi();
  }, [fetchSyllabi]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowCreate(false);
    setSaving(false);
    fetchSyllabi();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editSyllabus) return;
    setSaving(true);
    await fetch(`/api/tracker/${editSyllabus.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditSyllabus(null);
    setSaving(false);
    fetchSyllabi();
  }

  async function handleDelete() {
    if (!deleteSyllabus) return;
    setSaving(true);
    await fetch(`/api/tracker/${deleteSyllabus.id}`, { method: "DELETE" });
    setDeleteSyllabus(null);
    setSaving(false);
    fetchSyllabi();
  }

  async function handleReorder(reordered: SyllabusSummary[]) {
    setSyllabi(reordered);
    await fetch("/api/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "syllabus",
        items: reordered.map((s, i) => ({ id: s.id, order: i })),
      }),
    });
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title="Syllabus Tracker" reorderMode={reorderMode} onToggleReorder={() => setReorderMode((v) => !v)} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : syllabi.length === 0 ? (
          <EmptyState
            title="No syllabi yet"
            description="Create your first syllabus to start tracking progress"
            icon={<ClipboardCheck size={28} />}
          />
        ) : (
          <SortableList
            items={syllabi}
            enabled={reorderMode}
            onReorder={handleReorder}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            renderItem={(s, i) => {
              const stats = getSyllabusStats(s);
              return (
                <div
                  className={`rounded-2xl bg-white dark:bg-slate-900 p-4 ${reorderMode ? "" : "cursor-pointer hover:shadow-lg dark:hover:shadow-slate-950/30 active:scale-[0.98]"} transition-all duration-200 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => !reorderMode && router.push(`/tracker/${s.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} shadow-md ${shadows[i % shadows.length]} flex items-center justify-center text-white shrink-0`}>
                      <ClipboardCheck size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <BookOpen size={11} />
                          {stats.topicCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <Users size={11} />
                          {stats.memberCount}
                        </span>
                        {stats.totalItems > 0 && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {stats.avgPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    {!reorderMode && (
                      <>
                        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditSyllabus(s); setName(s.name); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteSyllabus(s)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  {stats.totalItems > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                          style={{ width: `${stats.avgPercent}%` }}
                        />
                      </div>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Syllabus">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., FullStack Development, DSA Mastery" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Syllabus"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editSyllabus} onClose={() => setEditSyllabus(null)} title="Edit Syllabus">
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
        open={!!deleteSyllabus}
        onClose={() => setDeleteSyllabus(null)}
        onConfirm={handleDelete}
        title="Delete Syllabus"
        message={`Delete "${deleteSyllabus?.name}"? All topics, items, and progress will be lost.`}
        loading={saving}
      />
    </div>
  );
}
