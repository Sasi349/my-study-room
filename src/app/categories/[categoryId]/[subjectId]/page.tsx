"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Plus, DoorOpen, Trash2, Pencil, ChevronRight, StickyNote, Link2, FileText } from "lucide-react";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";

interface Room {
  id: string;
  name: string;
  _count: { notes: number; links: number; files: number };
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

export default function RoomsPage({
  params,
}: {
  params: Promise<{ categoryId: string; subjectId: string }>;
}) {
  const { categoryId, subjectId } = use(params);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const [roomsRes, subjectsRes] = await Promise.all([
      fetch(`/api/rooms?subjectId=${subjectId}`),
      fetch(`/api/subjects?categoryId=${categoryId}`),
    ]);
    const roomsData = await roomsRes.json();
    const subjectsData = await subjectsRes.json();
    setRooms(roomsData);
    const sub = subjectsData.find((s: { id: string }) => s.id === subjectId);
    if (sub) setSubjectName(sub.name);
    setLoading(false);
  }, [categoryId, subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), subjectId }),
    });
    setName("");
    setShowCreate(false);
    setSaving(false);
    fetchData();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !editRoom) return;
    setSaving(true);
    await fetch(`/api/rooms/${editRoom.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setEditRoom(null);
    setSaving(false);
    fetchData();
  }

  async function handleDelete() {
    if (!deleteRoom) return;
    setSaving(true);
    await fetch(`/api/rooms/${deleteRoom.id}`, { method: "DELETE" });
    setDeleteRoom(null);
    setSaving(false);
    fetchData();
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title={subjectName || "Rooms"} showBack />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            description="Create a room to start adding content"
            icon={<DoorOpen size={28} />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <div
                key={room.id}
                className="rounded-2xl bg-white dark:bg-slate-900 p-4 cursor-pointer hover:shadow-lg dark:hover:shadow-slate-950/30 transition-all duration-200 active:scale-[0.98] ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() =>
                  router.push(`/categories/${categoryId}/${subjectId}/${room.id}`)
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-200 dark:shadow-emerald-950/20 flex items-center justify-center text-white shrink-0">
                    <DoorOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{room.name}</h3>
                    <div className="flex items-center gap-2.5 mt-1">
                      {room._count.notes > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <StickyNote size={11} /> {room._count.notes}
                        </span>
                      )}
                      {room._count.links > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Link2 size={11} /> {room._count.links}
                        </span>
                      )}
                      {room._count.files > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <FileText size={11} /> {room._count.files}
                        </span>
                      )}
                      {room._count.notes + room._count.links + room._count.files === 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Empty</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditRoom(room); setName(room.name); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteRoom(room)}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Navigation, Middleware, Hooks" className={INPUT_CLASS} autoFocus />
          </div>
          <button type="submit" disabled={saving || !name.trim()} className={BTN_PRIMARY}>
            {saving ? "Creating..." : "Create Room"}
          </button>
        </form>
      </Modal>

      <Modal open={!!editRoom} onClose={() => setEditRoom(null)} title="Edit Room">
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
        open={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Delete "${deleteRoom?.name}"? All notes, links, and files inside will be deleted.`}
        loading={saving}
      />
    </div>
  );
}
