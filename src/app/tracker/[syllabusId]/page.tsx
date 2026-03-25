"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus, Trash2, Pencil, ChevronDown, ChevronRight, Check,
  Users, UserPlus, X, BookOpen,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SortableList from "@/components/ui/SortableList";

interface Progress {
  id: string;
  memberId: string;
}

interface TrackerItem {
  id: string;
  name: string;
  order: number;
  progress: Progress[];
}

interface TrackerTopic {
  id: string;
  name: string;
  order: number;
  items: TrackerItem[];
}

interface TrackerMember {
  id: string;
  name: string;
  progress: { itemId: string }[];
}

interface Syllabus {
  id: string;
  name: string;
  members: TrackerMember[];
  topics: TrackerTopic[];
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

function topicProgress(topic: TrackerTopic, memberId: string) {
  const total = topic.items.length;
  const checked = topic.items.filter((item) =>
    item.progress.some((p) => p.memberId === memberId)
  ).length;
  return { checked, total, percent: total === 0 ? 0 : Math.round((checked / total) * 100) };
}

function overallProgress(topics: TrackerTopic[], memberId: string) {
  let totalChecked = 0;
  let totalItems = 0;
  for (const topic of topics) {
    const p = topicProgress(topic, memberId);
    totalChecked += p.checked;
    totalItems += p.total;
  }
  return { checked: totalChecked, total: totalItems, percent: totalItems === 0 ? 0 : Math.round((totalChecked / totalItems) * 100) };
}

export default function SyllabusDetailPage() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [reorderMode, setReorderMode] = useState(false);

  // Modal states
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null); // topicId
  const [showAddMember, setShowAddMember] = useState(false);
  const [editTopic, setEditTopic] = useState<TrackerTopic | null>(null);
  const [editItem, setEditItem] = useState<TrackerItem | null>(null);
  const [editMember, setEditMember] = useState<TrackerMember | null>(null);
  const [deleteTopic, setDeleteTopic] = useState<TrackerTopic | null>(null);
  const [deleteItem, setDeleteItem] = useState<TrackerItem | null>(null);
  const [deleteMember, setDeleteMember] = useState<TrackerMember | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSyllabus = useCallback(async () => {
    const res = await fetch(`/api/tracker/${syllabusId}`);
    if (res.ok) {
      const data: Syllabus = await res.json();
      setSyllabus(data);
      // Auto-select first member if none selected or selected was deleted
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
  }, [syllabusId]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  function toggleTopic(topicId: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  async function toggleItem(itemId: string) {
    if (!selectedMemberId || !syllabus) return;

    // Optimistic update
    setSyllabus((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topics: prev.topics.map((t) => ({
          ...t,
          items: t.items.map((item) => {
            if (item.id !== itemId) return item;
            const hasProgress = item.progress.some((p) => p.memberId === selectedMemberId);
            return {
              ...item,
              progress: hasProgress
                ? item.progress.filter((p) => p.memberId !== selectedMemberId)
                : [...item.progress, { id: `temp-${Date.now()}`, memberId: selectedMemberId }],
            };
          }),
        })),
      };
    });

    await fetch("/api/tracker/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedMemberId, itemId }),
    });
  }

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/tracker/${syllabusId}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowAddTopic(false);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !showAddItem) return;
    setSaving(true);
    await fetch(`/api/tracker/topics/${showAddItem}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowAddItem(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/tracker/${syllabusId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setShowAddMember(false);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleEditTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editTopic) return;
    setSaving(true);
    await fetch(`/api/tracker/topics/${editTopic.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditTopic(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleEditItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editItem) return;
    setSaving(true);
    await fetch(`/api/tracker/items/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditItem(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editMember) return;
    setSaving(true);
    await fetch(`/api/tracker/members/${editMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditMember(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleDeleteTopic() {
    if (!deleteTopic) return;
    setSaving(true);
    await fetch(`/api/tracker/topics/${deleteTopic.id}`, { method: "DELETE" });
    setDeleteTopic(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleDeleteItem() {
    if (!deleteItem) return;
    setSaving(true);
    await fetch(`/api/tracker/items/${deleteItem.id}`, { method: "DELETE" });
    setDeleteItem(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleDeleteMember() {
    if (!deleteMember) return;
    setSaving(true);
    await fetch(`/api/tracker/members/${deleteMember.id}`, { method: "DELETE" });
    setDeleteMember(null);
    setSaving(false);
    fetchSyllabus();
  }

  async function handleReorderTopics(reordered: TrackerTopic[]) {
    if (!syllabus) return;
    setSyllabus({ ...syllabus, topics: reordered });
    await fetch("/api/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "trackerTopic",
        items: reordered.map((t, i) => ({ id: t.id, order: i })),
      }),
    });
  }

  async function handleReorderItems(topicId: string, reordered: TrackerItem[]) {
    if (!syllabus) return;
    setSyllabus({
      ...syllabus,
      topics: syllabus.topics.map((t) =>
        t.id === topicId ? { ...t, items: reordered } : t
      ),
    });
    await fetch("/api/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "trackerItem",
        items: reordered.map((item, i) => ({ id: item.id, order: i })),
      }),
    });
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

  if (!syllabus) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header title="Not Found" showBack />
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500 dark:text-slate-400">Syllabus not found</p>
        </div>
      </div>
    );
  }

  const overall = selectedMemberId ? overallProgress(syllabus.topics, selectedMemberId) : null;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title={syllabus.name} showBack reorderMode={reorderMode} onToggleReorder={() => setReorderMode((v) => !v)} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Member Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {syllabus.members.map((member) => {
              const isActive = member.id === selectedMemberId;
              return (
                <div key={member.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
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

        {/* Overall Progress */}
        {overall && selectedMemberId && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Progress</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{overall.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${overall.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              {overall.checked} of {overall.total} items completed
            </p>
          </div>
        )}

        {/* No members prompt */}
        {syllabus.members.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mx-auto mb-2">
              <UserPlus size={20} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Add members to start tracking progress
            </p>
            <button
              onClick={() => { setShowAddMember(true); setName(""); }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Add First Member
            </button>
          </div>
        )}

        {/* Topics */}
        <SortableList
          items={syllabus.topics}
          enabled={reorderMode}
          onReorder={handleReorderTopics}
          className="space-y-3"
          renderItem={(topic) => {
            const isExpanded = expandedTopics.has(topic.id);
            const tp = selectedMemberId ? topicProgress(topic, selectedMemberId) : null;

            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 overflow-hidden">
                {/* Topic Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !reorderMode && toggleTopic(topic.id)}
                  onKeyDown={(e) => { if (!reorderMode && (e.key === "Enter" || e.key === " ")) toggleTopic(topic.id); }}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${reorderMode ? "cursor-default" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <BookOpen size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {topic.name}
                      </span>
                      {tp && tp.total > 0 && (
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                          {tp.checked}/{tp.total}
                        </span>
                      )}
                    </div>
                    {tp && tp.total > 0 && (
                      <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            tp.percent === 100
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                          style={{ width: `${tp.percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!reorderMode && (
                    <>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditTopic(topic); setName(topic.name); }}
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTopic(topic)}
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400 shrink-0" />
                      )}
                    </>
                  )}
                </div>

                {/* Items */}
                {isExpanded && !reorderMode && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {topic.items.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">No items yet</p>
                      </div>
                    ) : (
                      <SortableList
                        items={topic.items}
                        enabled={false}
                        onReorder={(reordered) => handleReorderItems(topic.id, reordered)}
                        renderItem={(item) => {
                          const isChecked = selectedMemberId
                            ? item.progress.some((p) => p.memberId === selectedMemberId)
                            : false;

                          return (
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleItem(item.id)}
                                disabled={!selectedMemberId}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
                                } ${!selectedMemberId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
                              >
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </button>

                              <span
                                className={`text-sm flex-1 min-w-0 truncate transition-colors ${
                                  isChecked
                                    ? "text-slate-400 dark:text-slate-500 line-through"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {item.name}
                              </span>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={() => { setEditItem(item); setName(item.name); }}
                                  className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => setDeleteItem(item)}
                                  className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}

                    {/* Add Item inline button */}
                    <button
                      onClick={() => { setShowAddItem(topic.id); setName(""); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors border-t border-slate-100 dark:border-slate-800"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        />

        {/* Add Topic button */}
        <button
          onClick={() => { setShowAddTopic(true); setName(""); }}
          className="w-full rounded-2xl ring-1 ring-dashed ring-slate-200 dark:ring-slate-700 p-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:ring-blue-300 dark:hover:ring-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Topic
        </button>
      </main>

      {/* --- Modals --- */}

      {/* Add Topic */}
      <Modal open={showAddTopic} onClose={() => setShowAddTopic(false)} title="New Topic">
        <form onSubmit={handleAddTopic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., NextJS, Tailwind, Redis" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Adding..." : "Add Topic"}
          </button>
        </form>
      </Modal>

      {/* Add Item */}
      <Modal open={!!showAddItem} onClose={() => setShowAddItem(null)} title="New Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Navigation, Data Fetching, Mutation" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Adding..." : "Add Item"}
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

      {/* Edit Topic */}
      <Modal open={!!editTopic} onClose={() => setEditTopic(null)} title="Edit Topic">
        <form onSubmit={handleEditTopic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Edit Item */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        <form onSubmit={handleEditItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Changes"}
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
        open={!!deleteTopic}
        onClose={() => setDeleteTopic(null)}
        onConfirm={handleDeleteTopic}
        title="Delete Topic"
        message={`Delete "${deleteTopic?.name}"? All items and progress will be lost.`}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        message={`Delete "${deleteItem?.name}"?`}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        onConfirm={handleDeleteMember}
        title="Remove Member"
        message={`Remove "${deleteMember?.name}"? Their progress will be lost.`}
        confirmLabel="Remove"
        loading={saving}
      />
    </div>
  );
}
