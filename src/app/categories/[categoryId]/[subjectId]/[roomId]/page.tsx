"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Plus,
  StickyNote,
  Link2,
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
  ExternalLink,
  Download,
  Upload,
  X,
  Eye,
  Clock,
} from "lucide-react";
import NextImage from "next/image";
import Header from "@/components/ui/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { formatFileSize } from "@/lib/utils";

type Tab = "notes" | "links" | "files" | "images";

interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkItem {
  id: string;
  title?: string;
  url: string;
  createdAt: string;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  type: string;
  createdAt: string;
}

interface RoomData {
  id: string;
  name: string;
  notes: Note[];
  links: LinkItem[];
  files: FileItem[];
  subject: { name: string; category: { name: string } };
}

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";
const BTN_PRIMARY = "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]";

export default function RoomPage({
  params,
}: {
  params: Promise<{ categoryId: string; subjectId: string; roomId: string }>;
}) {
  const { roomId } = use(params);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("notes");

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    type: "note" | "link" | "file";
    id: string;
    name: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<FileItem | null>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}`);
    const data = await res.json();
    setRoom(data);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const images = room?.files.filter((f) => f.type === "image") ?? [];
  const docs = room?.files.filter((f) => f.type === "file") ?? [];

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSaving(true);
    if (editNote) {
      await fetch(`/api/notes/${editNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle.trim() || null, content: noteContent.trim() }),
      });
    } else {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle.trim() || null, content: noteContent.trim(), roomId }),
      });
    }
    resetNoteForm();
    setSaving(false);
    fetchRoom();
  }

  function resetNoteForm() {
    setNoteTitle("");
    setNoteContent("");
    setEditNote(null);
    setShowNoteModal(false);
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    setSaving(true);
    await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle.trim() || null, url: linkUrl.trim(), roomId }),
    });
    setLinkTitle("");
    setLinkUrl("");
    setShowLinkModal(false);
    setSaving(false);
    fetchRoom();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);
      await fetch("/api/files", { method: "POST", body: formData });
    }
    setUploading(false);
    setShowUploadModal(false);
    fetchRoom();
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setSaving(true);
    const endpoint =
      deleteItem.type === "note"
        ? `/api/notes/${deleteItem.id}`
        : deleteItem.type === "link"
          ? `/api/links/${deleteItem.id}`
          : `/api/files/${deleteItem.id}`;
    await fetch(endpoint, { method: "DELETE" });
    setDeleteItem(null);
    setSaving(false);
    fetchRoom();
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "notes", label: "Notes", icon: <StickyNote size={16} />, count: room?.notes.length ?? 0 },
    { key: "links", label: "Links", icon: <Link2 size={16} />, count: room?.links.length ?? 0 },
    { key: "files", label: "Files", icon: <FileText size={16} />, count: docs.length },
    { key: "images", label: "Images", icon: <ImageIcon size={16} />, count: images.length },
  ];

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

  if (!room) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header title="Not Found" showBack />
        <EmptyState title="Room not found" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header title={room.name} showBack />

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-[57px] z-30">
        <div className="max-w-4xl mx-auto flex px-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            {room.notes.length === 0 ? (
              <EmptyState title="No notes yet" description="Add a note to get started" icon={<StickyNote size={28} />} />
            ) : (
              room.notes.map((note, i) => (
                <div key={note.id} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 animate-fade-in overflow-hidden" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {note.title || "Untitled Note"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed mt-1.5">{note.content}</p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Clock size={11} />
                      {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setEditNote(note);
                          setNoteTitle(note.title || "");
                          setNoteContent(note.content);
                          setShowNoteModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteItem({ type: "note", id: note.id, name: note.title || "Untitled Note" })}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="space-y-2">
            {room.links.length === 0 ? (
              <EmptyState title="No links yet" description="Save useful links here" icon={<Link2 size={28} />} />
            ) : (
              room.links.map((link, i) => (
                <div key={link.id} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Link2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {link.title || link.url}
                      </h3>
                      {link.title && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{link.url}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button
                      onClick={() => setDeleteItem({ type: "link", id: link.id, name: link.title || link.url })}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="space-y-2">
            {docs.length === 0 ? (
              <EmptyState title="No files yet" description="Upload PDFs and documents" icon={<FileText size={28} />} />
            ) : (
              docs.map((file, i) => (
                <div key={file.id} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 p-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <a href={file.path} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Eye size={15} />
                    </a>
                    <a href={file.path} download={file.name} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                      <Download size={15} />
                    </a>
                    <button onClick={() => setDeleteItem({ type: "file", id: file.id, name: file.name })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-3">
            {images.length === 0 ? (
              <EmptyState title="No images yet" description="Upload screenshots and diagrams" icon={<ImageIcon size={28} />} />
            ) : (
              images.map((img, i) => (
                <div key={img.id} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm dark:shadow-slate-950/20 overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="w-full cursor-pointer" onClick={() => setPreviewImage(img)}>
                    <NextImage src={img.path} alt={img.name} width={800} height={400} className="w-full max-h-64 object-contain bg-slate-50 dark:bg-slate-800" unoptimized />
                  </div>
                  <div className="flex items-center justify-between p-3.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{img.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatFileSize(img.size)}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => setPreviewImage(img)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="View full screen">
                        <Eye size={15} />
                      </button>
                      <a href={img.path} download={img.name} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors" title="Download">
                        <Download size={15} />
                      </a>
                      <button onClick={() => setDeleteItem({ type: "file", id: img.id, name: img.name })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => {
          if (activeTab === "notes") { setEditNote(null); setNoteTitle(""); setNoteContent(""); setShowNoteModal(true); }
          else if (activeTab === "links") { setLinkTitle(""); setLinkUrl(""); setShowLinkModal(true); }
          else { setShowUploadModal(true); }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-300 dark:shadow-blue-950/30 flex items-center justify-center hover:shadow-xl active:scale-95 transition-all z-30"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Note Modal */}
      <Modal open={showNoteModal} onClose={resetNoteForm} title={editNote ? "Edit Note" : "New Note"}>
        <form onSubmit={handleSaveNote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Optional" className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Content</label>
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." rows={6} className={`${INPUT_CLASS} resize-none`} autoFocus />
          </div>
          <button type="submit" disabled={saving || !noteContent.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : editNote ? "Update Note" : "Save Note"}
          </button>
        </form>
      </Modal>

      {/* Link Modal */}
      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Add Link">
        <form onSubmit={handleSaveLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input type="text" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Optional" className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL</label>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className={INPUT_CLASS} autoFocus required />
          </div>
          <button type="submit" disabled={saving || !linkUrl.trim()} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save Link"}
          </button>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title={activeTab === "images" ? "Upload Images" : "Upload Files"}>
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/30 flex items-center justify-center mb-3 transition-colors">
              <Upload size={22} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {uploading ? "Uploading..." : "Tap to select files"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {activeTab === "images" ? "PNG, JPG, GIF, WebP" : "PDF, DOC, TXT, etc."}
            </p>
            <input type="file" multiple accept={activeTab === "images" ? "image/*" : "*/*"} onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      </Modal>

      {/* Full Screen Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setPreviewImage(null)}>
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-b from-black/60 to-transparent" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-white text-sm font-medium truncate">{previewImage.name}</p>
              <p className="text-white/50 text-xs">{formatFileSize(previewImage.size)}</p>
            </div>
            <button className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl shrink-0 transition-colors" onClick={() => setPreviewImage(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <NextImage src={previewImage.path} alt={previewImage.name} width={1200} height={800} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} unoptimized />
          </div>
          <div className="flex items-center justify-center gap-4 px-4 py-4 bg-gradient-to-t from-black/60 to-transparent" onClick={(e) => e.stopPropagation()}>
            {images.length > 1 && (
              <p className="text-white/40 text-xs absolute left-4 font-medium">
                {images.findIndex((i) => i.id === previewImage.id) + 1} / {images.length}
              </p>
            )}
            <a href={previewImage.path} download={previewImage.name} className="flex items-center gap-2 bg-white text-slate-900 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg hover:bg-slate-50 active:scale-95 transition-all">
              <Download size={16} />
              Download
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteItem?.type}`}
        message={`Delete "${deleteItem?.name}"? This cannot be undone.`}
        loading={saving}
      />
    </div>
  );
}
