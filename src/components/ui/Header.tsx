"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { ArrowLeft, LogOut, Settings, Eye, EyeOff, ArrowUpDown, Check } from "lucide-react";
import Modal from "./Modal";
import ThemeToggle from "./ThemeToggle";
import { useLongPress } from "@/hooks/useLongPress";

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  reorderMode?: boolean;
  onToggleReorder?: () => void;
}

export default function Header({ title, showBack = false, reorderMode, onToggleReorder }: HeaderProps) {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const longPressHandlers = useLongPress(() => onToggleReorder?.(), 700);

  async function openSettings() {
    setShowSettings(true);
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setNewPasscode("");
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.username) setUsername(data.username);
      if (data.passcode) setNewPasscode(data.passcode);
    } catch {
      // ignore
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setError("Current password is required to make changes");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, currentPassword, newPassword: newPassword || undefined, newPasscode: newPasscode || undefined }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setSuccess(data.message);
    setSaving(false);
    setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 1500);
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 shrink-0 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {title === "My Study Room" ? (
              <div className="flex items-center gap-2.5" {...(onToggleReorder ? longPressHandlers : {})} style={{ userSelect: "none", touchAction: "none" }}>
                <Image src="/icon.png" alt="My Study Room" width={36} height={36} className="rounded-xl object-cover shadow-sm" priority />
                <div className="flex flex-col -space-y-0.5">
                  <h1 className="text-[15px] font-extrabold tracking-tight leading-tight bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-blue-300 dark:to-emerald-400 bg-clip-text text-transparent">
                    MY STUDY ROOM
                  </h1>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                    Study Smarter
                  </span>
                </div>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight" {...(onToggleReorder ? longPressHandlers : {})} style={{ userSelect: "none", touchAction: "none" }}>
                {title}
              </h1>
            )}
            {reorderMode && (
              <button
                onClick={onToggleReorder}
                className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 hover:bg-blue-200 dark:hover:bg-blue-950/60 transition-colors"
              >
                <ArrowUpDown size={12} />
                Reorder
                <Check size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <button
              onClick={openSettings}
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 transition-colors"
              title="Account settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setShowLogout(true)}
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="h-[57px]" />

      {/* Account Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Account Settings">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 ring-1 ring-red-100 dark:ring-red-900/30 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl p-3 ring-1 ring-emerald-100 dark:ring-emerald-900/30 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={INPUT_CLASS}
              placeholder="New username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${INPUT_CLASS} pr-10`}
                placeholder="Required to save changes"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New Password <span className="text-slate-400 dark:text-slate-500 font-normal">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${INPUT_CLASS} pr-10`}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Passcode <span className="text-slate-400 dark:text-slate-500 font-normal">(4 digits)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={newPasscode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setNewPasscode(v);
              }}
              className={INPUT_CLASS}
              placeholder="e.g., 1234"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !currentPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm shadow-blue-200 dark:shadow-blue-950/20 active:scale-[0.98]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>

      {/* Logout Confirmation */}
      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Sign Out">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to sign out?</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowLogout(false)}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </Modal>
    </>
  );
}
