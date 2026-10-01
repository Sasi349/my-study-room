"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, UserPlus, Users, X } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ARTICLE_PARTS, TOTAL_ARTICLES } from "@/lib/constitution-articles";
import { cn } from "cn";

interface ArticleMember {
  id: string;
  name: string;
  completed: string[];
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";
const PANEL_CLASS = "bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20";

export default function ArticlesPage() {
  const [members, setMembers] = useState<ArticleMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddMember, setShowAddMember] = useState(false);
  const [editMember, setEditMember] = useState<ArticleMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<ArticleMember | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function applyMembers(data: { members: ArticleMember[] }) {
    setMembers(data.members);
    // Keep the current selection if that member still exists, else pick the first one
    setSelectedMemberId((prev) =>
      prev && data.members.some((m) => m.id === prev) ? prev : data.members[0]?.id ?? ""
    );
  }

  async function refreshMembers() {
    const res = await fetch("/api/articles");
    if (res.ok) applyMembers(await res.json());
  }

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && applyMembers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;
  const completed = useMemo(() => new Set(selectedMember?.completed ?? []), [selectedMember]);

  function setLocalArticle(memberId: string, articleId: string, checked: boolean) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const rest = m.completed.filter((id) => id !== articleId);
        return { ...m, completed: checked ? [...rest, articleId] : rest };
      })
    );
  }

  async function setArticle(articleId: string, checked: boolean) {
    if (!selectedMemberId) return;
    const memberId = selectedMemberId;

    // Optimistic update; roll back if the save fails
    setLocalArticle(memberId, articleId, checked);
    const res = await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, articleId, completed: checked }),
    }).catch(() => null);
    if (!res?.ok) setLocalArticle(memberId, articleId, !checked);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/articles/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const created: { id: string } = await res.json();
      setSelectedMemberId(created.id);
    }
    setName("");
    setShowAddMember(false);
    setSaving(false);
    refreshMembers();
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editMember) return;
    setSaving(true);
    await fetch(`/api/articles/members/${editMember.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditMember(null);
    setSaving(false);
    refreshMembers();
  }

  async function handleDeleteMember() {
    if (!deleteMember) return;
    setSaving(true);
    await fetch(`/api/articles/members/${deleteMember.id}`, { method: "DELETE" });
    setDeleteMember(null);
    setSaving(false);
    refreshMembers();
  }

  const doneCount = completed.size;
  const percent = Math.round((doneCount / TOTAL_ARTICLES) * 100);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title="Articles" showBack />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Member Selector */}
            <div className={`${PANEL_CLASS} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Members</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {members.map((member) => {
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
                        aria-label={`Rename ${member.name}`}
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => setDeleteMember(member)}
                        className="p-0.5 rounded text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${member.name}`}
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
            {members.length === 0 && (
              <div className={`${PANEL_CLASS} p-6 text-center`}>
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

            {/* Overall Progress (selected member) */}
            {selectedMember && (
              <Card className="gap-3 rounded-2xl border-0 py-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60">
                <CardHeader className="px-4">
                  <CardTitle className="text-base">இந்திய அரசியலமைப்பு – சரத்துகள்</CardTitle>
                  <CardDescription className="text-xs">
                    Ticking for <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedMember.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{doneCount}</span> / {TOTAL_ARTICLES} completed
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{percent}%</span>
                  </div>
                  <Progress value={percent} />
                </CardContent>
              </Card>
            )}

            {ARTICLE_PARTS.map((part, i) => {
              const partDone = part.articles.filter((a) => completed.has(a.id)).length;
              const allDone = partDone === part.articles.length;
              return (
                <Card
                  key={part.id}
                  className="gap-0 rounded-2xl border-0 py-0 overflow-hidden ring-1 ring-slate-200/60 dark:ring-slate-700/60 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <CardHeader className="px-4 py-3 border-b bg-slate-50/60 dark:bg-slate-800/30">
                    <CardDescription className="text-xs font-semibold text-blue-600 dark:text-blue-400">{part.part}</CardDescription>
                    <CardTitle className="text-sm leading-snug">{part.title}</CardTitle>
                    {selectedMember && (
                      <CardAction>
                        <Badge
                          variant={allDone ? "default" : "secondary"}
                          className={cn(allDone && "bg-emerald-600 text-white dark:bg-emerald-500")}
                        >
                          {partDone}/{part.articles.length}
                        </Badge>
                      </CardAction>
                    )}
                  </CardHeader>
                  <CardContent className="px-0">
                    <ul className="divide-y">
                      {part.articles.map((article) => {
                        const checked = completed.has(article.id);
                        const inputId = `article-${article.id}`;
                        return (
                          <li key={article.id}>
                            <label
                              htmlFor={inputId}
                              className={cn(
                                "flex items-start gap-3 px-4 py-3 transition-colors",
                                selectedMember
                                  ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800/60"
                                  : "cursor-default"
                              )}
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                disabled={!selectedMember}
                                onCheckedChange={(value) => setArticle(article.id, value === true)}
                                className="mt-0.5 size-5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={cn("text-xs font-semibold", checked ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")}>
                                  சரத்து {article.id}
                                </div>
                                <p
                                  className={cn(
                                    "text-sm leading-relaxed",
                                    checked
                                      ? "text-muted-foreground line-through decoration-slate-300 dark:decoration-slate-600"
                                      : "text-slate-700 dark:text-slate-200"
                                  )}
                                >
                                  {article.text}
                                </p>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </main>

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
