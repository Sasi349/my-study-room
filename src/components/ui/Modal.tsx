"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed z-50 m-auto inset-0 w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-4rem)] rounded-2xl bg-white dark:bg-slate-900 p-0 shadow-2xl dark:shadow-slate-950/20 ring-1 ring-black/5 dark:ring-slate-700/60 backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
