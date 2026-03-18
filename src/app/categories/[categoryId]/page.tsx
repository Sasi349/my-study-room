"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Trash2, Pencil, ChevronRight } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SortableList from "@/components/ui/SortableList";

interface Subject {
  id: string;
  name: string;
  categoryId: string;
  _count: { rooms: number };
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

export default function SubjectsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = use(params);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const [subjectsRes, categoriesRes] = await Promise.all([
      fetch(`/api/subjects?categoryId=${categoryId}`),
      fetch("/api/categories"),
    ]);
    const subjectsData = await subjectsRes.json();
    const categoriesData = await categoriesRes.json();
    setSubjects(subjectsData);
    const cat = categoriesData.find((c: { id: string }) => c.id === categoryId);
    if (cat) setCategoryName(cat.name);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), categoryId }),
    });
    setName("");
    setShowCreate(false);
    setSaving(false);
    fetchData();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editSubject) return;
    setSaving(true);
    await fetch(`/api/subjects/${editSubject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditSubject(null);
    setSaving(false);
    fetchData();
  }

  async function handleReorder(reordered: Subject[]) {
    setSubjects(reordered);
    await fetch("/api/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "subject",
        items: reordered.map((s, i) => ({ id: s.id, order: i })),
      }),
    });
  }

  async function handleDelete() {
    if (!deleteSubject) return;
    setSaving(true);
    await fetch(`/api/subjects/${deleteSubject.id}`, { method: "DELETE" });
    setDeleteSubject(null);
    setSaving(false);
    fetchData();
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title={categoryName || "Subjects"} showBack reorderMode={reorderMode} onToggleReorder={() => setReorderMode((v) => !v)} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects yet"
            description="Create a subject to organize your learning"
            icon={<BookOpen size={28} />}
          />
        ) : (
          <SortableList
            items={subjects}
            enabled={reorderMode}
            onReorder={handleReorder}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            renderItem={(sub, i) => (
              <div
                className={`rounded-2xl bg-white dark:bg-slate-900 p-4 ${reorderMode ? "" : "cursor-pointer hover:shadow-lg dark:hover:shadow-slate-950/30 active:scale-[0.98]"} transition-all duration-200 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => !reorderMode && router.push(`/categories/${categoryId}/${sub.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-950/20 flex items-center justify-center text-white shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{sub.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sub._count.rooms} {sub._count.rooms === 1 ? "room" : "rooms"}
                    </p>
                  </div>
                  {!reorderMode && (
                    <>
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditSubject(sub); setName(sub.name); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteSubject(sub)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    </>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </main>

      {!reorderMode && (
        <button
          onClick={() => { setShowCreate(true); setName(""); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-300 dark:shadow-blue-950/30 flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-30"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Subject">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., NextJS, ExpressJS, PostgreSQL" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Subject"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title="Edit Subject">
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
        open={!!deleteSubject}
        onClose={() => setDeleteSubject(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message={`Delete "${deleteSubject?.name}"? This will also delete all rooms and content inside it.`}
        loading={saving}
      />
    </div>
  );
}
