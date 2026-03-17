"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Trash2, Pencil, ChevronRight } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";

interface Category {
  id: string;
  name: string;
  icon?: string;
  _count: { subjects: number };
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowCreate(false);
    setSaving(false);
    fetchCategories();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editCategory) return;
    setSaving(true);
    await fetch(`/api/categories/${editCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditCategory(null);
    setSaving(false);
    fetchCategories();
  }

  async function handleDelete() {
    if (!deleteCategory) return;
    setSaving(true);
    await fetch(`/api/categories/${deleteCategory.id}`, { method: "DELETE" });
    setDeleteCategory(null);
    setSaving(false);
    fetchCategories();
  }

  const gradients = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-violet-500 to-violet-600",
  ];

  const shadows = [
    "shadow-blue-200 dark:shadow-blue-950/20",
    "shadow-emerald-200 dark:shadow-emerald-950/20",
    "shadow-amber-200 dark:shadow-amber-950/20",
    "shadow-rose-200 dark:shadow-rose-950/20",
    "shadow-cyan-200 dark:shadow-cyan-950/20",
    "shadow-violet-200 dark:shadow-violet-950/20",
  ];

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title="My Study Room" />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create your first category to get started"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                className={`rounded-2xl bg-white dark:bg-slate-900 p-4 cursor-pointer hover:shadow-lg dark:hover:shadow-slate-950/30 transition-all duration-200 active:scale-[0.98] ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => router.push(`/categories/${cat.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} shadow-md ${shadows[i % shadows.length]} flex items-center justify-center text-white shrink-0`}>
                    <FolderOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{cat.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {cat._count.subjects} {cat._count.subjects === 1 ? "subject" : "subjects"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditCategory(cat); setName(cat.name); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => { setShowCreate(true); setName(""); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-300 dark:shadow-blue-950/30 flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-30"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Frontend, Backend, DevOps" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Category"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title="Edit Category">
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
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${deleteCategory?.name}"? This will also delete all subjects, rooms, and content inside it.`}
        loading={saving}
      />
    </div>
  );
}
